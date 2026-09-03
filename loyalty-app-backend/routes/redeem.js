// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');
// const { createPayout } = require('../razorpayClient');

// const router = express.Router();

// const POINTS_PER_UNIT = 100;
// const RUPEES_PER_UNIT = 10;
// const MIN_REDEEM_POINTS = 500; // = ₹50 - stops tiny/spammy payouts eating fees

// router.post('/wallet/redeem', requireAuth, async (req, res) => {
//   const { points } = req.body;

//   if (!points || !Number.isInteger(points) || points <= 0) {
//     return res.status(400).json({ error: 'Valid points amount required' });
//   }
//   if (points < MIN_REDEEM_POINTS) {
//     return res.status(400).json({ error: `Minimum ${MIN_REDEEM_POINTS} points required to redeem` });
//   }
//   if (points % POINTS_PER_UNIT !== 0) {
//     return res.status(400).json({ error: `Points must be in multiples of ${POINTS_PER_UNIT}` });
//   }

//   // 1. Do they have a saved payout method, fully set up with RazorpayX?
//   const { data: bankDetails, error: bankError } = await supabase
//     .from('bank_details')
//     .select('*')
//     .eq('user_id', req.userId)
//     .single();

//   if (bankError || !bankDetails) {
//     return res.status(400).json({ error: 'Please add your bank/UPI details before redeeming' });
//   }
//   if (!bankDetails.razorpay_fund_account_id) {
//     return res.status(400).json({ error: 'Your payout details are not fully set up yet. Please re-save them.' });
//   }

//   // 2. Do they have enough *available* points right now?
//   const { data: available, error: availError } = await supabase.rpc('get_available_points', {
//     p_user_id: req.userId,
//   });

//   if (availError) {
//     console.error('Supabase get_available_points error:', availError);
//     return res.status(500).json({ error: 'Could not verify your points balance' });
//   }
//   if (available < points) {
//     return res.status(400).json({ error: `You only have ${available} points available to redeem` });
//   }

//   // 3. Create the pending request. This insert IS the "lock" -
//   //    get_available_points subtracts anything with status='pending'.
//   const amountInr = (points / POINTS_PER_UNIT) * RUPEES_PER_UNIT;

//   const { data: redemption, error: insertError } = await supabase
//     .from('redemption_requests')
//     .insert({
//       user_id: req.userId,
//       points_redeemed: points,
//       amount_inr: amountInr,
//       status: 'pending',
//     })
//     .select()
//     .single();

//   if (insertError) {
//     console.error('Supabase redemption insert error:', insertError);
//     return res.status(500).json({ error: 'Could not create redemption request' });
//   }

//   // 4. Actually trigger the RazorpayX payout.
//   try {
//     const payout = await createPayout({
//       fundAccountId: bankDetails.razorpay_fund_account_id,
//       amountInr,
//       referenceId: redemption.id, // lets the webhook match this back to our row
//     });

//     await supabase
//       .from('redemption_requests')
//       .update({ razorpay_payout_id: payout.id, updated_at: new Date() })
//       .eq('id', redemption.id);
//   } catch (payoutError) {
//     console.error('RazorpayX payout error:', payoutError.razorpayError || payoutError);
//     await supabase
//       .from('redemption_requests')
//       .update({
//         status: 'failed',
//         failure_reason: payoutError.razorpayError?.description || 'Payout could not be created',
//         updated_at: new Date(),
//       })
//       .eq('id', redemption.id);
//     return res.status(500).json({ error: 'Could not process your redemption. Please try again.' });
//   }

//   // Status stays 'pending' on purpose - the webhook flips it to 'completed'
//   // once RazorpayX confirms the money actually moved.
//   res.json({
//     message: 'Redemption request submitted',
//     redemptionId: redemption.id,
//     pointsRedeemed: redemption.points_redeemed,
//     amountInr: redemption.amount_inr,
//     status: 'pending',
//   });
// });

// module.exports = router;


























// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');
// const { createPayout } = require('../razorpayClient');

// const router = express.Router();

// const POINTS_PER_UNIT = 100;
// const RUPEES_PER_UNIT = 10;
// const MIN_REDEEM_POINTS = 500; // = ₹50 - stops tiny/spammy payouts eating fees

// router.post('/wallet/redeem', requireAuth, async (req, res) => {
//   const { points } = req.body;

//   if (!points || !Number.isInteger(points) || points <= 0) {
//     return res.status(400).json({ error: 'Valid points amount required' });
//   }
//   if (points < MIN_REDEEM_POINTS) {
//     return res.status(400).json({ error: `Minimum ${MIN_REDEEM_POINTS} points required to redeem` });
//   }
//   if (points % POINTS_PER_UNIT !== 0) {
//     return res.status(400).json({ error: `Points must be in multiples of ${POINTS_PER_UNIT}` });
//   }

//   // 1. Do they have a saved payout method, fully set up with RazorpayX?
//   const { data: bankDetails, error: bankError } = await supabase
//     .from('bank_details')
//     .select('*')
//     .eq('user_id', req.userId)
//     .single();

//   if (bankError || !bankDetails) {
//     return res.status(400).json({ error: 'Please add your bank/UPI details before redeeming' });
//   }
//   if (!bankDetails.razorpay_fund_account_id) {
//     return res.status(400).json({ error: 'Your payout details are not fully set up yet. Please re-save them.' });
//   }

//   // 2. Do they have enough *available* points right now?
//   const { data: available, error: availError } = await supabase.rpc('get_available_points', {
//     p_user_id: req.userId,
//   });

//   if (availError) {
//     console.error('Supabase get_available_points error:', availError);
//     return res.status(500).json({ error: 'Could not verify your points balance' });
//   }
//   if (available < points) {
//     return res.status(400).json({ error: `You only have ${available} points available to redeem` });
//   }

//   // 3. Create the pending request. This insert IS the "lock" -
//   //    get_available_points subtracts anything with status='pending'.
//   const amountInr = (points / POINTS_PER_UNIT) * RUPEES_PER_UNIT;

//   const { data: redemption, error: insertError } = await supabase
//     .from('redemption_requests')
//     .insert({
//       user_id: req.userId,
//       points_redeemed: points,
//       amount_inr: amountInr,
//       status: 'pending',
//     })
//     .select()
//     .single();

//   if (insertError) {
//     console.error('Supabase redemption insert error:', insertError);
//     return res.status(500).json({ error: 'Could not create redemption request' });
//   }

//   // 4. Actually trigger the RazorpayX payout.
//   //    Mode has to match the fund account's type - UPI fund accounts (vpa)
//   //    need mode: 'UPI', bank_account fund accounts need IMPS/NEFT/RTGS.
//   //    Sending UPI mode against a bank_account fund account is a hard
//   //    RazorpayX validation error (BAD_REQUEST_ERROR / input_validation_failed).
//   const payoutMode = bankDetails.method === 'upi' ? 'UPI' : 'IMPS';

//   try {
//     const payout = await createPayout({
//       fundAccountId: bankDetails.razorpay_fund_account_id,
//       amountInr,
//       referenceId: redemption.id, // lets the webhook match this back to our row
//       mode: payoutMode,
//     });

//     await supabase
//       .from('redemption_requests')
//       .update({ razorpay_payout_id: payout.id, updated_at: new Date() })
//       .eq('id', redemption.id);
//   } catch (payoutError) {
//     console.error('RazorpayX payout error:', payoutError.razorpayError || payoutError);
//     await supabase
//       .from('redemption_requests')
//       .update({
//         status: 'failed',
//         failure_reason: payoutError.razorpayError?.description || 'Payout could not be created',
//         updated_at: new Date(),
//       })
//       .eq('id', redemption.id);
//     return res.status(500).json({ error: 'Could not process your redemption. Please try again.' });
//   }

//   // Status stays 'pending' on purpose - the webhook flips it to 'completed'
//   // once RazorpayX confirms the money actually moved.
//   res.json({
//     message: 'Redemption request submitted',
//     redemptionId: redemption.id,
//     pointsRedeemed: redemption.points_redeemed,
//     amountInr: redemption.amount_inr,
//     status: 'pending',
//   });
// });

// module.exports = router;




















































const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');
const { createPayout } = require('../razorpayClient');

const router = express.Router();

const POINTS_PER_UNIT = 1;
const RUPEES_PER_UNIT = 1;
const MIN_REDEEM_POINTS = 500; // = ₹500 - stops tiny/spammy payouts eating fees

router.post('/wallet/redeem', requireAuth, async (req, res) => {
  const { points } = req.body;

  if (!points || !Number.isInteger(points) || points <= 0) {
    return res.status(400).json({ error: 'Valid points amount required' });
  }
  if (points < MIN_REDEEM_POINTS) {
    return res.status(400).json({ error: `Minimum ${MIN_REDEEM_POINTS} points required to redeem` });
  }
  if (points % POINTS_PER_UNIT !== 0) {
    return res.status(400).json({ error: `Points must be in multiples of ${POINTS_PER_UNIT}` });
  }

  // 1. Do they have a saved payout method, fully set up with RazorpayX?
  const { data: bankDetails, error: bankError } = await supabase
    .from('bank_details')
    .select('*')
    .eq('user_id', req.userId)
    .single();

  if (bankError || !bankDetails) {
    return res.status(400).json({ error: 'Please add your bank/UPI details before redeeming' });
  }
  if (!bankDetails.razorpay_fund_account_id) {
    return res.status(400).json({ error: 'Your payout details are not fully set up yet. Please re-save them.' });
  }

  // 2. Do they have enough *available* points right now?
  const { data: available, error: availError } = await supabase.rpc('get_available_points', {
    p_user_id: req.userId,
  });

  if (availError) {
    console.error('Supabase get_available_points error:', availError);
    return res.status(500).json({ error: 'Could not verify your points balance' });
  }
  if (available < points) {
    return res.status(400).json({ error: `You only have ${available} points available to redeem` });
  }

  // 3. Create the pending request. This insert IS the "lock" -
  //    get_available_points subtracts anything with status='pending'.
  const amountInr = (points / POINTS_PER_UNIT) * RUPEES_PER_UNIT;

  const { data: redemption, error: insertError } = await supabase
    .from('redemption_requests')
    .insert({
      user_id: req.userId,
      points_redeemed: points,
      amount_inr: amountInr,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Supabase redemption insert error:', insertError);
    return res.status(500).json({ error: 'Could not create redemption request' });
  }

  // 4. Actually trigger the RazorpayX payout.
  //    Mode has to match the fund account's type - UPI fund accounts (vpa)
  //    need mode: 'UPI', bank_account fund accounts need IMPS/NEFT/RTGS.
  //    Sending UPI mode against a bank_account fund account is a hard
  //    RazorpayX validation error (BAD_REQUEST_ERROR / input_validation_failed).
  const payoutMode = bankDetails.method === 'upi' ? 'UPI' : 'IMPS';

  try {
    const payout = await createPayout({
      fundAccountId: bankDetails.razorpay_fund_account_id,
      amountInr,
      referenceId: redemption.id, // lets the webhook match this back to our row
      mode: payoutMode,
    });

    await supabase
      .from('redemption_requests')
      .update({ razorpay_payout_id: payout.id, updated_at: new Date() })
      .eq('id', redemption.id);
  } catch (payoutError) {
    console.error('RazorpayX payout error:', payoutError.razorpayError || payoutError);
    await supabase
      .from('redemption_requests')
      .update({
        status: 'failed',
        failure_reason: payoutError.razorpayError?.description || 'Payout could not be created',
        updated_at: new Date(),
      })
      .eq('id', redemption.id);
    return res.status(500).json({ error: 'Could not process your redemption. Please try again.' });
  }

  // Status stays 'pending' on purpose - the webhook flips it to 'completed'
  // once RazorpayX confirms the money actually moved.
  res.json({
    message: 'Redemption request submitted',
    redemptionId: redemption.id,
    pointsRedeemed: redemption.points_redeemed,
    amountInr: redemption.amount_inr,
    status: 'pending',
  });
});

module.exports = router;