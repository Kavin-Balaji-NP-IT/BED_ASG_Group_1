const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '5f4cc364f70b766197f272c3019aaa28f659e5f149dbd7f22c862ac026bfd6fe';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1]; // Bearer token
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

    console.log("Decoded JWT payload:", payload);  // Debugging

    // Try to get userId from possible keys
    const userId = payload.userId || payload.id || payload.sub;

    if (!userId) {
      return res.status(401).json({ message: 'User ID missing in token payload' });
    }

    req.user = { userId };
    next();
  });
}

module.exports = authenticateToken;
