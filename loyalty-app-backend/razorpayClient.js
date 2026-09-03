// const crypto = require('crypto');

// // Small wrapper around RazorpayX's REST API - same pattern as twilioClient.js.
// // Already proven working via test-razorpay-standalone.js (Contact -> Fund
// // Account -> Payout all confirmed successful).
// const BASE_URL = 'https://api.razorpay.com/v1';
// const authHeader =
//   'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

// async function razorpayRequest(method, path, body, extraHeaders = {}) {
//   const response = await fetch(`${BASE_URL}${path}`, {
//     method,
//     headers: { 'Content-Type': 'application/json', Authorization: authHeader, ...extraHeaders },
//     body: body ? JSON.stringify(body) : undefined,
//   });
//   const data = await response.json();
//   if (!response.ok) {
//     const err = new Error(data.error?.description || 'Razorpay request failed');
//     err.razorpayError = data.error;
//     throw err;
//   }
//   return data;
// }

// // One per user - only needs to happen once, cached on bank_details.razorpay_contact_id.
// function createContact({ name, phone, referenceId }) {
//   return razorpayRequest('POST', '/contacts', {
//     name,
//     contact: phone,
//     type: 'vendor',
//     reference_id: referenceId,
//   });
// }

// // One per saved payout method - this is what a payout actually targets.
// function createFundAccount({ contactId, method, upiId, accountHolderName, accountNumber, ifscCode }) {
//   if (method === 'upi') {
//     return razorpayRequest('POST', '/fund_accounts', {
//       contact_id: contactId,
//       account_type: 'vpa',
//       vpa: { address: upiId },
//     });
//   }
//   return razorpayRequest('POST', '/fund_accounts', {
//     contact_id: contactId,
//     account_type: 'bank_account',
//     bank_account: {
//       name: accountHolderName,
//       ifsc: ifscCode,
//       account_number: accountNumber,
//     },
//   });
// }

// // Triggers the actual payout. amountInr is rupees, converted to paise here.
// function createPayout({ fundAccountId, amountInr, referenceId, mode = 'UPI' }) {
//   return razorpayRequest(
//     'POST',
//     '/payouts',
//     {
//       account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
//       fund_account_id: fundAccountId,
//       amount: Math.round(amountInr * 100),
//       currency: 'INR',
//       mode,
//       purpose: 'payout',
//       queue_if_low_balance: true,
//       reference_id: referenceId,
//       narration: 'Vaya Rewards redemption',
//     },
//     { 'X-Payout-Idempotency': referenceId }
//   );
// }

// // Verifies a webhook actually came from Razorpay (HMAC-SHA256 over the raw
// // request body, using the webhook secret from the Razorpay dashboard).
// function verifyWebhookSignature(rawBody, signatureHeader) {
//   const expected = crypto
//     .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
//     .update(rawBody)
//     .digest('hex');
//   return expected === signatureHeader;
// }

// module.exports = { createContact, createFundAccount, createPayout, verifyWebhookSignature };



























const crypto = require('crypto');

// Small wrapper around RazorpayX's REST API - same pattern as twilioClient.js.
// Already proven working via test-razorpay-standalone.js (Contact -> Fund
// Account -> Payout all confirmed successful).
const BASE_URL = 'https://api.razorpay.com/v1';
const authHeader =
  'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

async function razorpayRequest(method, path, body, extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error?.description || 'Razorpay request failed');
    err.razorpayError = data.error;
    throw err;
  }
  return data;
}

// One per user - only needs to happen once, cached on bank_details.razorpay_contact_id.
function createContact({ name, phone, referenceId }) {
  return razorpayRequest('POST', '/contacts', {
    name,
    contact: phone,
    type: 'vendor',
    reference_id: referenceId,
  });
}

// One per saved payout method - this is what a payout actually targets.
function createFundAccount({ contactId, method, upiId, accountHolderName, accountNumber, ifscCode }) {
  if (method === 'upi') {
    return razorpayRequest('POST', '/fund_accounts', {
      contact_id: contactId,
      account_type: 'vpa',
      vpa: { address: upiId },
    });
  }
  return razorpayRequest('POST', '/fund_accounts', {
    contact_id: contactId,
    account_type: 'bank_account',
    bank_account: {
      name: accountHolderName,
      ifsc: ifscCode,
      account_number: accountNumber,
    },
  });
}

// Triggers the actual payout. amountInr is rupees, converted to paise here.
function createPayout({ fundAccountId, amountInr, referenceId, mode }) {
  if (!mode) {
    throw new Error('createPayout: mode is required (must match the fund account type, e.g. UPI vs IMPS/NEFT/RTGS)');
  }
  return razorpayRequest(
    'POST',
    '/payouts',
    {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: Math.round(amountInr * 100),
      currency: 'INR',
      mode,
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration: 'Vaya Rewards redemption',
    },
    { 'X-Payout-Idempotency': referenceId }
  );
}

// Verifies a webhook actually came from Razorpay (HMAC-SHA256 over the raw
// request body, using the webhook secret from the Razorpay dashboard).
function verifyWebhookSignature(rawBody, signatureHeader) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signatureHeader;
}

module.exports = { createContact, createFundAccount, createPayout, verifyWebhookSignature };