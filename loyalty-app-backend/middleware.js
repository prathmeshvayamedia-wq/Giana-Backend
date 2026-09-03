const jwt = require('jsonwebtoken');

// This runs before scan/wallet/kyc routes. It checks the app sent a valid
// login token (from the OTP login step) before allowing the request through.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // expected format: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // now every route below knows who's calling
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session, please login again' });
  }
}

module.exports = requireAuth;
