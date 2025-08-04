const bcrypt = require('bcrypt');
const sql = require('mssql');
const { executeWithRetry, getPool } = require('./usermodel'); // Import from usermodel

const settingsModel = {
  // Get user settings with connection retry
  async getUserSettings(pool, userId) {
    return executeWithRetry(async (currentPool) => {
      console.log('📖 Getting settings for user:', userId);
      const result = await currentPool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            SettingID,
            Theme,
            FontSize,
            NotificationSound,
            MedicationReminders,
            AppointmentReminders
          FROM Settings 
          WHERE UserID = @userId
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      const settings = result.recordset[0];
      return {
        settingId: settings.SettingID,
        theme: settings.Theme || 'light',
        fontSize: settings.FontSize || 'medium',
        notificationSound: settings.NotificationSound || 'classic-bell',
        medicationReminders: settings.MedicationReminders !== false,
        appointmentReminders: settings.AppointmentReminders !== false
      };
    });
  },

  // Update or create user settings with connection retry
  async updateUserSettings(pool, userId, settingsData) {
    return executeWithRetry(async (currentPool) => {
      console.log('💾 Updating settings for user:', userId, 'Data:', settingsData);
      
      const request = currentPool.request();
      request.input('userId', sql.Int, userId);
      request.input('theme', sql.VarChar(20), settingsData.theme || 'light');
      request.input('fontSize', sql.VarChar(20), settingsData.fontSize || 'medium');
      request.input('notificationSound', sql.VarChar(100), settingsData.notificationSound || 'classic-bell');
      request.input('medicationReminders', sql.Bit, settingsData.medicationReminders !== false);
      request.input('appointmentReminders', sql.Bit, settingsData.appointmentReminders !== false);
      
      // Check if settings exist
      const checkResult = await request.query(`
        SELECT SettingID FROM Settings WHERE UserID = @userId
      `);
      
      if (checkResult.recordset.length === 0) {
        // Create new settings
        console.log('➕ Creating new settings for user:', userId);
        const insertResult = await request.query(`
          INSERT INTO Settings (UserID, Theme, FontSize, NotificationSound, MedicationReminders, AppointmentReminders)
          OUTPUT INSERTED.SettingID
          VALUES (@userId, @theme, @fontSize, @notificationSound, @medicationReminders, @appointmentReminders)
        `);
        
        return {
          settingId: insertResult.recordset[0].SettingID,
          theme: settingsData.theme || 'light',
          fontSize: settingsData.fontSize || 'medium',
          notificationSound: settingsData.notificationSound || 'classic-bell',
          medicationReminders: settingsData.medicationReminders !== false,
          appointmentReminders: settingsData.appointmentReminders !== false
        };
      } else {
        // Update existing settings
        console.log('🔄 Updating existing settings for user:', userId);
        await request.query(`
          UPDATE Settings 
          SET Theme = @theme,
              FontSize = @fontSize,
              NotificationSound = @notificationSound,
              MedicationReminders = @medicationReminders,
              AppointmentReminders = @appointmentReminders,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId
        `);
        
        return {
          settingId: checkResult.recordset[0].SettingID,
          theme: settingsData.theme || 'light',
          fontSize: settingsData.fontSize || 'medium',
          notificationSound: settingsData.notificationSound || 'classic-bell',
          medicationReminders: settingsData.medicationReminders !== false,
          appointmentReminders: settingsData.appointmentReminders !== false
        };
      }
    });
  },

  // Get user profile with connection retry
  async getUserProfile(pool, userId) {
    return executeWithRetry(async (currentPool) => {
      console.log('📖 Getting profile for user:', userId);
      const result = await currentPool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            UserID,
            Name,
            Email,
            DateOfBirth,
            Gender,
            HealthConditions
          FROM Users 
          WHERE UserID = @userId
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      const user = result.recordset[0];
      return {
        userId: user.UserID,
        name: user.Name,
        email: user.Email,
        dateOfBirth: user.DateOfBirth,
        gender: user.Gender,
        healthConditions: user.HealthConditions
      };
    });
  },

  // Get user by ID (including password hash) with connection retry
  async getUserById(pool, userId) {
    return executeWithRetry(async (currentPool) => {
      console.log('🔍 Getting user by ID:', userId);
      const result = await currentPool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            UserID,
            Name,
            Email,
            PasswordHash,
            DateOfBirth,
            Gender,
            HealthConditions
          FROM Users 
          WHERE UserID = @userId
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    });
  },

  // Check if email exists for another user with connection retry
  async checkEmailExists(pool, email, excludeUserId = null) {
    return executeWithRetry(async (currentPool) => {
      const request = currentPool.request();
      request.input('email', sql.VarChar(100), email);
      
      let query = 'SELECT COUNT(*) as count FROM Users WHERE Email = @email';
      if (excludeUserId) {
        request.input('excludeUserId', sql.Int, excludeUserId);
        query += ' AND UserID != @excludeUserId';
      }
      
      const result = await request.query(query);
      return result.recordset[0].count > 0;
    });
  },

  // Update user profile with connection retry
  async updateUserProfile(pool, userId, profileData) {
    return executeWithRetry(async (currentPool) => {
      console.log('🔄 Updating profile for user:', userId);
      
      // Build dynamic query based on provided fields
      const updateFields = [];
      const request = currentPool.request();
      request.input('userId', sql.Int, userId);
      
      if (profileData.name !== undefined) {
        updateFields.push('Name = @name');
        request.input('name', sql.VarChar(100), profileData.name);
      }
      
      if (profileData.email !== undefined) {
        updateFields.push('Email = @email');
        request.input('email', sql.VarChar(100), profileData.email);
      }
      
      if (profileData.dateOfBirth !== undefined) {
        updateFields.push('DateOfBirth = @dateOfBirth');
        request.input('dateOfBirth', sql.Date, profileData.dateOfBirth);
      }
      
      if (profileData.gender !== undefined) {
        updateFields.push('Gender = @gender');
        request.input('gender', sql.VarChar(10), profileData.gender);
      }
      
      if (profileData.healthConditions !== undefined) {
        updateFields.push('HealthConditions = @healthConditions');
        request.input('healthConditions', sql.Text, profileData.healthConditions);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      // First, check if user exists
      const checkResult = await request.query(`
        SELECT UserID FROM Users WHERE UserID = @userId
      `);
      
      if (checkResult.recordset.length === 0) {
        return null;
      }
      
      // Update the user
      const updateQuery = `
        UPDATE Users 
        SET ${updateFields.join(', ')}
        WHERE UserID = @userId
      `;
      
      console.log('Executing update query:', updateQuery);
      await request.query(updateQuery);
      
      // Get the updated user data
      const result = await request.query(`
        SELECT 
          UserID,
          Name,
          Email,
          DateOfBirth,
          Gender,
          HealthConditions
        FROM Users 
        WHERE UserID = @userId
      `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      const user = result.recordset[0];
      return {
        userId: user.UserID,
        name: user.Name,
        email: user.Email,
        dateOfBirth: user.DateOfBirth,
        gender: user.Gender,
        healthConditions: user.HealthConditions
      };
    });
  },

  // Change password with connection retry
  async changePassword(pool, userId, hashedPassword) {
    return executeWithRetry(async (currentPool) => {
      const request = currentPool.request();
      request.input('userId', sql.Int, userId);
      request.input('hashedPassword', sql.VarChar(255), hashedPassword);
      
      // Check if user exists first
      const checkResult = await request.query(`
        SELECT UserID FROM Users WHERE UserID = @userId
      `);
      
      if (checkResult.recordset.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      // Update password
      const result = await request.query(`
        UPDATE Users 
        SET PasswordHash = @hashedPassword 
        WHERE UserID = @userId
      `);
      
      if (result.rowsAffected[0] === 0) {
        return { success: false, message: 'Failed to update password' };
      }
      
      return { success: true, message: 'Password changed successfully' };
    });
  },

  // Delete user account with connection retry
  async deleteUserAccount(pool, userId) {
    return executeWithRetry(async (currentPool) => {
      const transaction = new sql.Transaction(currentPool);
      
      try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('userId', sql.Int, userId);
        
        // Check if user exists first
        const checkResult = await request.query(`
          SELECT UserID FROM Users WHERE UserID = @userId
        `);
        
        if (checkResult.recordset.length === 0) {
          await transaction.rollback();
          return { success: false, message: 'User not found' };
        }
        
        // Delete in order to maintain referential integrity
        await request.query(`DELETE FROM DietPlan WHERE UserID = @userId`);
        await request.query(`DELETE FROM Settings WHERE UserID = @userId`);
        await request.query(`DELETE FROM Notifications WHERE UserID = @userId`);
        await request.query(`DELETE FROM Vitals WHERE UserID = @userId`);
        await request.query(`DELETE FROM MedicalHistory WHERE UserID = @userId`);
        await request.query(`DELETE FROM MedicationTracker WHERE MedicationID IN (SELECT MedicationID FROM Medications WHERE UserID = @userId)`);
        await request.query(`DELETE FROM Medications WHERE UserID = @userId`);
        await request.query(`DELETE FROM Appointments WHERE UserID = @userId`);
        
        // Finally delete the user
        const deleteResult = await request.query(`DELETE FROM Users WHERE UserID = @userId`);
        
        if (deleteResult.rowsAffected[0] === 0) {
          await transaction.rollback();
          return { success: false, message: 'Failed to delete user' };
        }
        
        await transaction.commit();
        return { success: true, message: 'Account deleted successfully' };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  },

  // Export all user data with connection retry
  async exportUserData(pool, userId) {
    return executeWithRetry(async (currentPool) => {
      const request = currentPool.request();
      request.input('userId', sql.Int, userId);
      
      // Get user profile (without password)
      const profileResult = await request.query(`
        SELECT UserID, Name, Email, DateOfBirth, Gender, HealthConditions
        FROM Users WHERE UserID = @userId
      `);
      
      if (profileResult.recordset.length === 0) {
        return null;
      }
      
      // Get other data safely
      const settingsResult = await request.query(`SELECT Theme, FontSize, NotificationSound, MedicationReminders, AppointmentReminders FROM Settings WHERE UserID = @userId`);
      const appointmentsResult = await request.query(`SELECT AppointmentDate, AppointmentTime, Location, DoctorName, Description FROM Appointments WHERE UserID = @userId`);
      const medicationsResult = await request.query(`SELECT Name, Dosage, Frequency, StartDate, EndDate, Notes FROM Medications WHERE UserID = @userId`);
      const dietPlanResult = await request.query(`SELECT MealName, Calories, MealType, MealDate, Notes FROM DietPlan WHERE UserID = @userId`);
      const vitalsResult = await request.query(`SELECT ReadingDateTime, HeartRate, BloodPressureSYS, BloodPressureDIA, BloodSugar, SleepHours FROM Vitals WHERE UserID = @userId`);
      const medicalHistoryResult = await request.query(`SELECT Diagnosis, Allergies, Treatments, RecordDate FROM MedicalHistory WHERE UserID = @userId`);
      const notificationsResult = await request.query(`SELECT Type, Message, NotifyTime, RepeatInterval, IsMuted FROM Notifications WHERE UserID = @userId`);
      
      return {
        profile: profileResult.recordset[0],
        settings: settingsResult.recordset[0] || {},
        appointments: appointmentsResult.recordset || [],
        medications: medicationsResult.recordset || [],
        dietPlan: dietPlanResult.recordset || [],
        vitals: vitalsResult.recordset || [],
        medicalHistory: medicalHistoryResult.recordset || [],
        notifications: notificationsResult.recordset || []
      };
    });
  }
};

module.exports = settingsModel;