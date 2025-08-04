const dbConfig = require("../dbConfig");
const sql = require("mssql");

// Add a note for a specific medication and user
async function addNote(medication_id, userId, note_text, is_deleted = 0, note_type = 'manual') {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const request = connection.request();
    request.input("medication_id", sql.Int, medication_id);
    request.input("user_id", sql.Int, userId); // Include userId
    request.input("note_text", sql.NVarChar(255), note_text);
    request.input("note_type", sql.VarChar(50), note_type);
    request.input("is_deleted", sql.Bit, is_deleted);

    const query = `
      INSERT INTO MedicationNotes (medication_id, user_id, note_text, is_deleted, note_type)
      VALUES (@medication_id, @user_id, @note_text, @is_deleted, @note_type)
    `;

    await request.query(query);

    return { success: true, message: "Notification added successfully" };
  } catch (err) {
    console.error(`Error adding notifications: ${err}`);
    return { success: false, message: err.message };
  }
}

// Retrieve notes for a specific medication and user
async function getNote(medication_id, userId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("medication_id", sql.Int, medication_id)
    .input("user_id", sql.Int, userId) // Include userId
    .query(`
      SELECT medication_id, note_text 
      FROM MedicationNotes 
      WHERE medication_id = @medication_id
        AND user_id = @user_id
        AND is_deleted = 0 
        AND note_type = 'manual'
    `);
  return result.recordset;
}

// Get auto-generated note fields for a specific medication and user
async function getAutoNoteFields(id, userId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("id", sql.Int, id)
    .input("user_id", sql.Int, userId) // Include userId
    .query(`
      SELECT *
      FROM Medications
      WHERE repeat_times IS NOT NULL
        AND start_hour IS NOT NULL
        AND end_hour IS NOT NULL
        AND repeat_duration IS NOT NULL
        AND id = @id
        AND user_id = @user_id
    `);
  return result.recordset;
}

// Delete a specific note for a medication and user
async function deleteSpecificNote(medicationId, userId, noteText) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("medication_id", sql.Int, medicationId)
      .input("user_id", sql.Int, userId) // Include userId
      .input("note_text", sql.NVarChar, noteText + '%')
      .query(`
        DELETE FROM MedicationNotes
        WHERE medication_id = @medication_id
          AND user_id = @user_id
          AND note_text LIKE @note_text
      `);

    return { success: true };
  } catch (err) {
    console.error("Error deleting note:", err);
    return { success: false, message: err.message };
  }
}

// Check if a note exists for a specific medication and user
async function noteExists(medicationId, userId, noteText) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('medication_id', sql.Int, medicationId)
      .input('user_id', sql.Int, userId) // Include userId
      .input('note_text', sql.NVarChar(255), noteText)
      .query(`
        SELECT 1 
        FROM MedicationNotes 
        WHERE medication_id = @medication_id 
          AND user_id = @user_id
          AND note_text = @note_text 
          AND is_deleted = 0
      `);

    return result.recordset.length > 0;
  } catch (err) {
    console.error("Error checking note existence:", err);
    return false;
  }
}

module.exports = {
  addNote,
  getNote,
  getAutoNoteFields,
  deleteSpecificNote,
  noteExists
};