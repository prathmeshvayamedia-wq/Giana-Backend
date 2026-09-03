// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const supabase = require('../db');

// const router = express.Router();

// // Generates a random 6-digit OTP like "483920"
// function generateOtp() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // STEP 1: user enters their phone number, we text them an OTP.
// // router.post('/send-otp', async (req, res) => {
// //   const { phone } = req.body;
// //   if (!phone || phone.length < 10) {
// //     return res.status(400).json({ error: 'Valid phone number required' });
// //   }

// //   const otp = generateOtp();
// //   const otpHash = await bcrypt.hash(otp, 10); // never store the plain OTP
// //   const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // valid for 5 minutes

// //   const { error } = await supabase
// //     .from('otp_verifications')
// //     .insert({ phone, otp_hash: otpHash, expires_at: expiresAt });

// //   if (error) return res.status(500).json({ error: 'Could not create OTP' });

//   router.post('/send-otp', async (req, res) => {
//     const { phone } = req.body;
//     if (!phone || phone.length < 10) {
//       return res.status(400).json({ error: 'Valid phone number required' });
//     }

//     const otp = generateOtp();
//     const otpHash = await bcrypt.hash(otp, 10);
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     const { error } = await supabase
//       .from('otp_verifications')
//       .insert({ phone, otp_hash: otpHash, expires_at: expiresAt });

//     if (error) {
//       console.error('Supabase insert error:', error);   // ADD THIS
//       return res.status(500).json({ error: 'Could not create OTP' });
//     }

//   // --- SMS SENDING GOES HERE ---
//   // This is where you'd call MSG91/Twilio to actually text the OTP to the user.
//   // Example with MSG91 (uncomment and fill in once you have an account):
//   //
//   // await fetch('https://api.msg91.com/api/v5/otp', {
//   //   method: 'POST',
//   //   headers: { authkey: process.env.SMS_PROVIDER_API_KEY, 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ mobile: phone, otp }),
//   // });
//   //
//   // For now, while testing, we return it in the response so you can see it
//   // without needing an SMS account yet. REMOVE the otp field below before
//   // going live - never send the OTP back in the API response in production.
//   console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);
//   res.json({ message: 'OTP sent', devOtp: otp });
// });

// // STEP 2: user enters the OTP they received, we verify it and log them in.
// router.post('/verify-otp', async (req, res) => {
//   const { phone, otp } = req.body;
//   if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

//   // Get the most recent OTP request for this phone number
//   const { data: otpRecord, error: fetchError } = await supabase
//     .from('otp_verifications')
//     .select('*')
//     .eq('phone', phone)
//     .eq('verified', false)
//     .order('created_at', { ascending: false })
//     .limit(1)
//     .single();

//   if (fetchError || !otpRecord) {
//     return res.status(400).json({ error: 'No pending OTP found, please request a new one' });
//   }

//   if (new Date(otpRecord.expires_at) < new Date()) {
//     return res.status(400).json({ error: 'OTP expired, please request a new one' });
//   }

//   if (otpRecord.attempts >= 5) {
//     return res.status(429).json({ error: 'Too many attempts, please request a new OTP' });
//   }

//   const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);

//   if (!isValid) {
//     // Track failed attempts so someone can't brute-force guess the OTP
//     await supabase
//       .from('otp_verifications')
//       .update({ attempts: otpRecord.attempts + 1 })
//       .eq('id', otpRecord.id);
//     return res.status(400).json({ error: 'Incorrect OTP' });
//   }

//   // Mark this OTP as used so it can't be reused
//   await supabase.from('otp_verifications').update({ verified: true }).eq('id', otpRecord.id);

//   // Find existing user, or create a new one on first login
//   let { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();

//   if (!user) {
//     const { data: newUser, error: createError } = await supabase
//       .from('users')
//       .insert({ phone })
//       .select()
//       .single();
//     if (createError) return res.status(500).json({ error: 'Could not create user' });
//     user = newUser;
//   }

//   // Issue a session token the app will attach to every future request
//   const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, {
//     expiresIn: '30d',
//   });

//   res.json({ token, user: { id: user.id, phone: user.phone, points: user.points, kyc_status: user.kyc_status } });
// });

// module.exports = router;
























const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db');
const { sendOtpSms } = require('../twilioClient');

const router = express.Router();

// Generates a random 6-digit OTP like "483920"
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// STEP 1: user enters their phone number, we text them an OTP.
// router.post('/send-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone || phone.length < 10) {
//     return res.status(400).json({ error: 'Valid phone number required' });
//   }

//   const otp = generateOtp();
//   const otpHash = await bcrypt.hash(otp, 10); // never store the plain OTP
//   const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // valid for 5 minutes

//   const { error } = await supabase
//     .from('otp_verifications')
//     .insert({ phone, otp_hash: otpHash, expires_at: expiresAt });

//   if (error) return res.status(500).json({ error: 'Could not create OTP' });

  router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number required' });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error } = await supabase
      .from('otp_verifications')
      .insert({ phone, otp_hash: otpHash, expires_at: expiresAt });

    if (error) {
      console.error('Supabase insert error:', error);   // ADD THIS
      return res.status(500).json({ error: 'Could not create OTP' });
    }

  // Send the OTP over real SMS via Twilio. Still logging it to the server
  // console too - useful until DLT is set up for India, since delivery to
  // non-verified/non-DLT numbers may fail or lag, so you can see the code
  // without waiting on the SMS during testing.
  console.log(`[DEV] OTP for ${phone}: ${otp}`);

  try {
    await sendOtpSms(phone, otp);
  } catch (smsError) {
    console.error('Twilio send error:', smsError);
    // Don't fail the whole request just because SMS delivery had an issue -
    // the OTP is already saved in the DB and logged above, so verify-otp
    // will still work.
  }

  res.json({ message: 'OTP sent' });
});

// STEP 2: user enters the OTP they received, we verify it and log them in.
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  // Get the most recent OTP request for this phone number
  const { data: otpRecord, error: fetchError } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('phone', phone)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !otpRecord) {
    return res.status(400).json({ error: 'No pending OTP found, please request a new one' });
  }

  if (new Date(otpRecord.expires_at) < new Date()) {
    return res.status(400).json({ error: 'OTP expired, please request a new one' });
  }

  if (otpRecord.attempts >= 5) {
    return res.status(429).json({ error: 'Too many attempts, please request a new OTP' });
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);

  if (!isValid) {
    // Track failed attempts so someone can't brute-force guess the OTP
    await supabase
      .from('otp_verifications')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id);
    return res.status(400).json({ error: 'Incorrect OTP' });
  }

  // Mark this OTP as used so it can't be reused
  await supabase.from('otp_verifications').update({ verified: true }).eq('id', otpRecord.id);

  // Find existing user, or create a new one on first login
  let { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();

  if (!user) {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ phone })
      .select()
      .single();
    if (createError) return res.status(500).json({ error: 'Could not create user' });
    user = newUser;
  }

  // Issue a session token the app will attach to every future request
  const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.json({ token, user: { id: user.id, phone: user.phone, points: user.points, kyc_status: user.kyc_status } });
});

module.exports = router;