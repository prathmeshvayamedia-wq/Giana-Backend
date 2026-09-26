// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');

// const router = express.Router();

// // IMPORTANT DESIGN DECISION - read this before changing anything below:
// //
// // We do NOT accept Aadhaar images/numbers directly into our own backend or
// // database. Instead, the mobile app talks DIRECTLY to the KYC provider's
// // SDK (Digio/Signzy/Setu all offer a mobile SDK or hosted verification
// // page for exactly this). The user's Aadhaar/PAN documents go straight from
// // their phone to the KYC provider's compliant infrastructure - our server
// // never even sees the raw document.
// //
// // Once the provider finishes verifying, it either:
// //   (a) calls US back on a "webhook" URL we register with them, or
// //   (b) gives the APP a reference ID, which the app then sends to us here.
// //
// // Either way, all WE store is: a reference ID + pass/fail status + the PAN
// // number (which is fine to store for TDS filing purposes). This massively
// // reduces our compliance burden - we're never legally responsible for
// // storing sensitive Aadhaar data because we never touch it.

// // Called by the app once the KYC provider's SDK finishes and returns a
// // reference ID confirming the user completed verification.
// router.post('/kyc/confirm', requireAuth, async (req, res) => {
//   const { kycReferenceId, panNumber, upiId } = req.body;

//   if (!kycReferenceId) {
//     return res.status(400).json({ error: 'Missing KYC reference ID' });
//   }

//   // STEP 1: Ask the KYC provider "is this reference ID actually verified?"
//   // Never trust the app's word alone - always confirm server-to-server.
//   // Example shape (replace with your actual provider's API once chosen):
//   //
//   // const verifyResponse = await fetch(`https://api.digio.in/v2/client/kyc/${kycReferenceId}`, {
//   //   headers: { Authorization: `Bearer ${process.env.KYC_PROVIDER_API_KEY}` },
//   // });
//   // const verifyData = await verifyResponse.json();
//   // const isVerified = verifyData.status === 'approved';

//   const isVerified = true; // placeholder until a real provider is wired in

//   const { error } = await supabase
//     .from('users')
//     .update({
//       kyc_status: isVerified ? 'verified' : 'rejected',
//       kyc_reference_id: kycReferenceId,
//       pan_number: panNumber || null,
//       upi_id: upiId || null,
//     })
//     .eq('id', req.userId);

//   if (error) return res.status(500).json({ error: 'Could not update KYC status' });

//   res.json({ kyc_status: isVerified ? 'verified' : 'rejected' });
// });

// router.get('/kyc/status', requireAuth, async (req, res) => {
//   const { data: user, error } = await supabase
//     .from('users')
//     .select('kyc_status, kyc_reference_id')
//     .eq('id', req.userId)
//     .single();

//   if (error) return res.status(500).json({ error: 'Could not fetch KYC status' });
//   res.json(user);
// });

// module.exports = router;


















































































// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');

// const router = express.Router();

// // IMPORTANT DESIGN DECISION - read this before changing anything below:
// //
// // We do NOT accept Aadhaar images/numbers directly into our own backend or
// // database. Instead, the mobile app talks DIRECTLY to the KYC provider's
// // SDK (Digio/Signzy/Setu all offer a mobile SDK or hosted verification
// // page for exactly this). The user's Aadhaar/PAN documents go straight from
// // their phone to the KYC provider's compliant infrastructure - our server
// // never even sees the raw document.
// //
// // Once the provider finishes verifying, it either:
// //   (a) calls US back on a "webhook" URL we register with them, or
// //   (b) gives the APP a reference ID, which the app then sends to us here.
// //
// // Either way, all WE store is: a reference ID + pass/fail status + the PAN
// // number (which is fine to store for TDS filing purposes). This massively
// // reduces our compliance burden - we're never legally responsible for
// // storing sensitive Aadhaar data because we never touch it.

// // Called by the app once the KYC provider's SDK finishes and returns a
// // reference ID confirming the user completed verification.
// router.post('/kyc/confirm', requireAuth, async (req, res) => {
//   const { kycReferenceId, panNumber, upiId } = req.body;

//   if (!kycReferenceId) {
//     return res.status(400).json({ error: 'Missing KYC reference ID' });
//   }

//   // STEP 1: Ask the KYC provider "is this reference ID actually verified?"
//   // Never trust the app's word alone - always confirm server-to-server.
//   // Example shape (replace with your actual provider's API once chosen):
//   //
//   // const verifyResponse = await fetch(`https://api.digio.in/v2/client/kyc/${kycReferenceId}`, {
//   //   headers: { Authorization: `Bearer ${process.env.KYC_PROVIDER_API_KEY}` },
//   // });
//   // const verifyData = await verifyResponse.json();
//   // const isVerified = verifyData.status === 'approved';

//   const isVerified = true; // placeholder until a real provider is wired in

//   const { error } = await supabase
//     .from('users')
//     .update({
//       kyc_status: isVerified ? 'verified' : 'rejected',
//       kyc_reference_id: kycReferenceId,
//       pan_number: panNumber || null,
//       upi_id: upiId || null,
//     })
//     .eq('id', req.userId);

//   if (error) return res.status(500).json({ error: 'Could not update KYC status' });

//   res.json({ kyc_status: isVerified ? 'verified' : 'rejected' });
// });

// // Called by EditProfileScreen's KYC tab to submit (or resubmit, after a
// // revoke) a KYC application for admin review. Aadhaar/PAN images are
// // uploaded separately via /profile/upload-document - this just records the
// // PAN number and flips the status to 'pending' so it shows up in the admin
// // panel's review queue. The admin then marks it 'verified' or 'revoked'.
// // router.post('/kyc/apply', requireAuth, async (req, res) => {
// //   const { panNumber } = req.body;

// //   const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
// //   if (!panNumber || !panPattern.test(panNumber.toUpperCase())) {
// //     return res.status(400).json({ error: 'Enter a valid PAN number, e.g. ABCDE1234F' });
// //   }

// //   const { error } = await supabase
// //     .from('users')
// //     .update({
// //       kyc_status: 'pending',
// //       pan_number: panNumber.toUpperCase(),
// //     })
// //     .eq('id', req.userId);

// //   if (error) return res.status(500).json({ error: 'Could not submit KYC application' });

// //   res.json({ kyc_status: 'pending' });
// // });



// router.post('/kyc/apply', requireAuth, async (req, res) => {
//   const { panNumber, aadhaarNumber } = req.body;

//   const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
//   if (!panNumber || !panPattern.test(panNumber.toUpperCase())) {
//     return res.status(400).json({ error: 'Enter a valid PAN number, e.g. ABCDE1234F' });
//   }

//   // Aadhaar is 12 digits, sometimes entered with spaces (e.g. "1234 5678 9012")
//   const cleanedAadhaar = (aadhaarNumber || '').replace(/\s/g, '');
//   const aadhaarPattern = /^[0-9]{12}$/;
//   if (!cleanedAadhaar || !aadhaarPattern.test(cleanedAadhaar)) {
//     return res.status(400).json({ error: 'Enter a valid 12-digit Aadhaar number' });
//   }

//   // IMPORTANT: we only ever store the LAST 4 DIGITS - never the full
//   // Aadhaar number. This is enough to show the user "linked to XXXX-XXXX-1234"
//   // as a masked reference, without us holding the actual sensitive ID.
//   const aadhaarLast4 = cleanedAadhaar.slice(-4);

//   const { error } = await supabase
//     .from('users')
//     .update({
//       kyc_status: 'pending',
//       pan_number: panNumber.toUpperCase(),
//       aadhaar_last4: aadhaarLast4,
//     })
//     .eq('id', req.userId);

//   if (error) return res.status(500).json({ error: 'Could not submit KYC application' });

//   res.json({ kyc_status: 'pending' });
// });



// router.get('/kyc/status', requireAuth, async (req, res) => {
//   const { data: user, error } = await supabase
//     .from('users')
//     .select('kyc_status, kyc_reference_id')
//     .eq('id', req.userId)
//     .single();

//   if (error) return res.status(500).json({ error: 'Could not fetch KYC status' });
//   res.json(user);
// });

// module.exports = router;










































































const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');

const router = express.Router();

// IMPORTANT DESIGN DECISION - read this before changing anything below:
//
// We do NOT accept Aadhaar images/numbers directly into our own backend or
// database. Instead, the mobile app talks DIRECTLY to the KYC provider's
// SDK (Digio/Signzy/Setu all offer a mobile SDK or hosted verification
// page for exactly this). The user's Aadhaar/PAN documents go straight from
// their phone to the KYC provider's compliant infrastructure - our server
// never even sees the raw document.
//
// This means the Aadhaar number itself must NEVER appear in a request body
// on this server, not even transiently before truncation - that defeats the
// entire compliance rationale above. If we need a masked "linked to
// XXXX-XXXX-1234" reference, the PROVIDER's webhook/callback should return
// us the last 4 digits directly, not the app sending us the full number to
// slice ourselves.
//
// Flow: user submits PAN (+ triggers doc upload to provider SDK) via
// EditProfileScreen's KYC tab -> /kyc/apply flips status to 'pending' and
// queues it in the admin review panel -> admin marks 'verified' or
// 'revoked'. There is no automated confirm step; all review is manual.

// Submit (or resubmit, after a revoke) a KYC application for admin review.
// Aadhaar verification happens entirely within the provider SDK on-device;
// this route only ever sees the PAN number and flips status to 'pending'.
router.post('/kyc/apply', requireAuth, async (req, res) => {
  const { panNumber } = req.body;

  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!panNumber || !panPattern.test(panNumber.toUpperCase())) {
    return res.status(400).json({ error: 'Enter a valid PAN number, e.g. ABCDE1234F' });
  }

  const { error } = await supabase
    .from('users')
    .update({
      kyc_status: 'pending',
      pan_number: panNumber.toUpperCase(),
    })
    .eq('id', req.userId);

  if (error) return res.status(500).json({ error: 'Could not submit KYC application' });

  res.json({ kyc_status: 'pending' });
});

router.get('/kyc/status', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('kyc_status, kyc_reference_id, kyc_revoked_reason')
    .eq('id', req.userId)
    .single();

  if (error) return res.status(500).json({ error: 'Could not fetch KYC status' });
  res.json(user);
});

module.exports = router;