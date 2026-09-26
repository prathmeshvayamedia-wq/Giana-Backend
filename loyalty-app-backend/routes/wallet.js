// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');
// const { createContact, createFundAccount } = require('../razorpayClient');

// const router = express.Router();

// // Current points balance + basic profile
// router.get('/wallet', requireAuth, async (req, res) => {
//   const { data: user, error } = await supabase
//     .from('users')
//     .select('id, phone, name, points, kyc_status')
//     .eq('id', req.userId)
//     .single();

//   if (error || !user) return res.status(404).json({ error: 'User not found' });
//   res.json(user);
// });

// // Scan/redeem history, most recent first
// router.get('/history', requireAuth, async (req, res) => {
//   const { data: history, error } = await supabase
//     .from('transactions')
//     .select('id, type, points, qr_code, created_at')
//     .eq('user_id', req.userId)
//     .order('created_at', { ascending: false })
//     .limit(50);

//   if (error) return res.status(500).json({ error: 'Could not load history' });
//   res.json(history);
// });

// // Save/update the user's payout method, then set up RazorpayX Contact + Fund
// // Account right away - so redeem doesn't have to do it (and can't fail
// // halfway through a redemption because of it).
// router.post('/wallet/bank-details', requireAuth, async (req, res) => {
//   const { method, accountHolderName, upiId, accountNumber, ifscCode } = req.body;

//   if (!method || !['upi', 'bank'].includes(method)) {
//     return res.status(400).json({ error: 'method must be "upi" or "bank"' });
//   }
//   if (!accountHolderName || accountHolderName.trim().length < 2) {
//     return res.status(400).json({ error: 'Account holder name required' });
//   }

//   if (method === 'upi') {
//     const upiPattern = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;
//     if (!upiId || !upiPattern.test(upiId)) {
//       return res.status(400).json({ error: 'Valid UPI ID required, e.g. name@bank' });
//     }
//   }

//   if (method === 'bank') {
//     const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
//     if (!accountNumber || accountNumber.length < 9 || accountNumber.length > 18) {
//       return res.status(400).json({ error: 'Valid account number required' });
//     }
//     if (!ifscCode || !ifscPattern.test(ifscCode.toUpperCase())) {
//       return res.status(400).json({ error: 'Valid IFSC code required, e.g. HDFC0001234' });
//     }
//   }

//   const { data, error } = await supabase
//     .from('bank_details')
//     .upsert(
//       {
//         user_id: req.userId,
//         method,
//         account_holder_name: accountHolderName.trim(),
//         upi_id: method === 'upi' ? upiId : null,
//         account_number: method === 'bank' ? accountNumber : null,
//         ifsc_code: method === 'bank' ? ifscCode.toUpperCase() : null,
//         verified: false,
//         updated_at: new Date(),
//       },
//       { onConflict: 'user_id' }
//     )
//     .select()
//     .single();

//   if (error) {
//     console.error('Supabase bank_details upsert error:', error);
//     return res.status(500).json({ error: 'Could not save payout details' });
//   }

//   try {
//     const { data: user } = await supabase.from('users').select('phone').eq('id', req.userId).single();

//     const contact = await createContact({
//       name: data.account_holder_name,
//       phone: user.phone,
//       referenceId: req.userId,
//     });

//     const fundAccount = await createFundAccount({
//       contactId: contact.id,
//       method: data.method,
//       upiId: data.upi_id,
//       accountHolderName: data.account_holder_name,
//       accountNumber: data.account_number,
//       ifscCode: data.ifsc_code,
//     });

//     await supabase
//       .from('bank_details')
//       .update({ razorpay_contact_id: contact.id, razorpay_fund_account_id: fundAccount.id })
//       .eq('user_id', req.userId);
//   } catch (razorpayError) {
//     console.error('RazorpayX contact/fund account error:', razorpayError.razorpayError || razorpayError);
//     return res.status(500).json({
//       error: 'Payout details saved, but could not set up with our payment partner. Please try again.',
//     });
//   }

//   res.json({
//     message: 'Payout details saved',
//     method: data.method,
//     accountHolderName: data.account_holder_name,
//     upiId: data.upi_id,
//     accountNumber: data.account_number ? `••••${data.account_number.slice(-4)}` : null,
//   });
// });

// // How much a user can currently redeem, in both points and rupees.
// router.get('/wallet/redeemable', requireAuth, async (req, res) => {
//   const { data: available, error } = await supabase.rpc('get_available_points', {
//     p_user_id: req.userId,
//   });

//   if (error) {
//     console.error('Supabase get_available_points error:', error);
//     return res.status(500).json({ error: 'Could not calculate available points' });
//   }

//   const points = available || 0;
//   const POINTS_PER_UNIT = 100;
//   const RUPEES_PER_UNIT = 10;
//   const amountInr = Math.floor(points / POINTS_PER_UNIT) * RUPEES_PER_UNIT;

//   res.json({ availablePoints: points, redeemableAmountInr: amountInr });
// });

// // Redemption history - what the RedemptionHistoryScreen shows
// router.get('/wallet/redemptions', requireAuth, async (req, res) => {
//   const { data, error } = await supabase
//     .from('redemption_requests')
//     .select('id, points_redeemed, amount_inr, status, created_at')
//     .eq('user_id', req.userId)
//     .order('created_at', { ascending: false })
//     .limit(50);

//   if (error) {
//     console.error('Supabase redemptions fetch error:', error);
//     return res.status(500).json({ error: 'Could not load redemption history' });
//   }

//   res.json(data);
// });

// module.exports = router;


















































// const express = require('express');
// const supabase = require('../db');
// const requireAuth = require('../middleware');
// const { createContact, createFundAccount } = require('../razorpayClient');

// const router = express.Router();

// // Current points balance + basic profile
// router.get('/wallet', requireAuth, async (req, res) => {
//   const { data: user, error } = await supabase
//     .from('users')
//     .select('id, phone, name, points, kyc_status')
//     .eq('id', req.userId)
//     .single();

//   if (error || !user) return res.status(404).json({ error: 'User not found' });
//   res.json(user);
// });

// // Scan/redeem history, most recent first
// router.get('/history', requireAuth, async (req, res) => {
//   const { data: history, error } = await supabase
//     .from('transactions')
//     .select('id, type, points, qr_code, created_at')
//     .eq('user_id', req.userId)
//     .order('created_at', { ascending: false })
//     .limit(50);

//   if (error) return res.status(500).json({ error: 'Could not load history' });
//   res.json(history);
// });

// // Save/update the user's payout method, then set up RazorpayX Contact + Fund
// // Account right away - so redeem doesn't have to do it (and can't fail
// // halfway through a redemption because of it).
// router.post('/wallet/bank-details', requireAuth, async (req, res) => {
//   const { method, accountHolderName, upiId, accountNumber, ifscCode } = req.body;

//   if (!method || !['upi', 'bank'].includes(method)) {
//     return res.status(400).json({ error: 'method must be "upi" or "bank"' });
//   }
//   if (!accountHolderName || accountHolderName.trim().length < 2) {
//     return res.status(400).json({ error: 'Account holder name required' });
//   }

//   if (method === 'upi') {
//     const upiPattern = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;
//     if (!upiId || !upiPattern.test(upiId)) {
//       return res.status(400).json({ error: 'Valid UPI ID required, e.g. name@bank' });
//     }
//   }

//   if (method === 'bank') {
//     const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
//     if (!accountNumber || accountNumber.length < 9 || accountNumber.length > 18) {
//       return res.status(400).json({ error: 'Valid account number required' });
//     }
//     if (!ifscCode || !ifscPattern.test(ifscCode.toUpperCase())) {
//       return res.status(400).json({ error: 'Valid IFSC code required, e.g. HDFC0001234' });
//     }
//   }

//   const { data, error } = await supabase
//     .from('bank_details')
//     .upsert(
//       {
//         user_id: req.userId,
//         method,
//         account_holder_name: accountHolderName.trim(),
//         upi_id: method === 'upi' ? upiId : null,
//         account_number: method === 'bank' ? accountNumber : null,
//         ifsc_code: method === 'bank' ? ifscCode.toUpperCase() : null,
//         verified: false,
//         updated_at: new Date(),
//       },
//       { onConflict: 'user_id' }
//     )
//     .select()
//     .single();

//   if (error) {
//     console.error('Supabase bank_details upsert error:', error);
//     return res.status(500).json({ error: 'Could not save payout details' });
//   }

//   try {
//     const { data: user } = await supabase.from('users').select('phone').eq('id', req.userId).single();

//     const contact = await createContact({
//       name: data.account_holder_name,
//       phone: user.phone,
//       referenceId: req.userId,
//     });

//     const fundAccount = await createFundAccount({
//       contactId: contact.id,
//       method: data.method,
//       upiId: data.upi_id,
//       accountHolderName: data.account_holder_name,
//       accountNumber: data.account_number,
//       ifscCode: data.ifsc_code,
//     });

//     await supabase
//       .from('bank_details')
//       .update({ razorpay_contact_id: contact.id, razorpay_fund_account_id: fundAccount.id })
//       .eq('user_id', req.userId);
//   } catch (razorpayError) {
//     console.error('RazorpayX contact/fund account error:', razorpayError.razorpayError || razorpayError);
//     return res.status(500).json({
//       error: 'Payout details saved, but could not set up with our payment partner. Please try again.',
//     });
//   }

//   res.json({
//     message: 'Payout details saved',
//     method: data.method,
//     accountHolderName: data.account_holder_name,
//     upiId: data.upi_id,
//     accountNumber: data.account_number ? `••••${data.account_number.slice(-4)}` : null,
//   });
// });

// // How much a user can currently redeem, in both points and rupees.
// router.get('/wallet/redeemable', requireAuth, async (req, res) => {
//   const { data: available, error } = await supabase.rpc('get_available_points', {
//     p_user_id: req.userId,
//   });

//   if (error) {
//     console.error('Supabase get_available_points error:', error);
//     return res.status(500).json({ error: 'Could not calculate available points' });
//   }

//   const points = available || 0;
//   const POINTS_PER_UNIT = 1;
//   const RUPEES_PER_UNIT = 1;
//   const amountInr = Math.floor(points / POINTS_PER_UNIT) * RUPEES_PER_UNIT;

//   res.json({ availablePoints: points, redeemableAmountInr: amountInr });
// });

// // Redemption history - what the RedemptionHistoryScreen shows
// router.get('/wallet/redemptions', requireAuth, async (req, res) => {
//   const { data, error } = await supabase
//     .from('redemption_requests')
//     .select('id, points_redeemed, amount_inr, status, created_at')
//     .eq('user_id', req.userId)
//     .order('created_at', { ascending: false })
//     .limit(50);

//   if (error) {
//     console.error('Supabase redemptions fetch error:', error);
//     return res.status(500).json({ error: 'Could not load redemption history' });
//   }

//   res.json(data);
// });

// module.exports = router;







































 
 
const express = require('express');
const supabase = require('../db');
const requireAuth = require('../middleware');
const { createContact, createFundAccount } = require('../razorpayClient');
 
const router = express.Router();
 
// Current points balance + basic profile
router.get('/wallet', requireAuth, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, phone, name, points, kyc_status')
    .eq('id', req.userId)
    .single();
 
  if (error || !user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
 
// Scan/redeem history, most recent first
router.get('/history', requireAuth, async (req, res) => {
  const { data: history, error } = await supabase
    .from('transactions')
    .select('id, type, points, qr_code, created_at')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(50);
 
  if (error) return res.status(500).json({ error: 'Could not load history' });
  res.json(history);
});
 
// Save/update the user's payout method, then set up RazorpayX Contact + Fund
// Account right away - so redeem doesn't have to do it (and can't fail
// halfway through a redemption because of it).
router.post('/wallet/bank-details', requireAuth, async (req, res) => {
  const { method, accountHolderName, upiId, accountNumber, ifscCode } = req.body;
 
  if (!method || !['upi', 'bank'].includes(method)) {
    return res.status(400).json({ error: 'method must be "upi" or "bank"' });
  }
  if (!accountHolderName || accountHolderName.trim().length < 2) {
    return res.status(400).json({ error: 'Account holder name required' });
  }
 
  if (method === 'upi') {
    const upiPattern = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;
    if (!upiId || !upiPattern.test(upiId)) {
      return res.status(400).json({ error: 'Valid UPI ID required, e.g. name@bank' });
    }
  }
 
  if (method === 'bank') {
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!accountNumber || accountNumber.length < 9 || accountNumber.length > 18) {
      return res.status(400).json({ error: 'Valid account number required' });
    }
    if (!ifscCode || !ifscPattern.test(ifscCode.toUpperCase())) {
      return res.status(400).json({ error: 'Valid IFSC code required, e.g. HDFC0001234' });
    }
  }
 
  // onConflict is now the (user_id, method) pair, not just user_id - this is
  // what lets a user have a 'bank' row AND a 'upi' row saved at the same
  // time instead of the second save wiping out the first. Requires the
  // bank_details_user_id_method_key constraint from the migration.
  const { data, error } = await supabase
    .from('bank_details')
    .upsert(
      {
        user_id: req.userId,
        method,
        account_holder_name: accountHolderName.trim(),
        upi_id: method === 'upi' ? upiId : null,
        account_number: method === 'bank' ? accountNumber : null,
        ifsc_code: method === 'bank' ? ifscCode.toUpperCase() : null,
        verified: false,
        updated_at: new Date(),
      },
      { onConflict: 'user_id,method' }
    )
    .select()
    .single();
 
  if (error) {
    console.error('Supabase bank_details upsert error:', error);
    return res.status(500).json({ error: 'Could not save payout details' });
  }
 
  try {
    const { data: user } = await supabase.from('users').select('phone').eq('id', req.userId).single();
 
    const contact = await createContact({
      name: data.account_holder_name,
      phone: user.phone,
      referenceId: req.userId,
    });
 
    const fundAccount = await createFundAccount({
      contactId: contact.id,
      method: data.method,
      upiId: data.upi_id,
      accountHolderName: data.account_holder_name,
      accountNumber: data.account_number,
      ifscCode: data.ifsc_code,
    });
 
    await supabase
      .from('bank_details')
      .update({ razorpay_contact_id: contact.id, razorpay_fund_account_id: fundAccount.id })
      .eq('user_id', req.userId)
      .eq('method', method);
  } catch (razorpayError) {
    console.error('RazorpayX contact/fund account error:', razorpayError.razorpayError || razorpayError);
    return res.status(500).json({
      error: 'Payout details saved, but could not set up with our payment partner. Please try again.',
    });
  }
 
  res.json({
    message: 'Payout details saved',
    method: data.method,
    accountHolderName: data.account_holder_name,
    upiId: data.upi_id,
    accountNumber: data.account_number ? `••••${data.account_number.slice(-4)}` : null,
  });
});
 
// What payout methods this user has saved, so RedeemScreen can show a
// live Bank/UPI dropdown instead of guessing. Returns one row per method
// the user has saved; whichever method has no row yet is simply absent
// from the array, and the app should prompt to add it before redeeming
// to that method.
router.get('/wallet/bank-details', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('bank_details')
    .select('method, account_holder_name, upi_id, account_number, ifsc_code, verified, cancelled_cheque_url, passbook_url')
    .eq('user_id', req.userId);
 
  if (error) {
    console.error('Supabase bank_details fetch error:', error);
    return res.status(500).json({ error: 'Could not load payout details' });
  }
 
  const masked = data.map((row) => ({
    ...row,
    account_number: row.account_number ? `••••${row.account_number.slice(-4)}` : null,
  }));
 
  res.json(masked);
});
 
// How much a user can currently redeem, in both points and rupees.
router.get('/wallet/redeemable', requireAuth, async (req, res) => {
  const { data: available, error } = await supabase.rpc('get_available_points', {
    p_user_id: req.userId,
  });
 
  if (error) {
    console.error('Supabase get_available_points error:', error);
    return res.status(500).json({ error: 'Could not calculate available points' });
  }
 
  const points = available || 0;
  const POINTS_PER_UNIT = 1;
  const RUPEES_PER_UNIT = 1;
  const amountInr = Math.floor(points / POINTS_PER_UNIT) * RUPEES_PER_UNIT;
 
  res.json({ availablePoints: points, redeemableAmountInr: amountInr });
});
 
// Redemption history - what the RedemptionHistoryScreen shows
router.get('/wallet/redemptions', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('redemption_requests')
    .select('id, points_redeemed, amount_inr, status, created_at')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(50);
 
  if (error) {
    console.error('Supabase redemptions fetch error:', error);
    return res.status(500).json({ error: 'Could not load redemption history' });
  }
 
  res.json(data);
});
 
module.exports = router;