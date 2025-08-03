const sql = require('mssql');
const dbConfig = require('../dbConfig');

module.exports = {
  createEvent: async (userId, eventTitle, eventDate, eventLocation, eventDescription) => {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('eventTitle', sql.NVarChar(255), eventTitle)
      .input('eventDate', sql.DateTime, eventDate)
      .input('eventLocation', sql.NVarChar(255), eventLocation)
      .input('eventDescription', sql.NVarChar(sql.MAX), eventDescription)
      .query(`
        INSERT INTO Events (userId, eventTitle, eventDate, eventLocation, eventDescription)
        VALUES (@userId, @eventTitle, @eventDate, @eventLocation, @eventDescription)
      `);
  },

  getAllEventsForUser: async (userId) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`SELECT * FROM Events WHERE userId = @userId ORDER BY eventDate ASC`);
    return result.recordset;
  },

  updateEvent: async (eventId, userId, eventTitle, eventDate, eventLocation, eventDescription) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('eventId', sql.Int, eventId)
      .input('userId', sql.Int, userId)
      .input('eventTitle', sql.NVarChar(255), eventTitle)
      .input('eventDate', sql.DateTime, eventDate)
      .input('eventLocation', sql.NVarChar(255), eventLocation)
      .input('eventDescription', sql.NVarChar(sql.MAX), eventDescription)
      .query(`
        UPDATE Events
        SET eventTitle = @eventTitle,
            eventDate = @eventDate,
            eventLocation = @eventLocation,
            eventDescription = @eventDescription
        WHERE eventId = @eventId AND userId = @userId
      `);
    return result;
  },

  deleteEvent: async (eventId, userId) => {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('eventId', sql.Int, eventId)
      .input('userId', sql.Int, userId)
      .query(`DELETE FROM Events WHERE eventId = @eventId AND userId = @userId`);
    return result;
  }
};
