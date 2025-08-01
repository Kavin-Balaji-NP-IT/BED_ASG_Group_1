const sql = require('mssql');
const dbConfig = require('../dbConfig');



function toSqlTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0); // hours, minutes, seconds, milliseconds
  return d;
}


async function getMedicationsByDateAndTime(date) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input('date', sql.Date, date)
    .query(`
      SELECT * FROM Medications
      WHERE schedule_date = @date
        AND is_deleted = 0
      ORDER BY schedule_hour
    `);

  return result.recordset;
}


async function getAllMedicationsByDate(date) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('date', sql.Date, date)
    .query(`
     SELECT * FROM Medications
     WHERE schedule_date = @date 
     AND is_deleted = 0
     ORDER BY id;
    `);
  return result.recordset;
}


async function getMedicationById(id) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT * FROM Medications
      WHERE id = @id
    `);
  return result.recordset[0] || null;
}

async function deleteMedicationById(id) {
  const pool = await sql.connect(dbConfig);

  try {
    const medication_id = parseInt(id);
    if (isNaN(medication_id)) {
      throw new Error("Invalid medication ID");
    }
    
    // Delete medication occurrences
    await pool.request() 
      .input('medication_id', sql.Int, medication_id)
      .query(`DELETE FROM MedicationOccurrences WHERE medication_id = @medication_id`)

    // Delete notes by medication_id
    await pool.request()
      .input('medication_id', sql.Int, medication_id)
      .query(`DELETE FROM MedicationNotes WHERE medication_id = @medication_id`);

    const result = await pool.request()
      .input('id', sql.Int, medication_id)  // Use medication_id here
      .query(`DELETE FROM Medications WHERE id = @id`);

    if (result.rowsAffected[0] > 0) {
      return { success: true };
    } else {
      return { success: false, message: "Medication not found" };
    }
  } catch (err) {
    console.error("Error executing query:", err);
    throw new Error("Error deleting medication");
  }
}

async function addMedication(medicationData) {
  const pool = await sql.connect(dbConfig);

  try {
    // Insert medication and return the inserted ID
    const result = await pool.request()
      .input('name', sql.VarChar(255), medicationData.name)
      .input('schedule_date', sql.Date, medicationData.schedule_date)
      .input('frequency_type', sql.VarChar(50), medicationData.frequency_type)
      .input('repeat_times', sql.Int, medicationData.repeat_times)
      .input('repeat_duration', sql.Int, medicationData.repeat_duration)
      .input('start_hour', sql.Time, toSqlTime(medicationData.start_hour))
      .input('end_hour', sql.Time, toSqlTime(medicationData.end_hour))
      .input('schedule_hour', sql.Int, medicationData.schedule_hour)
      .input('is_deleted', sql.Bit, 0)
      .query(`
        INSERT INTO Medications (
          name, schedule_date, frequency_type, repeat_times,
          repeat_duration, start_hour, end_hour, is_deleted, schedule_hour
        )
        OUTPUT INSERTED.id 
        VALUES (
          @name, @schedule_date, @frequency_type, @repeat_times,
          @repeat_duration, @start_hour, @end_hour, @is_deleted, @schedule_hour
        )
      `);

    const medicationId = result.recordset[0].id;

    const [startHour, startMinute, startSecond = 0] = medicationData.start_hour.split(":").map(Number);
const timeObj = new Date(1970, 0, 1, startHour, startMinute, startSecond);

// Helper: convert time to proper JS Date (for MSSQL TIME input)
function toSqlTimeFromDate(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ms = d.getMilliseconds();
  return new Date(1970, 0, 1, h, m, s, ms); // Valid for sql.Time
} 

for (let i = 0; i < medicationData.repeat_times; ++i) {
  // Add duration (in hours)
  timeObj.setHours(timeObj.getHours() + medicationData.repeat_duration);

  // Validate time after addition
  if (isNaN(timeObj.getTime())) {
    console.error("⛔ Invalid time object:", timeObj);
    continue;
  }

  const sqlTime = toSqlTimeFromDate(timeObj); // Valid JS Date for sql.Time

  console.log("🔁 Occurrence time (valid):", sqlTime.toTimeString().split(" ")[0]);

  await pool.request()
    .input('name', sql.VarChar(255), medicationData.name)
    .input('medication_id', sql.Int, medicationId)
    .input('schedule_date', sql.Date, medicationData.schedule_date)
    .input('occurrence_time', sql.Time, sqlTime)
    .input('schedule_hour', sql.Int, timeObj.getHours())
    .input('audio_link', sql.NVarChar(255), null)
    .query(`
      INSERT INTO MedicationOccurrences (name, medication_id, schedule_date, occurrence_time, schedule_hour, audio_link)
      VALUES (@name, @medication_id, @schedule_date, @occurrence_time, @schedule_hour, @audio_link)
    `);
}



    return { success: true, message: "Medication + occurrences inserted" };

  } catch (err) {
    console.error("Error adding medication:", err);
    return { success: false, message: "Error adding medication" };
  }
}



function toSqlTime(timeStr) {
  const [hour, minute, second = 0] = timeStr.split(":").map(Number);
  return new Date(1970, 0, 1, hour, minute, second);
}

function toSqlTimeFromDate(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ms = d.getMilliseconds();
  return new Date(1970, 0, 1, h, m, s, ms);
}

async function updateMedication(id, medicationData) {
  const pool = await sql.connect(dbConfig);

  try {
    // 1. Update Medication record
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.VarChar(255), medicationData.name)
      .input('schedule_date', sql.Date, medicationData.schedule_date)
      .input('frequency_type', sql.VarChar(50), medicationData.frequency_type || "Daily")
      .input('repeat_times', sql.Int, medicationData.repeat_times)
      .input('repeat_duration', sql.Int, medicationData.repeat_duration)
      .input('start_hour', sql.Time, toSqlTime(medicationData.start_hour))
      .input('end_hour', sql.Time, toSqlTime(medicationData.end_hour))
      .input('schedule_hour', sql.Int, parseInt(medicationData.start_hour.split(":")[0], 10))
      .query(`
        UPDATE Medications SET
          name = @name,
          schedule_date = @schedule_date,
          frequency_type = @frequency_type,
          repeat_times = @repeat_times,
          repeat_duration = @repeat_duration,
          start_hour = @start_hour,
          end_hour = @end_hour,
          schedule_hour = @schedule_hour
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return { success: false, message: "No medication updated" };
    }

    // 2. Delete old occurrences
    await pool.request()
      .input('medication_id', sql.Int, id)
      .query("DELETE FROM MedicationOccurrences WHERE medication_id = @medication_id");

    // 3. Recreate occurrences based on new values
    const [startHour, startMinute, startSecond = 0] = medicationData.start_hour.split(":").map(Number);
    const timeObj = new Date(1970, 0, 1, startHour, startMinute, startSecond);

    for (let i = 0; i < medicationData.repeat_times; ++i) {
      timeObj.setHours(timeObj.getHours() + medicationData.repeat_duration);

      const sqlTime = toSqlTimeFromDate(timeObj);

      await pool.request()
        .input('name', sql.VarChar(255), medicationData.name)
        .input('medication_id', sql.Int, id)
        .input('schedule_date', sql.Date, medicationData.schedule_date)
        .input('occurrence_time', sql.Time, sqlTime)
        .input('schedule_hour', sql.Int, timeObj.getHours())
        .input('audio_link', sql.NVarChar(255), null)
        .query(`
          INSERT INTO MedicationOccurrences (name, medication_id, schedule_date, occurrence_time, schedule_hour, audio_link)
          VALUES (@name, @medication_id, @schedule_date, @occurrence_time, @schedule_hour, @audio_link)
        `);
    }

    return { success: true, message: "Medication and occurrences updated." };

  } catch (err) {
    console.error("❌ Error updating medication:", err);
    return { success: false, message: "Error during update" };
  }
}



async function getAllMedicationOccurrences() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT 
      mo.medication_id,
      mo.schedule_date,
      mo.occurrence_time,
      mo.audio_link,
      mo.name,
      mo.schedule_hour,
      m.name AS medication_name
    FROM MedicationOccurrences mo
    JOIN Medications m ON mo.medication_id = m.id
    ORDER BY mo.schedule_date, mo.occurrence_time
  `);
  return result.recordset;
}


async function getOccurrencesByMedIdAndDate(medication_id, selectedDate) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input("medication_id", sql.Int, medication_id)
    .input("schedule_date", sql.Date, selectedDate)
    .query(`
      SELECT 
        mo.id,
        mo.medication_id,
        mo.schedule_date,
        mo.schedule_hour,
        mo.occurrence_time,
        mo.audio_link,
        mo.name,
        m.name AS medication_name
      FROM MedicationOccurrences mo
      JOIN Medications m ON mo.medication_id = m.id
      WHERE mo.medication_id = @medication_id AND mo.schedule_date = @schedule_date
      ORDER BY mo.schedule_hour
    `);

  return result.recordset;
}


async function getOccurrencesByMedicationId(medicationId) {
  const pool = await sql.connect(dbConfig);

  const result = await pool.request()
    .input("medication_id", sql.Int, medicationId)
    .query(`
      SELECT 
        mo.id,
        mo.medication_id,
        mo.schedule_date,
        mo.schedule_hour,
        mo.occurrence_time,
        mo.audio_link,
        mo.name,
        m.name AS medication_name
      FROM MedicationOccurrences mo
      JOIN Medications m ON mo.medication_id = m.id
      WHERE mo.medication_id = @medication_id
      ORDER BY mo.schedule_date, mo.schedule_hour
    `);

  return result.recordset;
}

async function deleteOccurrencesByMedicationId(medicationId) {
  const pool = await sql.connect(dbConfig);

  try {
    await pool.request()
      .input("medication_id", sql.Int, medicationId)
      .query(`
        DELETE FROM MedicationOccurrences
        WHERE medication_id = @medication_id
      `);

    return { success: true };
  } catch (err) {
    console.error("Failed to delete occurrences:", err);
    return { success: false, message: "Error deleting occurrences" };
  }
}


module.exports = {
  getMedicationsByDateAndTime,
  getMedicationById,
  getAllMedicationsByDate, 
  deleteMedicationById,
  addMedication, 
  updateMedication,
  getAllMedicationOccurrences,
  getOccurrencesByMedIdAndDate,
  getOccurrencesByMedicationId,
  deleteOccurrencesByMedicationId
};