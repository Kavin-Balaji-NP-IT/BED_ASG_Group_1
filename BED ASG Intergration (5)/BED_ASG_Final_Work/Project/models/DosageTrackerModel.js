const sql = require("mssql");
const dbConfig = require("../dbconfig");

// Create tracking record
async function createTracking(trackingData) {
  const { MedicationID, TakenDate, TakenTime, Taken } = trackingData;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("MedicationID", sql.Int, MedicationID)
      .input("TakenDate", sql.Date, TakenDate)
      .input("TakenTime", sql.Time, TakenTime)
      .input("Taken", sql.Bit, Taken)
      .query(`
        INSERT INTO MedicationTracker (MedicationID, TakenDate, TakenTime, Taken)
        VALUES (@MedicationID, @TakenDate, @TakenTime, @Taken);
        SELECT SCOPE_IDENTITY() AS TrackerID;
      `);
    const newId = result.recordset[0].TrackerID;
    return { TrackerID: newId, ...trackingData };
  } catch (error) {
    console.error("Database error in createTracking:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get tracking records for a medication
async function getTrackingByMedicationId(medicationId, limit = 30) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT TOP(@Limit) TrackerID, MedicationID, TakenDate, TakenTime, Taken
      FROM MedicationTracker 
      WHERE MedicationID = @MedicationID 
      ORDER BY TakenDate DESC, TakenTime DESC
    `;
    const result = await connection
      .request()
      .input("MedicationID", sql.Int, medicationId)
      .input("Limit", sql.Int, limit)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getTrackingByMedicationId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get today's tracking for a user
async function getTodayTrackingByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT m.MedicationID, m.Name, m.Dosage, m.Frequency,
             mt.TrackerID, mt.TakenDate, mt.TakenTime, mt.Taken
      FROM Medications m
      LEFT JOIN MedicationTracker mt ON m.MedicationID = mt.MedicationID 
        AND mt.TakenDate = CAST(GETDATE() AS DATE)
      WHERE m.UserID = @UserID
        AND (m.EndDate IS NULL OR m.EndDate >= GETDATE())
      ORDER BY m.Name ASC
    `;
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getTodayTrackingByUserId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Update tracking record
async function updateTracking(TrackerID, taken) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("TrackerID", sql.Int, TrackerID)
      .input("Taken", sql.Bit, taken)
      .query(`UPDATE MedicationTracker SET Taken = @Taken WHERE TrackerID = @TrackerID`);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in updateTracking:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  createTracking,
  getTrackingByMedicationId,
  getTodayTrackingByUserId,
  updateTracking,
};
