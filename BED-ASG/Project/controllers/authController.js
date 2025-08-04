const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/usermodel');

const JWT_SECRET = process.env.JWT_SECRET || '5f4cc364f70b766197f272c3019aaa28f659e5f149dbd7f22c862ac026bfd6fe';
const SALT_ROUNDS = 10;

// Register new user
async function register(req, res) {
  try {
    const { name, email, password, dateOfBirth, gender, healthConditions } = req.body;

    console.log("Register request body:", req.body); // ✅ Debugging log

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const newUser = await UserModel.createUser({
      name,
      email,
      passwordHash,
      dateOfBirth,
      gender,
      healthConditions
    });

    console.log("User created successfully:", newUser);

    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser.UserID,
      user: {
        id: newUser.UserID,
        name: newUser.Name,
        email: newUser.Email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Handle specific database errors
    if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN') {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again.' 
      });
    }
    
    if (error.message && error.message.includes('Email already exists')) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    if (error.message && error.message.includes('Required fields are missing')) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// User login - Updated to return user data for frontend
async function login(req, res) {
  try {
    const { email, password } = req.body;

    console.log("Login request for email:", email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatch) {
      console.log("Password mismatch for email:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const payload = {
      userId: user.UserID,
      name: user.Name,
      email: user.Email
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // Extended to 24h

    console.log("✅ Login successful for user:", user.UserID);

    // Return user data along with token for frontend use
    res.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        dateOfBirth: user.DateOfBirth,
        gender: user.Gender,
        healthConditions: user.HealthConditions
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific database errors
    if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN') {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get user profile (protected route)
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    
    const user = await UserModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        dateOfBirth: user.DateOfBirth,
        gender: user.Gender,
        healthConditions: user.HealthConditions
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN') {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Update user profile (protected route)
async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const { name, dateOfBirth, gender, healthConditions } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedUser = await UserModel.updateUser(userId, {
      name,
      dateOfBirth,
      gender,
      healthConditions
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.UserID,
        name: updatedUser.Name,
        email: updatedUser.Email,
        dateOfBirth: updatedUser.DateOfBirth,
        gender: updatedUser.Gender,
        healthConditions: updatedUser.HealthConditions
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN') {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Test database connection endpoint
async function testDbConnection(req, res) {
  try {
    const isConnected = await UserModel.testConnection();
    const status = UserModel.getConnectionStatus();
    
    res.json({
      database: {
        connected: isConnected,
        status: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      database: {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Invalid token. Please login again.' });
      } else {
        return res.status(403).json({ message: 'Token verification failed' });
      }
    }
    
    req.user = user; // Add user info to request object
    next();
  });
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  testDbConnection,
  authenticateToken
};