const sql = require('mssql');
const dbConfig = require('../dbconfig'); // Using your existing dbconfig

const AppointmentModel = {
  // Create new appointment (without CreatedAt)
  create: async (userId, appointmentDate, description) => {
    try {
      console.log('Creating appointment with:', { userId, appointmentDate, description });
      
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('appointmentDate', sql.DateTime, appointmentDate)
        .input('description', sql.NVarChar(255), description)
        .query(`
          INSERT INTO Appointments (UserID, AppointmentDate, Description)
          VALUES (@userId, @appointmentDate, @description)
        `);
      
      console.log('Insert result:', result);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Get all appointments for a specific user, ordered by date ascending
  getByUser: async (userId) => {
    try {
      console.log('Fetching appointments for userId:', userId);
      
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT AppointmentID as appointmentId, 
                 UserID as userId,
                 AppointmentDate as appointmentDate, 
                 Description as description
          FROM Appointments 
          WHERE UserID = @userId 
          ORDER BY AppointmentDate ASC
        `);
      
      console.log('Query result:', result.recordset);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  // Get a specific appointment by ID and userId (for security)
  getById: async (appointmentId, userId) => {
    try {
      console.log('Fetching appointment:', { appointmentId, userId });
      
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('appointmentId', sql.Int, appointmentId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT AppointmentID as appointmentId, 
                 UserID as userId,
                 AppointmentDate as appointmentDate, 
                 Description as description
          FROM Appointments 
          WHERE AppointmentID = @appointmentId AND UserID = @userId
        `);
      
      console.log('Query result:', result.recordset);
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

  // Update an appointment by appointmentId and userId (to prevent updating others' data)
  update: async (appointmentId, userId, appointmentDate, description) => {
    try {
      console.log('Updating appointment:', { appointmentId, userId, appointmentDate, description });
      
      const pool = await sql.connect(dbConfig);
      
      // Build dynamic query based on provided fields
      let updateFields = [];
      let request = pool.request()
        .input('appointmentId', sql.Int, appointmentId)
        .input('userId', sql.Int, userId);
      
      if (appointmentDate) {
        updateFields.push('AppointmentDate = @appointmentDate');
        request.input('appointmentDate', sql.DateTime, appointmentDate);
      }
      
      if (description !== undefined && description !== null) {
        updateFields.push('Description = @description');
        request.input('description', sql.NVarChar(255), description);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      const query = `
        UPDATE Appointments
        SET ${updateFields.join(', ')}
        WHERE AppointmentID = @appointmentId AND UserID = @userId
      `;
      
      console.log('Update query:', query);
      
      const result = await request.query(query);
      console.log('Update result:', result);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  // Delete an appointment by appointmentId and userId (to prevent deleting others' data)
  delete: async (appointmentId, userId) => {
    try {
      console.log('Deleting appointment:', { appointmentId, userId });
      
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('appointmentId', sql.Int, appointmentId)
        .input('userId', sql.Int, userId)
        .query('DELETE FROM Appointments WHERE AppointmentID = @appointmentId AND UserID = @userId');
      
      console.log('Delete result:', result);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }
};

module.exports = AppointmentModel;