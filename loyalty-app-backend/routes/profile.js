const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');

const router = express.Router();

// Full profile - personal + bank + kyc + additional, all in one call so the
// Profile screen's 4 tabs can load with a single request.
router.get('/profile', requireAuth, async (req, res) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.userId)
    .single();

  if (userError || !user) return res.status(404).json({ error: 'User not found' });

  const { data: bankDetails } = await supabase
    .from('bank_details')
    .select('*')
    .eq('user_id', req.userId)
    .single();

  res.json({ ...user, bank_details: bankDetails || null });
});

// --- Personal Details tab ---
router.put('/profile/personal', requireAuth, async (req, res) => {
  const {
    name, userType, gender, birthDate, email, licenseNumber,
    currentAddress, pincode, state, city,
  } = req.body;

  const { error } = await supabase
    .from('users')
    .update({
      name, user_type: userType, gender, birth_date: birthDate, email,
      license_number: licenseNumber, current_address: currentAddress,
      pincode, state, city,
    })
    .eq('id', req.userId);

  if (error) {
    console.error('Supabase profile/personal update error:', error);
    return res.status(500).json({ error: 'Could not update personal details' });
  }
  res.json({ message: 'Personal details updated' });
});

// --- Additional Details tab ---
router.put('/profile/additional', requireAuth, async (req, res) => {
  const { maritalStatus, workExperienceYears, dealerInfo, workAddress, workPincode } = req.body;

  const { error } = await supabase
    .from('users')
    .update({
      marital_status: maritalStatus,
      work_experience_years: workExperienceYears || null,
      dealer_info: dealerInfo,
      work_address: workAddress,
      work_pincode: workPincode,
    })
    .eq('id', req.userId);

  if (error) {
    console.error('Supabase profile/additional update error:', error);
    return res.status(500).json({ error: 'Could not update additional details' });
  }
  res.json({ message: 'Additional details updated' });
});

// --- KYC Details tab (PAN number - documents go through /profile/upload-document) ---
router.put('/profile/kyc-details', requireAuth, async (req, res) => {
  const { panNumber } = req.body;

  const { error } = await supabase.from('users').update({ pan_number: panNumber }).eq('id', req.userId);

  if (error) {
    console.error('Supabase profile/kyc-details update error:', error);
    return res.status(500).json({ error: 'Could not update KYC details' });
  }
  res.json({ message: 'KYC details updated' });
});

// --- Generic document upload - handles all image types in one place ---
// docType must be one of: aadhaar_front, aadhaar_back, pan_image,
// profile_photo, cancelled_cheque, passbook
const DOC_TYPE_MAP = {
  aadhaar_front: { table: 'users', column: 'aadhaar_front_url', byUserId: true },
  aadhaar_back: { table: 'users', column: 'aadhaar_back_url', byUserId: true },
  pan_image: { table: 'users', column: 'pan_image_url', byUserId: true },
  profile_photo: { table: 'users', column: 'profile_photo_url', byUserId: true },
  cancelled_cheque: { table: 'bank_details', column: 'cancelled_cheque_url', byUserId: true },
  passbook: { table: 'bank_details', column: 'passbook_url', byUserId: true },
};

router.post('/profile/upload-document', requireAuth, async (req, res) => {
  const { docType, base64Image } = req.body;

  const config = DOC_TYPE_MAP[docType];
  if (!config) {
    return res.status(400).json({ error: 'Invalid docType' });
  }
  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image required' });
  }

  // Strip the "data:image/jpeg;base64," prefix if the app sent it that way
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const buffer = Buffer.from(base64Data, 'base64');
  const fileName = `${req.userId}/${docType}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    return res.status(500).json({ error: 'Could not upload document' });
  }

  const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);
  const publicUrl = publicUrlData.publicUrl;

  // bank_details has its own row per user (upserted elsewhere) - for the
  // two bank document types, update that row instead of `users`.
  if (config.table === 'bank_details') {
    const { error: updateError } = await supabase
      .from('bank_details')
      .update({ [config.column]: publicUrl })
      .eq('user_id', req.userId);

    if (updateError) {
      console.error('Supabase bank_details doc update error:', updateError);
      return res.status(500).json({ error: 'Document uploaded but could not be linked. Please save bank details first.' });
    }
  } else {
    const { error: updateError } = await supabase
      .from('users')
      .update({ [config.column]: publicUrl })
      .eq('id', req.userId);

    if (updateError) {
      console.error('Supabase users doc update error:', updateError);
      return res.status(500).json({ error: 'Document uploaded but could not be saved' });
    }
  }

  res.json({ message: 'Document uploaded', url: publicUrl });
});

module.exports = router;
