const sql = require("mssql");
const dbConfig = require("../dbconfig");

// Get all medications for all users (rarely needed, usually for admin)
async function getAllMedications() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT MedicationID, UserID, Name, Dosage, Frequency, StartDate, EndDate, Notes
      FROM Medications
    `;
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getAllMedications:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get all medications by user ID
async function getMedicationsByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT MedicationID, UserID, Name, Dosage, Frequency, StartDate, EndDate, Notes
      FROM Medications
      WHERE UserID = @UserID
      ORDER BY StartDate DESC
    `;
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getMedicationsByUserId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get a single medication by MedicationID
async function getMedicationById(MedicationID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("MedicationID", sql.Int, MedicationID)
      .query(`SELECT * FROM Medications WHERE MedicationID = @MedicationID`);
    return result.recordset[0]; // single object or undefined
  } catch (error) {
    console.error("Database error in getMedicationById:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Create a new medication
async function createMedication(medicationData) {
  const { UserID, Name, Dosage, Frequency, StartDate, EndDate, Notes } = medicationData;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("UserID", sql.Int, UserID)
      .input("Name", sql.NVarChar(100), Name)
      .input("Dosage", sql.NVarChar(50), Dosage)
      .input("Frequency", sql.NVarChar(50), Frequency)
      .input("StartDate", sql.Date, StartDate)
      .input("EndDate", sql.Date, EndDate)
      .input("Notes", sql.NVarChar(sql.MAX), Notes)
      .query(`
        INSERT INTO Medications (UserID, Name, Dosage, Frequency, StartDate, EndDate, Notes)
        VALUES (@UserID, @Name, @Dosage, @Frequency, @StartDate, @EndDate, @Notes);
        SELECT SCOPE_IDENTITY() AS MedicationID;
      `);
    const newId = result.recordset[0].MedicationID;
    return { MedicationID: newId, ...medicationData };
  } catch (error) {
    console.error("Database error in createMedication:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete medication by MedicationID
async function deleteMedication(MedicationID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    // First delete tracking records
    await connection
      .request()
      .input("MedicationID", sql.Int, MedicationID)
      .query(`DELETE FROM MedicationTracker WHERE MedicationID = @MedicationID`);
    
    // Then delete medication
    const result = await connection
      .request()
      .input("MedicationID", sql.Int, MedicationID)
      .query(`DELETE FROM Medications WHERE MedicationID = @MedicationID`);
    return result.rowsAffected[0] > 0; // true if deleted
  } catch (error) {
    console.error("Database error in deleteMedication:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Update medication by MedicationID
async function updateMedication(MedicationID, medicationData) {
  const { Name, Dosage, Frequency, StartDate, EndDate, Notes } = medicationData; // no UserID here
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("MedicationID", sql.Int, MedicationID)
      .input("Name", sql.NVarChar(100), Name)
      .input("Dosage", sql.NVarChar(50), Dosage)
      .input("Frequency", sql.NVarChar(50), Frequency)
      .input("StartDate", sql.Date, StartDate)
      .input("EndDate", sql.Date, EndDate)
      .input("Notes", sql.NVarChar(sql.MAX), Notes)
      .query(`
        UPDATE Medications
        SET Name = @Name,
            Dosage = @Dosage,
            Frequency = @Frequency,
            StartDate = @StartDate,
            EndDate = @EndDate,
            Notes = @Notes
        WHERE MedicationID = @MedicationID;
      `);
    if (result.rowsAffected[0] === 0) return null;
    return { MedicationID, ...medicationData };
  } catch (error) {
    console.error("Database error in updateMedication:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get active medications (not expired)
async function getActiveMedicationsByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT MedicationID, UserID, Name, Dosage, Frequency, StartDate, EndDate, Notes
      FROM Medications
      WHERE UserID = @UserID 
        AND (EndDate IS NULL OR EndDate >= GETDATE())
      ORDER BY StartDate DESC
    `;
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getActiveMedicationsByUserId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllMedications,
  getMedicationsByUserId,
  getMedicationById,
  createMedication,
  deleteMedication,
  updateMedication,
  getActiveMedicationsByUserId,
};
