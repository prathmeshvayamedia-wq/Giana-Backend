# Future Feature: PIN-based login (not implemented yet)

**Status:** Deferred. Using OTP-only for now. Implement this before/at production
if SMS cost or login friction becomes a problem.

## Why this exists

Right now, every login (new AND existing users) sends an OTP via Twilio.
Once verified, the app gets a JWT valid for 30 days - so a user who stays
logged in never sees OTP again during that window. The gap is: new device,
app reinstall, or after 30 days - user has to go through OTP again, which
costs an SMS every time.

## The plan

- OTP stays mandatory for first-time signup (this is still how we confirm
  someone actually owns that phone number).
- After first successful verify-otp, prompt the user to set a 4-6 digit PIN.
- Future logins on the same or new device: phone number + PIN, no SMS needed.
- If the user forgets their PIN, fall back to OTP to reset it.
- Never allow "phone number only, no PIN, no OTP" login - that's the
  insecure option we explicitly ruled out, since this app holds bank
  details and moves real money on redemption.

---

## 1. Database change (schema.sql)

```sql
alter table users
  add column if not exists pin_hash text,
  add column if not exists pin_attempts integer not null default 0;
```

Same bcrypt-hashing pattern as OTP - never store the PIN in plain text.

---

## 2. Backend - routes/auth.js additions

Add this import at the top (not currently there since send-otp/verify-otp
don't need auth, but set-pin does):

```js
const requireAuth = require('../middleware');
```

Add these three routes (paste before `module.exports = router;`):

```js
// User must already be logged in (via OTP) to set a PIN - this is what
// proves they actually own the account before letting them create a
// faster, weaker-than-OTP login method.
router.post('/set-pin', requireAuth, async (req, res) => {
  const { pin } = req.body;
  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 4-6 digits' });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const { error } = await supabase
    .from('users')
    .update({ pin_hash: pinHash, pin_attempts: 0 })
    .eq('id', req.userId);

  if (error) {
    console.error('Supabase set-pin error:', error);
    return res.status(500).json({ error: 'Could not save PIN' });
  }

  res.json({ message: 'PIN set successfully' });
});

// Lets the app check whether to show a PIN pad or fall back to OTP,
// before the user has typed anything sensitive.
router.post('/has-pin', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const { data: user } = await supabase.from('users').select('pin_hash').eq('phone', phone).single();
  res.json({ hasPin: !!(user && user.pin_hash) });
});

// The actual fast login path - phone + PIN, no SMS involved.
router.post('/login-with-pin', async (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) return res.status(400).json({ error: 'Phone and PIN required' });

  const { data: user, error } = await supabase.from('users').select('*').eq('phone', phone).single();

  if (error || !user || !user.pin_hash) {
    return res.status(400).json({ error: 'No PIN set for this account, please login with OTP' });
  }

  if (user.pin_attempts >= 5) {
    return res.status(429).json({ error: 'Too many attempts, please login with OTP to reset your PIN' });
  }

  const isValid = await bcrypt.compare(pin, user.pin_hash);

  if (!isValid) {
    await supabase.from('users').update({ pin_attempts: user.pin_attempts + 1 }).eq('id', user.id);
    return res.status(400).json({ error: 'Incorrect PIN' });
  }

  // Reset the counter on a successful login
  await supabase.from('users').update({ pin_attempts: 0 }).eq('id', user.id);

  const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.json({ token, user: { id: user.id, phone: user.phone, points: user.points, kyc_status: user.kyc_status } });
});
```

**To reset a forgotten PIN:** no new endpoint needed - just run the normal
`verify-otp` flow again, then call `/auth/set-pin` again, which overwrites
the old hash.

---

## 3. Frontend - api.js additions

```js
export const setPin = (pin, token) => apiCall('/auth/set-pin', { method: 'POST', body: { pin }, token });
export const checkHasPin = (phone) => apiCall('/auth/has-pin', { method: 'POST', body: { phone } });
export const loginWithPin = (phone, pin) =>
  apiCall('/auth/login-with-pin', { method: 'POST', body: { phone, pin } });
```

---

## 4. Frontend - LoginScreen.js changes (conceptual, not full code)

- After first-time verify-otp success, navigate to a new "Set a PIN"
  screen (skippable) that calls `setPin()`.
- On app launch / when phone number is entered on the login screen:
  call `checkHasPin(phone)` first.
    - `hasPin: true` -> show a PIN pad, call `loginWithPin()` on submit.
    - `hasPin: false` -> fall back to the existing send-otp flow.
- Add a "Forgot PIN? / Use OTP instead" link on the PIN pad screen that
  just routes back to the normal OTP flow.

---

## Reference context from the original discussion

- App already issues a 30-day JWT after verify-otp (see `routes/auth.js`,
  `jwt.sign(..., { expiresIn: '30d' })`) - this already solves "existing
  user doesn't need to re-login" for the common case. PIN only matters for
  new-device / reinstall / expired-token cases.
- Twilio SMS costs + India DLT registration (see project history) were the
  original motivation for wanting to reduce OTP frequency.
