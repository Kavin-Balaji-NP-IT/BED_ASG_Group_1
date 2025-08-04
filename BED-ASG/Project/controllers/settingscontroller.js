
// controllers/settingsController.js
const bcrypt = require('bcrypt');

// Import model - with error handling
let settingsModel;
try {
  settingsModel = require('../models/settingsmodel');
  console.log('✅ Settings model loaded successfully');
} catch (error) {
  console.error('❌ Error loading settings model:', error.message);
  // Create a fallback model
  settingsModel = null;
}

const settingsController = {
  // Get user settings
  async getUserSettings(req, res) {
    try {
      console.log('🔍 getUserSettings called for user:', req.user?.userId);
      
      const userId = req.user?.userId;
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!settingsModel) {
        console.log('⚠️ Settings model not available, returning default settings');
        const defaultSettings = {
          theme: 'light',
          fontSize: 'medium',
          notificationSound: 'classic-bell',
          medicationReminders: true,
          appointmentReminders: true
        };
        return res.json(defaultSettings);
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        console.log('❌ No database pool available');
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      console.log('📖 Fetching settings from database for user:', userId);
      const settings = await settingsModel.getUserSettings(pool, userId);
      
      if (!settings) {
        console.log('📝 No settings found, returning defaults for user:', userId);
        // Return default settings if none exist
        const defaultSettings = {
          theme: 'light',
          fontSize: 'medium',
          notificationSound: 'classic-bell',
          medicationReminders: true,
          appointmentReminders: true
        };
        return res.json(defaultSettings);
      }
      
      console.log('✅ Settings retrieved successfully for user:', userId);
      res.json(settings);
    } catch (error) {
      console.error('❌ Error getting user settings:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to retrieve settings',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Update user settings
  async updateUserSettings(req, res) {
    try {
      console.log('🔍 updateUserSettings called for user:', req.user?.userId);
      console.log('📝 Settings data received:', req.body);
      
      const userId = req.user?.userId;
      const settingsData = req.body;
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!settingsData || Object.keys(settingsData).length === 0) {
        console.log('❌ No settings data provided');
        return res.status(400).json({ error: 'Settings data is required' });
      }
      
      if (!settingsModel) {
        console.log('⚠️ Settings model not available, saving to localStorage only');
        return res.json({
          message: 'Settings updated successfully (local only)',
          settings: settingsData
        });
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        console.log('❌ No database pool available');
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      console.log('💾 Updating settings in database for user:', userId);
      console.log('💾 Settings to save:', settingsData);
      
      const updatedSettings = await settingsModel.updateUserSettings(pool, userId, settingsData);
      
      console.log('✅ Settings updated successfully for user:', userId);
      console.log('✅ Updated settings:', updatedSettings);
      
      res.json({
        message: 'Settings updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Handle specific database errors
      if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN') {
        return res.status(503).json({
          error: 'Database connection error',
          message: 'Database temporarily unavailable. Please try again.'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to update settings',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          sqlState: error.state
        } : undefined
      });
    }
  },

  // Get user profile for settings
  async getUserProfile(req, res) {
    try {
      console.log('🔍 getUserProfile called for user:', req.user?.userId);
      
      const userId = req.user?.userId;
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!settingsModel) {
        console.log('❌ Settings model not available');
        return res.status(503).json({ 
          error: 'Settings service unavailable',
          message: 'Please try again later'
        });
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        console.log('❌ No database pool available');
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      console.log('📖 Fetching profile from database for user:', userId);
      const profile = await settingsModel.getUserProfile(pool, userId);
      
      if (!profile) {
        console.log('❌ User profile not found for user:', userId);
        return res.status(404).json({ error: 'User profile not found' });
      }
      
      // Remove sensitive data from response
      const sanitizedProfile = { ...profile };
      delete sanitizedProfile.PasswordHash;
      delete sanitizedProfile.password;
      delete sanitizedProfile.Password;
      
      console.log('✅ Profile retrieved successfully for user:', userId);
      res.json(sanitizedProfile);
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to retrieve profile',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Update user profile
  async updateUserProfile(req, res) {
    try {
      console.log('🔍 updateUserProfile called for user:', req.user?.userId);
      console.log('📝 Profile data received:', req.body);
      
      const userId = req.user?.userId;
      const profileData = req.body;
      
      if (!userId) {
        console.log('❌ No user ID found in request');
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!profileData || Object.keys(profileData).length === 0) {
        console.log('❌ No profile data provided');
        return res.status(400).json({ error: 'Profile data is required' });
      }
      
      if (!settingsModel) {
        console.log('❌ Settings model not available');
        return res.status(503).json({ 
          error: 'Settings service unavailable',
          message: 'Please try again later'
        });
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        console.log('❌ No database pool available');
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      // Validate required fields
      if (profileData.name && profileData.name.trim().length === 0) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      
      if (profileData.email && !isValidEmail(profileData.email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }
      
      console.log('🔄 Updating profile in database for user:', userId);
      
      // Check if user exists first
      const existingProfile = await settingsModel.getUserProfile(pool, userId);
      if (!existingProfile) {
        console.log('❌ User not found for user:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if email is already taken by another user
      if (profileData.email && profileData.email !== existingProfile.email) {
        const emailExists = await settingsModel.checkEmailExists(pool, profileData.email, userId);
        if (emailExists) {
          console.log('❌ Email already exists:', profileData.email);
          return res.status(400).json({ error: 'Email address is already in use' });
        }
      }
      
      const updatedProfile = await settingsModel.updateUserProfile(pool, userId, profileData);
      
      if (!updatedProfile) {
        console.log('❌ Failed to update profile for user:', userId);
        return res.status(404).json({ error: 'Failed to update profile - user not found' });
      }
      
      // Remove sensitive data from response
      const sanitizedProfile = { ...updatedProfile };
      delete sanitizedProfile.PasswordHash;
      delete sanitizedProfile.password;
      delete sanitizedProfile.Password;
      
      console.log('✅ Profile updated successfully for user:', userId);
      res.json({
        message: 'Profile updated successfully',
        profile: sanitizedProfile
      });
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      console.error('Error stack:', error.stack);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23000') {
        return res.status(400).json({ 
          error: 'Email address is already in use'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to update profile',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Change user password
  async changePassword(req, res) {
    try {
      console.log('🔍 changePassword called for user:', req.user?.userId);
      
      const userId = req.user?.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }
      
      if (confirmPassword && newPassword !== confirmPassword) {
        return res.status(400).json({ 
          error: 'New password and confirmation password do not match' 
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }
      
      if (!settingsModel) {
        return res.status(503).json({ 
          error: 'Settings service unavailable',
          message: 'Please try again later'
        });
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      console.log('🔐 Changing password for user:', userId);
      
      // Get current user data to verify current password
      const user = await settingsModel.getUserById(pool, userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.PasswordHash || user.password);
      if (!isCurrentPasswordValid) {
        console.log('❌ Current password incorrect for user:', userId);
        return res.status(400).json({ 
          error: 'Current password is incorrect' 
        });
      }
      
      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const result = await settingsModel.changePassword(pool, userId, hashedNewPassword);
      
      if (!result || !result.success) {
        return res.status(400).json({ 
          error: result?.message || 'Failed to change password' 
        });
      }
      
      console.log('✅ Password changed successfully for user:', userId);
      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('❌ Error changing password:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to change password',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Delete user account
  async deleteAccount(req, res) {
    try {
      console.log('🔍 deleteAccount called for user:', req.user?.userId);
      
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!settingsModel) {
        return res.status(503).json({ 
          error: 'Settings service unavailable',
          message: 'Please try again later'
        });
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      console.log('🗑️ Deleting account for user:', userId);
      
      // Check if user exists first
      const existingUser = await settingsModel.getUserById(pool, userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const result = await settingsModel.deleteUserAccount(pool, userId);
      
      if (!result || !result.success) {
        return res.status(400).json({ 
          error: result?.message || 'Failed to delete account' 
        });
      }
      
      console.log('✅ Account deleted successfully for user:', userId);
      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to delete account',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Export user data
  async exportUserData(req, res) {
    try {
      console.log('🔍 exportUserData called for user:', req.user?.userId);
      
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!settingsModel) {
        return res.status(503).json({ 
          error: 'Settings service unavailable',
          message: 'Please try again later'
        });
      }
      
      // Use the pool from dbConfig instead of req.dbPool
      const { getPool } = require('../models/usermodel');
      const pool = await getPool();
      
      if (!pool) {
        return res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please try again in a moment'
        });
      }
      
      console.log('📤 Exporting data for user:', userId);
      
      const userData = await settingsModel.exportUserData(pool, userId);
      
      if (!userData) {
        return res.status(404).json({ error: 'User data not found' });
      }
      
      // Remove sensitive data from export
      if (userData.profile) {
        delete userData.profile.PasswordHash;
        delete userData.profile.password;
        delete userData.profile.Password;
      }
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mokesell-health-data-${new Date().toISOString().split('T')[0]}.json"`);
      
      console.log('✅ Data exported successfully for user:', userId);
      res.json({
        exportDate: new Date().toISOString(),
        user: userData.profile || {},
        settings: userData.settings || {},
        appointments: userData.appointments || [],
        medications: userData.medications || [],
        dietPlan: userData.dietPlan || [],
        vitals: userData.vitals || [],
        medicalHistory: userData.medicalHistory || [],
        notifications: userData.notifications || []
      });
    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to export data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

console.log('✅ Settings controller loaded successfully');

module.exports = settingsController;