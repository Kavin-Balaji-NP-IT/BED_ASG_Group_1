// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();

// Import controller and middleware
const settingsController = require('../controllers/settingscontroller');
const authenticateToken = require('../middleware/authMiddleware');

// Simple validation middleware (inline to avoid import issues)
const validateSettings = (req, res, next) => {
  const { theme, fontSize, notificationSound, medicationReminders, appointmentReminders } = req.body;
  
  console.log('🔍 Validating settings:', req.body);
  
  const errors = [];
  
  // Validate theme
  if (theme && !['light', 'dark'].includes(theme)) {
    errors.push('Theme must be either "light" or "dark"');
  }
  
  // Validate font size
  if (fontSize && !['small', 'medium', 'large', 'extra-large'].includes(fontSize)) {
    errors.push('Font size must be one of: small, medium, large, extra-large');
  }
  
  // Validate notification sound
  if (notificationSound && !['classic-bell', 'gentle-ping', 'soft-chime', 'none'].includes(notificationSound)) {
    errors.push('Notification sound must be one of: classic-bell, gentle-ping, soft-chime, none');
  }
  
  // Validate boolean fields
  if (medicationReminders !== undefined && typeof medicationReminders !== 'boolean') {
    errors.push('Medication reminders must be a boolean value');
  }
  
  if (appointmentReminders !== undefined && typeof appointmentReminders !== 'boolean') {
    errors.push('Appointment reminders must be a boolean value');
  }
  
  if (errors.length > 0) {
    console.log('❌ Validation errors:', errors);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  console.log('✅ Settings validation passed');
  next();
};

// Simple profile validation middleware
const validateProfile = (req, res, next) => {
  const { name, email, dateOfBirth, gender, healthConditions } = req.body;
  
  console.log('🔍 Validating profile:', req.body);
  
  const errors = [];
  
  // Validate required fields
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  } else if (email.length > 100) {
    errors.push('Email must be less than 100 characters');
  }
  
  // Validate optional fields
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    errors.push('Date of birth must be in YYYY-MM-DD format');
  }
  
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    errors.push('Gender must be one of: Male, Female, Other');
  }
  
  if (healthConditions && healthConditions.length > 5000) {
    errors.push('Health conditions must be less than 5000 characters');
  }
  
  if (errors.length > 0) {
    console.log('❌ Profile validation errors:', errors);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  // Sanitize data
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  if (healthConditions) {
    req.body.healthConditions = healthConditions.trim();
  }
  
  console.log('✅ Profile validation passed');
  next();
};

// Simple password validation middleware
const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  console.log('🔍 Validating password change');
  
  const errors = [];
  
  // Validate required fields
  if (!currentPassword) {
    errors.push('Current password is required');
  }
  
  if (!newPassword) {
    errors.push('New password is required');
  } else if (newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long');
  } else if (newPassword.length > 255) {
    errors.push('New password must be less than 255 characters');
  }
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required');
  } else if (newPassword !== confirmPassword) {
    errors.push('New password and confirmation do not match');
  }
  
  // Check if new password is different from current
  if (currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }
  
  if (errors.length > 0) {
    console.log('❌ Password validation errors:', errors);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  console.log('✅ Password validation passed');
  next();
};

// Simple rate limiting middleware
const rateLimitSensitive = (() => {
  const attempts = new Map();
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  
  return (req, res, next) => {
    const key = `${req.ip}-${req.user?.userId || 'unknown'}`;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }
    
    const userAttempts = attempts.get(key);
    
    if (now > userAttempts.resetTime) {
      // Reset window
      attempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }
    
    if (userAttempts.count >= MAX_ATTEMPTS) {
      console.log(`⚠️ Rate limit exceeded for ${key}`);
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Please wait 15 minutes before trying again',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
    }
    
    userAttempts.count++;
    next();
  };
})();

// Export request validation
const validateExportRequest = (req, res, next) => {
  console.log(`📥 Data export requested by user ${req.user?.userId} at ${new Date().toISOString()}`);
  
  // Add security headers for file download
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  next();
};

// Add request logging middleware
router.use((req, res, next) => {
  console.log(`🔄 Settings route: ${req.method} ${req.originalUrl}`);
  console.log(`🔄 User ID: ${req.user?.userId}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`🔄 Request body:`, req.body);
  }
  next();
});

// MAIN ROUTES

/**
 * GET /api/settings - Get user settings
 */
router.get('/', authenticateToken, (req, res, next) => {
  console.log('📖 Getting user settings...');
  settingsController.getUserSettings(req, res, next);
});

/**
 * PUT /api/settings - Update user settings
 */
router.put('/', authenticateToken, validateSettings, (req, res, next) => {
  console.log('💾 Updating user settings...');
  settingsController.updateUserSettings(req, res, next);
});

/**
 * GET /api/settings/profile - Get user profile
 */
router.get('/profile', authenticateToken, (req, res, next) => {
  console.log('📖 Getting user profile...');
  settingsController.getUserProfile(req, res, next);
});

/**
 * PUT /api/settings/profile - Update user profile
 */
router.put('/profile', authenticateToken, validateProfile, (req, res, next) => {
  console.log('💾 Updating user profile...');
  settingsController.updateUserProfile(req, res, next);
});

/**
 * POST /api/settings/change-password - Change user password
 */
router.post('/change-password', authenticateToken, rateLimitSensitive, validatePasswordChange, (req, res, next) => {
  console.log('🔐 Changing user password...');
  settingsController.changePassword(req, res, next);
});

/**
 * GET /api/settings/export - Export user data
 */
router.get('/export', authenticateToken, validateExportRequest, (req, res, next) => {
  console.log('📤 Exporting user data...');
  settingsController.exportUserData(req, res, next);
});

/**
 * DELETE /api/settings/delete-account - Delete user account
 */
router.delete('/delete-account', authenticateToken, rateLimitSensitive, (req, res, next) => {
  console.log('🗑️ Deleting user account...');
  settingsController.deleteAccount(req, res, next);
});

// TEST ROUTES for debugging

/**
 * GET /api/settings/test - Test settings routes are working
 */
router.get('/test', authenticateToken, (req, res) => {
  console.log('🧪 Settings test route accessed');
  res.json({
    message: 'Settings routes are working!',
    userId: req.user?.userId,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/settings',
      'PUT /api/settings',
      'GET /api/settings/profile',
      'PUT /api/settings/profile',
      'POST /api/settings/change-password',
      'GET /api/settings/export',
      'DELETE /api/settings/delete-account'
    ]
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Settings route error:', error);
  
  if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN') {
    return res.status(503).json({
      error: 'Database connection error',
      message: 'Database temporarily unavailable. Please try again.'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Settings routes loaded successfully');

module.exports = router;