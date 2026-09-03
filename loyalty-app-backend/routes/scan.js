// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');

// const router = express.Router();

// // This is the route the mobile app calls right after the camera detects a
// // QR code. The app does NOT decide if points should be given - it just
// // sends the scanned text here, and the backend decides everything.
// router.post('/scan', requireAuth, async (req, res) => {
//   const { qrCode } = req.body;
//   const userId = req.userId; // set by requireAuth middleware, from the login token

//   if (!qrCode) return res.status(400).json({ error: 'No QR code provided' });

//   // STEP 1: Does this QR code even exist in our system?
//   const { data: qrRecord, error: qrError } = await supabase
//     .from('qr_codes')
//     .select('*, products(id, name, points_value)')
//     .eq('code', qrCode)
//     .single();

//   if (qrError || !qrRecord) {
//     return res.status(404).json({ error: 'This QR code is not recognised' });
//   }

//   // STEP 2: Has it already been used? Check the flag first (fast path).
//   if (qrRecord.used) {
//     return res.status(409).json({ error: 'This QR code has already been used' });
//   }

//   // STEP 3: Mark it used - with a condition (used = false) baked into the
//   // update itself. This is the key trick for handling race conditions: if
//   // two requests hit this at the exact same time for the same code, only
//   // ONE of them will find a matching row to update. The database guarantees
//   // this, so it's safe even under heavy concurrent traffic.
//   const { data: updatedRows, error: updateError } = await supabase
//     .from('qr_codes')
//     .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
//     .eq('code', qrCode)
//     .eq('used', false) // <- this condition is what prevents duplicate scans
//     .select();

//   if (updateError) {
//     return res.status(500).json({ error: 'Something went wrong, please try again' });
//   }

//   if (!updatedRows || updatedRows.length === 0) {
//     // Someone else's request won the race and used it a moment earlier
//     return res.status(409).json({ error: 'This QR code has already been used' });
//   }

//   // STEP 4: Credit the points, atomically (see schema.sql for the function)
//   const pointsToAdd = qrRecord.products.points_value;
//   const { data: newPoints, error: pointsError } = await supabase.rpc('increment_user_points', {
//     p_user_id: userId,
//     p_amount: pointsToAdd,
//   });

//   if (pointsError) {
//     return res.status(500).json({ error: 'Points could not be credited, contact support' });
//   }

//   // STEP 5: Log it permanently in the transactions table (audit trail)
//   await supabase.from('transactions').insert({
//     user_id: userId,
//     type: 'earn',
//     points: pointsToAdd,
//     qr_code: qrCode,
//   });

//   res.json({
//     message: 'Points added',
//     product: qrRecord.products.name,
//     pointsEarned: pointsToAdd,
//     newBalance: newPoints,
//   });
// });

// module.exports = router;





















// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');

// const router = express.Router();

// // This is the route the mobile app calls right after the camera detects a
// // QR code. The app does NOT decide if points should be given - it just
// // sends the scanned text here, and the backend decides everything.
// router.post('/scan', requireAuth, async (req, res) => {
//   const { qrCode } = req.body;
//   const userId = req.userId; // set by requireAuth middleware, from the login token

//   if (!qrCode) return res.status(400).json({ error: 'No QR code provided' });

//   // STEP 1: Does this QR code even exist in our system?
//   const { data: qrRecord, error: qrError } = await supabase
//     .from('qr_codes')
//     .select('*, products(id, name)')
//     .eq('code', qrCode)
//     .single();

//   if (qrError || !qrRecord) {
//     return res.status(404).json({ error: 'This QR code is not recognised' });
//   }

//   // STEP 2: Has it already been used? Check the flag first (fast path).
//   if (qrRecord.used) {
//     return res.status(409).json({ error: 'This QR code has already been used' });
//   }

//   // STEP 3: Mark it used - with a condition (used = false) baked into the
//   // update itself. This is the key trick for handling race conditions: if
//   // two requests hit this at the exact same time for the same code, only
//   // ONE of them will find a matching row to update. The database guarantees
//   // this, so it's safe even under heavy concurrent traffic.
//   const { data: updatedRows, error: updateError } = await supabase
//     .from('qr_codes')
//     .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
//     .eq('code', qrCode)
//     .eq('used', false) // <- this condition is what prevents duplicate scans
//     .select();

//   if (updateError) {
//     return res.status(500).json({ error: 'Something went wrong, please try again' });
//   }

//   if (!updatedRows || updatedRows.length === 0) {
//     // Someone else's request won the race and used it a moment earlier
//     return res.status(409).json({ error: 'This QR code has already been used' });
//   }

//   // STEP 4: Credit the points, atomically (see schema.sql for the function)
//   // Points now live directly on the QR code row - no product lookup needed.
//   const pointsToAdd = qrRecord.points_value;
//   const { data: newPoints, error: pointsError } = await supabase.rpc('increment_user_points', {
//     p_user_id: userId,
//     p_amount: pointsToAdd,
//   });

//   if (pointsError) {
//     return res.status(500).json({ error: 'Points could not be credited, contact support' });
//   }

//   // STEP 5: Log it permanently in the transactions table (audit trail)
//   await supabase.from('transactions').insert({
//     user_id: userId,
//     type: 'earn',
//     points: pointsToAdd,
//     qr_code: qrCode,
//   });

//   res.json({
//     message: 'Points added',
//     product: qrRecord.products?.name || 'Product',
//     pointsEarned: pointsToAdd,
//     newBalance: newPoints,
//   });
// });

// module.exports = router;




























// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');

// const router = express.Router();

// // This is the route the mobile app calls right after the camera detects a
// // QR code. The app does NOT decide if points should be given - it just
// // sends the scanned text here, and the backend decides everything.
// router.post('/scan', requireAuth, async (req, res) => {
//   const { qrCode } = req.body;
//   const userId = req.userId; // set by requireAuth middleware, from the login token

//   if (!qrCode) return res.status(400).json({ error: 'No QR code provided' });

//   // STEP 1: Does this QR code even exist in our system?
//   const { data: qrRecord, error: qrError } = await supabase
//     .from('qr_codes')
//     .select('*, products(id, name)')
//     .eq('code', qrCode)
//     .single();

//   if (qrError || !qrRecord) {
//     return res.status(404).json({ error: 'This QR code is not recognised' });
//   }

//   // STEP 1.5: Has this code (or its whole batch) been disabled by an admin?
//   if (qrRecord.active === false) {
//     return res.status(403).json({ error: 'This QR code has been disabled' });
//   }

//   // STEP 2: Has it already been used? Check the flag first (fast path).
//   if (qrRecord.used) {
//     return res.status(409).json({ error: 'This QR code has already been used' });
//   }

//   // STEP 3: Mark it used - with a condition (used = false, active = true)
//   // baked into the update itself. This is the key trick for handling race
//   // conditions: if two requests hit this at the exact same time for the
//   // same code, only ONE of them will find a matching row to update. The
//   // `active = true` condition means that even if an admin disables this
//   // exact code in the split second between STEP 1.5 and this update, the
//   // update still won't match any row - so the scan still fails safely.
//   const { data: updatedRows, error: updateError } = await supabase
//     .from('qr_codes')
//     .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
//     .eq('code', qrCode)
//     .eq('used', false) // <- this condition is what prevents duplicate scans
//     .eq('active', true) // <- this condition is what prevents disabled codes from being redeemed
//     .select();

//   if (updateError) {
//     return res.status(500).json({ error: 'Something went wrong, please try again' });
//   }

//   if (!updatedRows || updatedRows.length === 0) {
//     // Either someone else's request won the race and used it a moment
//     // earlier, or it was disabled between STEP 1.5 and here. Re-check which
//     // one it was so the error message is accurate.
//     const { data: recheck } = await supabase.from('qr_codes').select('used, active').eq('code', qrCode).single();
//     if (recheck && recheck.active === false) {
//       return res.status(403).json({ error: 'This QR code has been disabled' });
//     }
//     return res.status(409).json({ error: 'This QR code has already been used' });
//   }

//   // STEP 4: Credit the points, atomically (see schema.sql for the function)
//   // Points now live directly on the QR code row - no product lookup needed.
//   const pointsToAdd = qrRecord.points_value;
//   const { data: newPoints, error: pointsError } = await supabase.rpc('increment_user_points', {
//     p_user_id: userId,
//     p_amount: pointsToAdd,
//   });

//   if (pointsError) {
//     return res.status(500).json({ error: 'Points could not be credited, contact support' });
//   }

//   // STEP 5: Log it permanently in the transactions table (audit trail)
//   await supabase.from('transactions').insert({
//     user_id: userId,
//     type: 'earn',
//     points: pointsToAdd,
//     qr_code: qrCode,
//   });

//   res.json({
//     message: 'Points added',
//     product: qrRecord.products?.name || 'Product',
//     pointsEarned: pointsToAdd,
//     newBalance: newPoints,
//   });
// });

// module.exports = router;












// KYC SCAN ALSO INCLUDED UNTIL KYC DONE QR WILL NOT OPEN


const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');

const router = express.Router();

// This is the route the mobile app calls right after the camera detects a
// QR code. The app does NOT decide if points should be given - it just
// sends the scanned text here, and the backend decides everything.
router.post('/scan', requireAuth, async (req, res) => {
  // const { qrCode } = req.body;
  const { qrCode, latitude, longitude } = req.body;
  const userId = req.userId; // set by requireAuth middleware, from the login token

  if (!qrCode) return res.status(400).json({ error: 'No QR code provided' });

  // STEP 0.5: Is this user's KYC verified by an admin yet? Until it is,
  // scanning stays fully blocked - this is the "QR feature off until admin
  // turns it on" behaviour, controlled by users.kyc_status in the admin panel.
  const { data: scanningUser, error: userFetchError } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', userId)
    .single();

  if (userFetchError || !scanningUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (scanningUser.kyc_status !== 'verified') {
    return res.status(403).json({ error: 'Complete your KYC verification before scanning QR codes' });
  }

  // STEP 1: Does this QR code even exist in our system?
  const { data: qrRecord, error: qrError } = await supabase
    .from('qr_codes')
    .select('*, products(id, name)')
    .eq('code', qrCode)
    .single();

  if (qrError || !qrRecord) {
    return res.status(404).json({ error: 'This QR code is not recognised' });
  }

  // STEP 1.5: Has this code (or its whole batch) been disabled by an admin?
  if (qrRecord.active === false) {
    return res.status(403).json({ error: 'This QR code has been disabled' });
  }

  // STEP 2: Has it already been used? Check the flag first (fast path).
  if (qrRecord.used) {
    return res.status(409).json({ error: 'This QR code has already been used' });
  }

  // STEP 3: Mark it used - with a condition (used = false, active = true)
  // baked into the update itself. This is the key trick for handling race
  // conditions: if two requests hit this at the exact same time for the
  // same code, only ONE of them will find a matching row to update. The
  // `active = true` condition means that even if an admin disables this
  // exact code in the split second between STEP 1.5 and this update, the
  // update still won't match any row - so the scan still fails safely.
  const { data: updatedRows, error: updateError } = await supabase
    .from('qr_codes')
    .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
    .eq('code', qrCode)
    .eq('used', false) // <- this condition is what prevents duplicate scans
    .eq('active', true) // <- this condition is what prevents disabled codes from being redeemed
    .select();

  if (updateError) {
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Either someone else's request won the race and used it a moment
    // earlier, or it was disabled between STEP 1.5 and here. Re-check which
    // one it was so the error message is accurate.
    const { data: recheck } = await supabase.from('qr_codes').select('used, active').eq('code', qrCode).single();
    if (recheck && recheck.active === false) {
      return res.status(403).json({ error: 'This QR code has been disabled' });
    }
    return res.status(409).json({ error: 'This QR code has already been used' });
  }

  // STEP 4: Credit the points, atomically (see schema.sql for the function)
  // Points now live directly on the QR code row - no product lookup needed.
  const pointsToAdd = qrRecord.points_value;
  const { data: newPoints, error: pointsError } = await supabase.rpc('increment_user_points', {
    p_user_id: userId,
    p_amount: pointsToAdd,
  });

  if (pointsError) {
    return res.status(500).json({ error: 'Points could not be credited, contact support' });
  }

  // STEP 5: Log it permanently in the transactions table (audit trail)
  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'earn',
    points: pointsToAdd,
    qr_code: qrCode,
    latitude: latitude ?? null,   // <- YE NAYI LINE
    longitude: longitude ?? null, // <- YE NAYI LINE
  });

  res.json({
    message: 'Points added',
    product: qrRecord.products?.name || 'Product',
    pointsEarned: pointsToAdd,
    newBalance: newPoints,
  });
});

module.exports = router;