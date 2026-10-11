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
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ---------------------------------------------------------------
// Imports that depend on your project setup
// ---------------------------------------------------------------

// Same Supabase import your project already uses.
const supabase = require('../db');

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits
}

function generateReferralCode() {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GIANA-${random}`;
}

// Sends the OTP through Renflair. Needs RENFLAIR_API_KEY in .env.
// Renflair expects a plain 10-digit Indian number (no +91 / 91 prefix).
const RENFLAIR_URL = 'https://sms.renflair.in/V1.php';

function toPlainIndianNumber(phone) {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function sendOtpSms(phone, otp) {
  if (!process.env.RENFLAIR_API_KEY) {
    console.warn('RENFLAIR_API_KEY not set - skipping SMS, use the [DEV] OTP line above.');
    return;
  }

  const params = new URLSearchParams({
    API: process.env.RENFLAIR_API_KEY,
    PHONE: toPlainIndianNumber(phone),
    OTP: String(otp),
  });

  // Never log the URL - it contains the API key.
  const res = await fetch(`${RENFLAIR_URL}?${params}`);
  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    throw new Error(`Renflair send failed: HTTP ${res.status}`);
  }
  // Response shape isn't documented - this logs it so you can see it on a test send.
  console.log('[Renflair] response:', JSON.stringify(data));
  if (data.status === false || data.return === false || data.error) {
    throw new Error(`Renflair send failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

const USER_TYPES = ['Electrician', 'Dealer']; // must match LoginScreen.js ROLES

function cleanProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const profile = {
    name: String(p.name || '').trim().slice(0, 60),
    user_type: String(p.user_type || ''),
    city: String(p.city || '').trim().slice(0, 50),
    state: String(p.state || '').trim().slice(0, 50),
    pincode: String(p.pincode || ''),
  };
  if (profile.name.length < 2) return null;
  if (!USER_TYPES.includes(profile.user_type)) return null;
  if (profile.city.length < 2 || profile.state.length < 2) return null;
  if (!/^[0-9]{6}$/.test(profile.pincode)) return null;
  return profile;
}

// ---------------------------------------------------------------
// STEP 1: phone number.
//  - existing user                  -> OTP sent
//  - new number, no details yet     -> { needsRegistration: true }, no OTP sent
//  - new number, details submitted  -> details saved with the OTP request, OTP sent
// ---------------------------------------------------------------
router.post('/send-otp', async (req, res) => {
  const { phone, profile } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  let cleaned = null;
  if (!existingUser) {
    if (!profile) return res.json({ needsRegistration: true });
    cleaned = cleanProfile(profile);
    if (!cleaned) return res.status(400).json({ error: 'INVALID_PROFILE' });
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const { error } = await supabase
    .from('otp_verifications')
    .insert({ phone, otp_hash: otpHash, expires_at: expiresAt, profile: cleaned });

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Could not create OTP' });
  }

  // Still logging the OTP to the console - handy while testing,
  // since SMS delivery to non-DLT numbers may fail or lag during testing.
  console.log(`[DEV] OTP for ${phone}: ${otp}`);

  try {
    await sendOtpSms(phone, otp);
  } catch (smsError) {
    console.error('SMS send error:', smsError);
    // Don't fail the request - the OTP is saved in the DB and logged above,
    // so verify-otp still works.
  }

  res.json({ message: 'OTP sent', isNewUser: !existingUser });
});

// ---------------------------------------------------------------
// STEP 2: verify the OTP, create the account if the number is new, log in.
// ---------------------------------------------------------------
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  // Most recent unused OTP request for this phone number
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

  // Existing user logs in; a new user is created now from the saved details.
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (!user) {
    const profile = otpRecord.profile;
    if (!profile) {
      return res.status(400).json({ error: 'Registration details missing, please start again' });
    }
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ phone, referral_code: generateReferralCode(), ...profile })
      .select()
      .single();
    if (createError) {
      console.error('Create user error:', createError);
      return res.status(500).json({ error: 'Could not create user' });
    }
    user = newUser;
  }

  // Session token the app attaches to every future request
  const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      points: user.points,
      kyc_status: user.kyc_status,
    },
  });
});

module.exports = router;