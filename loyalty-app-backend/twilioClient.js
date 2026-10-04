// const twilio = require('twilio');

// // Reads credentials from .env - never hardcode these in code.
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// // Sends the OTP as an SMS. Phone numbers must be in E.164 format (+91XXXXXXXXXX).
// // Throws if Twilio rejects the send (e.g. unverified number in trial mode,
// // invalid number format, or - once you're past testing - a number blocked
// // because DLT isn't set up yet for India).
// async function sendOtpSms(phone, otp) {
//   const toNumber = phone.startsWith('+') ? phone : `+91${phone}`; // assume India if no country code given

//   return client.messages.create({
//     body: `Your Vaya Rewards verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: toNumber,
//   });
// }

// module.exports = { sendOtpSms };






























// const twilio = require('twilio');

// // Reads credentials from .env - never hardcode these in code.
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// // Sends the OTP as an SMS. Phone numbers must be in E.164 format (+91XXXXXXXXXX).
// // Throws if Twilio rejects the send (e.g. unverified number in trial mode,
// // invalid number format, or - once you're past testing - a number blocked
// // because DLT isn't set up yet for India).
// async function sendOtpSms(phone, otp) {
//   const toNumber = phone.startsWith('+') ? phone : `+91${phone}`; // assume India if no country code given

//   return client.messages.create({
//     body: `Your Vaya Rewards verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: toNumber,
//   });
// }

// // Generic SMS sender - used for anything that isn't the OTP flow (e.g.
// // "your redemption was paid" notifications). Kept separate from
// // sendOtpSms so the OTP flow's message format never accidentally changes.
// async function sendSms(phone, message) {
//   const toNumber = phone.startsWith('+') ? phone : `+91${phone}`;

//   return client.messages.create({
//     body: message,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: toNumber,
//   });
// }

// module.exports = { sendOtpSms, sendSms };































// const API_KEY = process.env.TWOFACTOR_API_KEY;

// function normalizePhone(phone) {
//   const digits = String(phone).replace(/\D/g, '');
//   return digits.length === 10 ? `91${digits}` : digits;
// }

// async function sendOtpSms(phone, otp) {
//   const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${normalizePhone(phone)}/${otp}`;
//   const res = await fetch(url);
//   const data = await res.json().catch(() => ({}));
//   if (data.Status !== 'Success') {
//     // Don't log the URL; it contains your API key.
//     throw new Error(`2Factor send failed: ${data.Details || res.statusText}`);
//   }
//   return data;
// }

// module.exports = { sendOtpSms /* keep sendSms until you decide how to send notifications */ };







































































// // Same two function names as twilioClient.js (sendOtpSms, sendSms) on
// // purpose - so routes/auth.js and routes/admin.js only need their import
// // line changed, nothing else.
// const BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

// async function fast2smsRequest(body) {
//   const response = await fetch(BASE_URL, {
//     method: 'POST',
//     headers: {
//       authorization: process.env.FAST2SMS_API_KEY,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(body),
//   });

//   const data = await response.json();

//   if (!response.ok || data.return === false) {
//     const err = new Error(data.message?.[0] || data.message || 'Fast2SMS request failed');
//     err.fast2smsError = data;
//     throw err;
//   }

//   return data;
// }

// // Strips a leading +91/91 so we always send Fast2SMS a plain 10-digit
// // Indian number, which is what their API expects.
// function toPlainIndianNumber(phone) {
//   return phone.replace(/^\+?91/, '').replace(/\D/g, '');
// }

// // TEMPORARY: using Quick SMS route ('q') instead of the purpose-built
// // 'otp' route, because the 'otp' route needs Fast2SMS's OTP-KYC step
// // completed first (see fast2sms.com/help/otp-sms-kyc). Quick SMS needs
// // NO KYC and NO DLT registration - it just sends free-text. Once KYC is
// // done, switch route back to 'otp' + variables_values (cheaper per SMS,
// // purpose-built) - see the commented block below.
// async function sendOtpSms(phone, otp) {
//   return fast2smsRequest({
//     route: 'q',
//     message: `Your Vaya Rewards verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
//     numbers: toPlainIndianNumber(phone),
//   });
// }

// // --- Once Fast2SMS OTP-KYC is approved, swap to this instead: ---
// // async function sendOtpSms(phone, otp) {
// //   return fast2smsRequest({
// //     route: 'otp',
// //     variables_values: otp,
// //     numbers: toPlainIndianNumber(phone),
// //   });
// // }

// // Generic custom-text SMS (e.g. "your redemption was paid"). Using Quick
// // SMS route too, for the same no-KYC/no-DLT reason. Once real DLT
// // registration + an approved template are in place, you can switch route
// // to 'dlt' and pass sender_id + your approved template's message/variables
// // instead of a free-text `message` field, for compliant branded SMS.
// async function sendSms(phone, message) {
//   return fast2smsRequest({
//     route: 'q',
//     message,
//     numbers: toPlainIndianNumber(phone),
//   });
// }

// module.exports = { sendOtpSms, sendSms };

















































































// renflairClient.js
const BASE_URL = 'https://sms.renflair.in/V1.php';

// Renflair expects a plain 10-digit Indian number (no +91 / 91 prefix).
function toPlainIndianNumber(phone) {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function sendOtpSms(phone, otp) {
  const params = new URLSearchParams({
    API: process.env.RENFLAIR_API_KEY, // from .env, never hardcode
    PHONE: toPlainIndianNumber(phone),
    OTP: String(otp),
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  const data = await res.json().catch(() => null);

  // Don't log the URL anywhere; it contains your API key.
  if (!res.ok || !data) {
    throw new Error(`Renflair send failed: HTTP ${res.status}`);
  }
  // Renflair's response shape isn't documented in what you pasted;
  // log `data` once on a test send and tighten this check to match.
  if (data.status === false || data.return === false || data.error) {
    throw new Error(`Renflair send failed: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

// Renflair's API (from the docs you shared) only sends OTPs, with a fixed
// template, so there's no custom-text endpoint. Fail loudly instead of
// silently sending the wrong thing.
async function sendSms() {
  throw new Error('Renflair does not support custom SMS text; use another provider for notifications.');
}

module.exports = { sendOtpSms, sendSms };
