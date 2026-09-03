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
// Once the provider finishes verifying, it either:
//   (a) calls US back on a "webhook" URL we register with them, or
//   (b) gives the APP a reference ID, which the app then sends to us here.
//
// Either way, all WE store is: a reference ID + pass/fail status + the PAN
// number (which is fine to store for TDS filing purposes). This massively
// reduces our compliance burden - we're never legally responsible for
// storing sensitive Aadhaar data because we never touch it.

// Called by the app once the KYC provider's SDK finishes and returns a
// reference ID confirming the user completed verification.
router.post('/kyc/confirm', requireAuth, async (req, res) => {
  const { kycReferenceId, panNumber, upiId } = req.body;

  if (!kycReferenceId) {
    return res.status(400).json({ error: 'Missing KYC reference ID' });
  }

  // STEP 1: Ask the KYC provider "is this reference ID actually verified?"
  // Never trust the app's word alone - always confirm server-to-server.
  // Example shape (replace with your actual provider's API once chosen):
  //
  // const verifyResponse = await fetch(`https://api.digio.in/v2/client/kyc/${kycReferenceId}`, {
  //   headers: { Authorization: `Bearer ${process.env.KYC_PROVIDER_API_KEY}` },
  // });
  // const verifyData = await verifyResponse.json();
  // const isVerified = verifyData.status === 'approved';

  const isVerified = true; // placeholder until a real provider is wired in

  const { error } = await supabase
    .from('users')
    .update({
      kyc_status: isVerified ? 'verified' : 'rejected',
      kyc_reference_id: kycReferenceId,
      pan_number: panNumber || null,
      upi_id: upiId || null,
    })
    .eq('id', req.userId);

  if (error) return res.status(500).json({ error: 'Could not update KYC status' });

  res.json({ kyc_status: isVerified ? 'verified' : 'rejected' });
});

router.get('/kyc/status', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('kyc_status, kyc_reference_id')
    .eq('id', req.userId)
    .single();

  if (error) return res.status(500).json({ error: 'Could not fetch KYC status' });
  res.json(user);
});

module.exports = router;
