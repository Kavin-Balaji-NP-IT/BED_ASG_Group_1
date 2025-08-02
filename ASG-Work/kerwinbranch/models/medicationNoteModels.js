
const dbConfig = require("../dbConfig");
const sql = require("mssql");

// createNote function from model
async function addNote (medication_id, note_text, is_deleted = 0, note_type = 'manual') { // createNote in controller
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        
        const request = connection.request();
        request.input("medication_id", sql.Int, medication_id);
        request.input("note_text", sql.NVarChar(255), note_text);
        request.input("note_type", sql.VarChar(50), note_type);
        request.input("is_deleted", sql.Bit, is_deleted);

        const query = `
            INSERT INTO MedicationNotes (medication_id, note_text, is_deleted, note_type)
            VALUES (@medication_id, @note_text, @is_deleted, @note_type)
        `;

        await request.query(query);

        return {success : true, message: "Notification added successfully"}

    } catch (err) {
        console.error( `Error adding notifications: ${err}`);
        return {success: false, message: err.message};
    }
}


async function getNote(medication_id) { //  retrieveNote controller
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
        .input("medication_id", sql.Int, medication_id)
        .query(`
            SELECT medication_id, note_text FROM
            MedicationNotes 
            WHERE medication_id = @medication_id
            AND is_deleted = 0 AND note_type = 'manual'
        `)
    return result.recordset;
}

// Get the auto notes like the startTime, endTime etc
async function getAutoNoteFields(id) { // getAutoFieldsController
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT *
                FROM Medications
                WHERE repeat_times IS NOT NULL
                AND start_hour IS NOT NULL
                AND end_hour IS NOT NULL
                AND repeat_duration IS NOT NULL
                AND id = @id;
            `);
        return result.recordset;
}

// delete a specific note with the note text and from a medication id
async function deleteSpecificNote(medicationId, noteText) {
    try {
        const pool = await sql.connect(dbConfig);
      await pool.request()
        .input("medication_id", sql.Int, medicationId)
        .input("note_text", sql.NVarChar, noteText + '%')
        .query(`
            DELETE FROM MedicationNotes
            WHERE medication_id = @medication_id
            AND note_text LIKE @note_text
        `);


        return { success: true };
    } catch (err) {
        console.error("Error deleting note:", err);
        return { success: false, message: err.message };
    }
}


module.exports = {
    addNote, 
    getNote,
    getAutoNoteFields,
    deleteSpecificNote,
    
};