// authRoutes.js - Combined and Updated
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Database test route (public for debugging)
router.get('/test-db', authController.testDbConnection); // assuming this exists in controller

// Protected routes (authentication required)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Alternative route for logged-in user info
router.get('/users/me', authenticateToken, (req, res) => {
  res.json({
    userId: req.user.userId,
    name: req.user.name,
    email: req.user.email,
  });
});

// Health check for auth system
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Authentication Service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
