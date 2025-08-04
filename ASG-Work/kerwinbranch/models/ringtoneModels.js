const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Update ringtone for a specific medication and user
async function postRingtoneById(id, userId, audioLink) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('user_id', sql.Int, userId) // Include userId
    .input('audio_link', sql.VarChar(255), audioLink)
    .query(`
        UPDATE Medications
        SET audio_link = @audio_link
        WHERE id = @id
          AND user_id = @user_id; -- Ensure only the authenticated user's data is updated
    `);

  return result.rowsAffected;
}

// Update ringtone for a specific medication occurrence and user
async function postRingtoneOccurrenceById(id, userId, audioLink) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('user_id', sql.Int, userId) // Include userId
    .input('audio_link', sql.VarChar(255), audioLink)
    .query(`
        UPDATE MedicationOccurrences
        SET audio_link = @audio_link
        WHERE id = @id
          AND user_id = @user_id; -- Ensure only the authenticated user's data is updated
    `);

  return result.rowsAffected;
}

module.exports = {
  postRingtoneById,
  postRingtoneOccurrenceById
};