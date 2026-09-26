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












// // KYC SCAN ALSO INCLUDED UNTIL KYC DONE QR WILL NOT OPEN


// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');
// const { reverseGeocode } = require('../geocode');

// const router = express.Router();

// // This is the route the mobile app calls right after the camera detects a
// // QR code. The app does NOT decide if points should be given - it just
// // sends the scanned text here, and the backend decides everything.
// router.post('/scan', requireAuth, async (req, res) => {
//   // const { qrCode } = req.body;
//   const { qrCode, latitude, longitude } = req.body;
//   const userId = req.userId; // set by requireAuth middleware, from the login token

//   if (!qrCode) return res.status(400).json({ error: 'No QR code provided' });

//   // STEP 0.5: Is this user's KYC verified by an admin yet? Until it is,
//   // scanning stays fully blocked - this is the "QR feature off until admin
//   // turns it on" behaviour, controlled by users.kyc_status in the admin panel.
//   const { data: scanningUser, error: userFetchError } = await supabase
//     .from('users')
//     .select('kyc_status')
//     .eq('id', userId)
//     .single();

//   if (userFetchError || !scanningUser) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   if (scanningUser.kyc_status !== 'verified') {
//     return res.status(403).json({ error: 'Complete your KYC verification before scanning QR codes' });
//   }

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

//   // // STEP 5: Log it permanently in the transactions table (audit trail)
//   // await supabase.from('transactions').insert({
//   //   user_id: userId,
//   //   type: 'earn',
//   //   points: pointsToAdd,
//   //   qr_code: qrCode,
//   //   latitude: latitude ?? null,   // <- YE NAYI LINE
//   //   longitude: longitude ?? null, // <- YE NAYI LINE
//   // });




//   // const { data: transaction } = await supabase
//   // .from('transactions')
//   // .insert({
//   //   user_id: userId,
//   //   type: 'earn',
//   //   points: pointsToAdd,
//   //   qr_code: qrCode,
//   //   latitude: latitude ?? null,
//   //   longitude: longitude ?? null,
//   // })
//   // .select()
//   // .single();

//   // // Fire-and-forget: resolve the address in the BACKGROUND, after the
//   // // transaction row already exists. This deliberately does NOT use `await`
//   // // before the response below - the user gets their points instantly, and
//   // // the address fills in a moment later once Nominatim responds. If this
//   // // fails or is slow, it never affects the scan the user is waiting on.
//   // if (transaction && latitude && longitude) {
//   //   reverseGeocode(latitude, longitude).then((address) => {
//   //     if (address) {
//   //       supabase.from('transactions').update({ location_address: address }).eq('id', transaction.id).then(() => {});
//   //     }
//   //   });
//   // }



//     const { data: transaction } = await supabase
//   .from('transactions')
//   .insert({
//     user_id: userId,
//     type: 'earn',
//     points: pointsToAdd,
//     qr_code: qrCode,
//     latitude: latitude ?? null,
//     longitude: longitude ?? null,
//   })
//   .select()
//   .single();

//   // 👇👇👇 YE NAYA BLOCK YAHAN PASTE KARO 👇👇👇
//   const { data: referralCheck } = await supabase
//     .from('users')
//     .select('referred_by, referral_bonus_given')
//     .eq('id', userId)
//     .single();

//   if (referralCheck?.referred_by && !referralCheck.referral_bonus_given) {
//     const REFERRAL_BONUS_POINTS = 100; // keep in sync with routes/referral.js

//     await supabase.rpc('increment_user_points', {
//       p_user_id: referralCheck.referred_by,
//       p_amount: REFERRAL_BONUS_POINTS,
//     });

//     await supabase.from('transactions').insert({
//       user_id: referralCheck.referred_by,
//       type: 'referral_bonus',
//       points: REFERRAL_BONUS_POINTS,
//       qr_code: null,
//     });

//     await supabase.from('users').update({ referral_bonus_given: true }).eq('id', userId);
//   }
//   // 👆👆👆 YAHAN TAK 👆👆👆

//   // Fire-and-forget: resolve the address in the BACKGROUND, after the
//   // transaction row already exists. This deliberately does NOT use `await`
//   // before the response below - the user gets their points instantly, and
//   // the address fills in a moment later once Nominatim responds. If this
//   // fails or is slow, it never affects the scan the user is waiting on.
//   if (transaction && latitude && longitude) {
//     reverseGeocode(latitude, longitude).then((address) => {
//       if (address) {
//         supabase.from('transactions').update({ location_address: address }).eq('id', transaction.id).then(() => {});
//       }
//     });
//   }



//   res.json({
//     message: 'Points added',
//     product: qrRecord.products?.name || 'Product',
//     pointsEarned: pointsToAdd,
//     newBalance: newPoints,
//   });
// });

// module.exports = router;






































const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');
const { reverseGeocode } = require('../geocode');

const router = express.Router();

// This is the route the mobile app calls right after the camera detects a
// QR code. The app does NOT decide if points should be given - it just
// sends the scanned text here, and the backend decides everything.
router.post('/scan', requireAuth, async (req, res) => {
  const { qrCode, latitude, longitude } = req.body;
  const userId = req.userId; // set by requireAuth middleware, from the login token

  if (!qrCode) return res.status(400).json({ error: 'No QR code provided' });

  // STEP 0.5: Is this user's KYC verified by an admin yet? Until it is,
  // scanning stays fully blocked - this is the "QR feature off until admin
  // turns it on" behaviour, controlled by users.kyc_status in the admin panel.
  const { data: scanningUser, error: userFetchError } = await supabase
    .from('users')
    .select('kyc_status, referred_by, referral_bonus_given')
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

  // STEP 5: Log it permanently in the transactions table (audit trail).
  // latitude/longitude are saved immediately from the app's GPS reading;
  // location_address is filled in a moment later (see the fire-and-forget
  // block below) once Nominatim resolves it - the user isn't kept waiting
  // on a third-party API just to get their points.
  const { data: transaction } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'earn',
      points: pointsToAdd,
      qr_code: qrCode,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    })
    .select()
    .single();

  // STEP 6: Referral bonus - awarded once, on the referred user's first
  // successful scan. Guarded with the exact same race-condition trick as
  // the QR `used` flag above (STEP 3): the update only matches when
  // referral_bonus_given is still false, so if this same user fires two
  // scans at nearly the same instant, only ONE request's update actually
  // finds a row to change - that's the one (and only one) that pays out.
  // Without this guard, two near-simultaneous scans could both pass the
  // `!referral_bonus_given` check before either had a chance to flip it,
  // double-paying the referrer.
  if (scanningUser.referred_by && !scanningUser.referral_bonus_given) {
    const REFERRAL_BONUS_POINTS = 100; // keep in sync with routes/referral.js

    const { data: bonusClaim } = await supabase
      .from('users')
      .update({ referral_bonus_given: true })
      .eq('id', userId)
      .eq('referral_bonus_given', false) // <- race-condition guard
      .select();

    if (bonusClaim && bonusClaim.length > 0) {
      // This request won the race - it's the only one that pays out.
      await supabase.rpc('increment_user_points', {
        p_user_id: scanningUser.referred_by,
        p_amount: REFERRAL_BONUS_POINTS,
      });

      await supabase.from('transactions').insert({
        user_id: scanningUser.referred_by,
        type: 'referral_bonus',
        points: REFERRAL_BONUS_POINTS,
        qr_code: null,
      });
    }
  }

  // Fire-and-forget: resolve the address in the BACKGROUND, after the
  // transaction row already exists. This deliberately does NOT use `await`
  // before the response below - the user gets their points instantly, and
  // the address fills in a moment later once Nominatim responds. If this
  // fails or is slow, it never affects the scan the user is waiting on.
  if (transaction && latitude && longitude) {
    reverseGeocode(latitude, longitude).then((address) => {
      if (address) {
        supabase.from('transactions').update({ location_address: address }).eq('id', transaction.id).then(() => {});
      }
    });
  }

  res.json({
    message: 'Points added',
    product: qrRecord.products?.name || 'Product',
    pointsEarned: pointsToAdd,
    newBalance: newPoints,
  });
});

module.exports = router;