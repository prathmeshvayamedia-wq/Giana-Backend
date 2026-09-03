const twilio = require('twilio');

// Reads credentials from .env - never hardcode these in code.
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Sends the OTP as an SMS. Phone numbers must be in E.164 format (+91XXXXXXXXXX).
// Throws if Twilio rejects the send (e.g. unverified number in trial mode,
// invalid number format, or - once you're past testing - a number blocked
// because DLT isn't set up yet for India).
async function sendOtpSms(phone, otp) {
  const toNumber = phone.startsWith('+') ? phone : `+91${phone}`; // assume India if no country code given

  return client.messages.create({
    body: `Your Vaya Rewards verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber,
  });
}

module.exports = { sendOtpSms };
