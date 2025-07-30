const sql = require('mssql');
const dbConfig = require('../dbConfig');

const AppointmentModel = {
  // Create new appointment
  create: async (userId, appointmentDate, description) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('appointmentDate', sql.DateTime, appointmentDate)
      .input('description', sql.NVarChar(255), description)
      .query(`
        INSERT INTO Appointments (userId, appointmentDate, description)
        VALUES (@userId, @appointmentDate, @description)
      `);
    await pool.close();
    return result.rowsAffected[0] > 0;
  },

  // Get all appointments for a specific user, ordered by date ascending
  getByUser: async (userId) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Appointments WHERE userId = @userId ORDER BY appointmentDate ASC');
    await pool.close();
    return result.recordset;
  },

  // Update an appointment by appointmentId and userId (to prevent updating others' data)
  update: async (appointmentId, userId, appointmentDate, description) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('appointmentId', sql.Int, appointmentId)
      .input('userId', sql.Int, userId)
      .input('appointmentDate', sql.DateTime, appointmentDate)
      .input('description', sql.NVarChar(255), description)
      .query(`
        UPDATE Appointments
        SET appointmentDate = @appointmentDate, description = @description
        WHERE appointmentId = @appointmentId AND userId = @userId
      `);
    await pool.close();
    return result.rowsAffected[0] > 0;
  },

  // Delete an appointment by appointmentId and userId (to prevent deleting others' data)
  delete: async (appointmentId, userId) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('appointmentId', sql.Int, appointmentId)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Appointments WHERE appointmentId = @appointmentId AND userId = @userId');
    await pool.close();
    return result.rowsAffected[0] > 0;
  }
};

module.exports = AppointmentModel;
