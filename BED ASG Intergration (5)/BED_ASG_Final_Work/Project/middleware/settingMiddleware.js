// middleware/settingMiddleware.js 
// Validate settings data
const validateSettings = (req, res, next) => {
  console.log('🔍 Validating settings:', req.body);
  
  const { theme, fontSize, notificationSound, medicationReminders, appointmentReminders } = req.body;
  
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
    console.log('❌ Settings validation errors:', errors);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  console.log('✅ Settings validation passed');
  next();
};

// Validate profile data
const validateProfile = (req, res, next) => {
  console.log('🔍 Validating profile:', req.body);
  
  const { name, email, dateOfBirth, gender, healthConditions } = req.body;
  
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

// Validate password change data
const validatePasswordChange = (req, res, next) => {
  console.log('🔍 Validating password change');
  
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
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

// Validate user ID parameter
const validateUserId = (req, res, next) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a positive integer'
    });
  }
  
  // Check if user is trying to access their own data
  if (req.user && req.user.userId !== userId) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own settings'
    });
  }
  
  next();
};

// Rate limiting for sensitive operations
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

// Sanitize and validate export request
const validateExportRequest = (req, res, next) => {
  // Log export request for audit purposes
  console.log(`📥 Data export requested by user ${req.user?.userId} at ${new Date().toISOString()}`);
  
  // Add security headers for file download
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  next();
};

console.log('✅ Settings middleware loaded successfully');

module.exports = {
  validateSettings,
  validateProfile,
  validatePasswordChange,
  validateUserId,
  rateLimitSensitive,
  validateExportRequest
};