# Loyalty App Backend

Ye backend OTP login, QR scan validation, points wallet, aur KYC status
handle karta hai. Isse tumhare Expo app se connect karna hai.

## Setup

1. `npm install`
2. `.env.example` ko copy karke `.env` banao:
   ```
   cp .env.example .env
   ```
3. `.env` mein apni Supabase URL aur service_role key daalo (Supabase
   dashboard > Project Settings > API se milegi)
4. `schema.sql` ka poora content Supabase ke SQL Editor mein paste karke
   run karo — isse saari tables ban jaayengi
5. `JWT_SECRET` generate karo:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   aur `.env` mein daal do

## Chalane ke liye

```
npm run dev
```

Server `http://localhost:3000` pe chalega.

## Testing (Postman ya curl se)

1. **OTP bhejo:**
   ```
   POST http://localhost:3000/api/auth/send-otp
   Body: { "phone": "9876543210" }
   ```
   Response mein `devOtp` milega (sirf testing ke liye — production mein hata dena)

2. **OTP verify karo:**
   ```
   POST http://localhost:3000/api/auth/verify-otp
   Body: { "phone": "9876543210", "otp": "483920" }
   ```
   Response mein ek `token` milega — isko save kar lo

3. **QR scan karo** (token chahiye — Authorization header mein `Bearer <token>`):
   ```
   POST http://localhost:3000/api/scan
   Headers: Authorization: Bearer <token>
   Body: { "qrCode": "QR-TEST-0001" }
   ```
   (Pehle schema.sql ke comments follow karke ek test QR code database mein
   daalna hoga)

4. **Wallet dekho:**
   ```
   GET http://localhost:3000/api/wallet
   Headers: Authorization: Bearer <token>
   ```

## Abhi kya real hai, kya baaki hai

**Real/production-ready:**
- OTP hashing (plain text kabhi store nahi hota)
- QR duplicate-check database level pe (race-condition safe)
- Points transactions ka permanent audit trail
- Session tokens (JWT) proper expiry ke saath

**Abhi wire karna baaki hai (jab tum ready ho):**
- Real SMS provider (MSG91/Twilio) — abhi `routes/auth.js` mein OTP console
  mein print hoti hai
- Real KYC provider (Digio/Signzy) — abhi `routes/kyc.js` mein verification
  hamesha "true" return karta hai (placeholder)
- Real UPI payout — ye endpoint abhi banaya nahi hai, KYC verified hone ke
  baad add karenge
