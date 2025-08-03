const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    console.log('[Decoded JWT]', decoded); // ✅ Safe to use decoded here to get the user id

    req.user = decoded; // Store decoded token info in req.user
    next(); // Continue to the next middleware or route handler
  });
}

module.exports = verifyToken;
