
const sql = require('mssql');
const dbConfig = require('../dbConfig');


async function postRingtoneById(id, audioLink) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input("audio_link", sql.VarChar(255), audioLink)
    .query(`
        UPDATE Medications
        SET audio_link = @audio_link
        WHERE id = @id;
    `);

  return result.rowsAffected;
}


async function postRingtoneOccurrenceById(id, audioLink){
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input("audio_link", sql.VarChar(255), audioLink)
    .query(`
        UPDATE MedicationOccurrences
        SET audio_link = @audio_link
        WHERE id = @id;
    `);

  return result.rowsAffected;
}


module.exports = {
    postRingtoneById,
    postRingtoneOccurrenceById
};