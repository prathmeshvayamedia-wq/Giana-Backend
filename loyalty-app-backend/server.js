require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const walletRoutes = require('./routes/wallet');
const kycRoutes = require('./routes/kyc');
const redeemRoutes = require('./routes/redeem');
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

const app = express();
app.use(cors());
// verify callback stashes the raw request bytes on req.rawBody - the
// RazorpayX webhook signature is computed over these exact original bytes,
// so we can't just re-stringify req.body later and expect a match.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// All routes live under /api - keeps things organized as the app grows
app.use('/api/auth', authRoutes);
app.use('/api', scanRoutes);
app.use('/api', walletRoutes);
app.use('/api', kycRoutes);
app.use('/api', redeemRoutes);
app.use('/api', webhookRoutes);
app.use('/api', adminRoutes);
app.use('/api', profileRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Loyalty app backend is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
