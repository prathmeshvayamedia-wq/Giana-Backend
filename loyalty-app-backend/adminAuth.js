// const jwt = require('jsonwebtoken');

// // Separate from the regular user JWT (middleware.js) - admin tokens carry
// // an isAdmin flag and are signed with a different secret, so a leaked user
// // token can never be used to access admin routes, and vice versa.
// function requireAdminAuth(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Admin login required' });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
//     if (!decoded.isAdmin) {
//       return res.status(403).json({ error: 'Not authorized' });
//     }
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: 'Invalid or expired admin session' });
//   }
// }

// module.exports = requireAdminAuth;










const jwt = require('jsonwebtoken');

// Separate from the regular user JWT (middleware.js) - admin tokens carry
// an isAdmin flag and are signed with a different secret, so a leaked user
// token can never be used to access admin routes, and vice versa.
function requireAdminAuth(req, res, next) {
  // Accept the token either as a normal header (for API calls/Postman) or
  // as a ?token= query param (so PDF links can be opened directly in a
  // browser and downloaded, then shared via WhatsApp like any other file).
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = headerToken || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Admin login required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}

module.exports = requireAdminAuth;