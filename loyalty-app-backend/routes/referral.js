const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');

const router = express.Router();

// Change this later from the admin portal if needed - same pattern as
// MIN_REDEEM_POINTS in redeem.js.
const REFERRAL_BONUS_POINTS = 100;

// Your own referral code + how many people you've referred so far, and how
// many points you've earned from referrals - for the "Refer a Friend" screen.
router.get('/referral', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('referral_code, referred_by')
    .eq('id', req.userId)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });

  const { count: referredCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', req.userId);

  const { data: bonusTxns } = await supabase
    .from('transactions')
    .select('points')
    .eq('user_id', req.userId)
    .eq('type', 'referral_bonus');

  const totalReferralPoints = (bonusTxns || []).reduce((sum, t) => sum + t.points, 0);

  res.json({
    referralCode: user.referral_code,
    hasAppliedAReferral: !!user.referred_by,
    referredCount: referredCount || 0,
    totalReferralPoints,
  });
});

// Enter a friend's code - can be done any time after signup, not just once
// at first launch. Once set, it can't be changed (one referral per account).
router.post('/referral/apply', requireAuth, async (req, res) => {
  const { referralCode } = req.body;

  if (!referralCode || !referralCode.trim()) {
    return res.status(400).json({ error: 'Referral code required' });
  }

  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('referred_by')
    .eq('id', req.userId)
    .single();

  if (currentUserError || !currentUser) return res.status(404).json({ error: 'User not found' });

  if (currentUser.referred_by) {
    return res.status(400).json({ error: 'A referral code has already been applied to your account' });
  }

  const { data: referrer, error: referrerError } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', referralCode.trim().toUpperCase())
    .single();

  if (referrerError || !referrer) {
    return res.status(400).json({ error: 'Invalid referral code' });
  }

  if (referrer.id === req.userId) {
    return res.status(400).json({ error: 'You cannot refer yourself' });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ referred_by: referrer.id })
    .eq('id', req.userId);

  if (updateError) {
    console.error('Supabase referral apply error:', updateError);
    return res.status(500).json({ error: 'Could not apply referral code' });
  }

  res.json({ message: 'Referral code applied! Your friend will get their bonus once you scan your first QR code.' });
});

module.exports = router;
