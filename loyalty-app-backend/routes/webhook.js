const express = require('express');
const supabase = require('../db');
const { verifyWebhookSignature } = require('../razorpayClient');

const router = express.Router();

// RazorpayX calls this whenever a payout's status changes. We MUST verify
// the signature - without it, anyone who finds this URL could fake a
// "payout succeeded" call and trick us into deducting points incorrectly.
router.post('/webhooks/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature || !verifyWebhookSignature(req.rawBody, signature)) {
    console.error('Webhook signature mismatch - rejecting');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;
  const payoutEntity = req.body.payload?.payout?.entity;

  if (!payoutEntity) {
    return res.json({ status: 'ignored' });
  }

  const razorpayPayoutId = payoutEntity.id;

  const { data: redemption, error: fetchError } = await supabase
    .from('redemption_requests')
    .select('*')
    .eq('razorpay_payout_id', razorpayPayoutId)
    .single();

  if (fetchError || !redemption) {
    console.error('Webhook: no matching redemption_request for payout', razorpayPayoutId);
    return res.json({ status: 'no matching redemption found' });
  }

  if (redemption.status !== 'pending') {
    return res.json({ status: 'already processed' });
  }

  if (event === 'payout.processed') {
    await supabase
      .from('redemption_requests')
      .update({ status: 'completed', updated_at: new Date() })
      .eq('id', redemption.id);

    // Only now do we actually deduct the points from the real balance.
    await supabase.rpc('increment_user_points', {
      p_user_id: redemption.user_id,
      p_amount: -redemption.points_redeemed,
    });
  } else if (event === 'payout.failed' || event === 'payout.reversed') {
    await supabase
      .from('redemption_requests')
      .update({
        status: 'failed',
        failure_reason: payoutEntity.status_details?.description || event,
        updated_at: new Date(),
      })
      .eq('id', redemption.id);
    // No points to give back - we never deducted them until payout.processed.
  }

  res.json({ status: 'ok' });
});

module.exports = router;
