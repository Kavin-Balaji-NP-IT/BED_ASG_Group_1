const sql = require("mssql");
const dbConfig = require("../dbconfig");

// Get all fitness data for a user
async function getFitnessDataByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    // Get blood sugar data for the past 7 days
    const bloodSugarQuery = `
      SELECT 
        CAST(ReadingDateTime AS DATE) as Date,
        AVG(CAST(BloodSugar AS FLOAT)) as AvgBloodSugar
      FROM Vitals 
      WHERE UserID = @UserID 
        AND BloodSugar IS NOT NULL 
        AND ReadingDateTime >= DATEADD(day, -7, GETDATE())
      GROUP BY CAST(ReadingDateTime AS DATE)
      ORDER BY Date DESC
    `;
    
    const bloodSugarResult = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(bloodSugarQuery);

    // Get latest vitals
    const latestVitalsQuery = `
      SELECT TOP 1 
        BloodSugar,
        BloodPressureSYS,
        BloodPressureDIA,
        HeartRate,
        ReadingDateTime as lastTakenDateTime
      FROM Vitals 
      WHERE UserID = @UserID 
        AND (BloodSugar IS NOT NULL OR BloodPressureSYS IS NOT NULL OR BloodPressureDIA IS NOT NULL OR HeartRate IS NOT NULL)
      ORDER BY ReadingDateTime DESC
    `;
    
    const latestVitalsResult = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(latestVitalsQuery);

    // Get heart rate data for the past 24 hours
    const heartRateQuery = `
      SELECT 
        HeartRate as value,
        ReadingDateTime as dateTime
      FROM Vitals 
      WHERE UserID = @UserID 
        AND HeartRate IS NOT NULL 
        AND ReadingDateTime >= DATEADD(hour, -24, GETDATE())
      ORDER BY ReadingDateTime DESC
    `;
    
    const heartRateResult = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(heartRateQuery);

    // Get heart rate statistics
    const heartRateStatsQuery = `
      SELECT 
        MIN(HeartRate) as minHeartRate,
        MAX(HeartRate) as maxHeartRate,
        AVG(CAST(HeartRate AS FLOAT)) as avgHeartRate,
        (SELECT TOP 1 HeartRate FROM Vitals WHERE UserID = @UserID AND HeartRate IS NOT NULL ORDER BY ReadingDateTime DESC) as latestHeartRate,
        (SELECT TOP 1 ReadingDateTime FROM Vitals WHERE UserID = @UserID AND HeartRate IS NOT NULL ORDER BY ReadingDateTime DESC) as latestHeartRateDateTime
      FROM Vitals 
      WHERE UserID = @UserID 
        AND HeartRate IS NOT NULL 
        AND ReadingDateTime >= DATEADD(hour, -24, GETDATE())
    `;
    
    const heartRateStatsResult = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(heartRateStatsQuery);

    const latestVitals = latestVitalsResult.recordset[0] || {};
    const heartRateStats = heartRateStatsResult.recordset[0] || {};

    return {
      bloodSugarData: bloodSugarResult.recordset,
      bloodPressure: {
        sys: latestVitals.BloodPressureSYS,
        dia: latestVitals.BloodPressureDIA,
        pulse: latestVitals.HeartRate,
        bloodSugar: latestVitals.BloodSugar,
        lastTakenDateTime: latestVitals.lastTakenDateTime
      },
      heartRate: {
        latestValue: heartRateStats.latestHeartRate,
        latestDateTime: heartRateStats.latestHeartRateDateTime,
        min: heartRateStats.minHeartRate,
        max: heartRateStats.maxHeartRate,
        avg: heartRateStats.avgHeartRate,
        history: heartRateResult.recordset
      }
    };
  } catch (error) {
    console.error("Database error in getFitnessDataByUserId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Create new vitals record
async function createVitalsRecord(vitalsData) {
  const { UserID, BloodSugar, BloodPressureSYS, BloodPressureDIA, HeartRate, SleepHours } = vitalsData;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("UserID", sql.Int, UserID)
      .input("ReadingDateTime", sql.DateTime, new Date())
      .input("HeartRate", sql.Int, HeartRate || null)
      .input("BloodPressureSYS", sql.Int, BloodPressureSYS || null)
      .input("BloodPressureDIA", sql.Int, BloodPressureDIA || null)
      .input("BloodSugar", sql.Float, BloodSugar || null)
      .input("SleepHours", sql.Float, SleepHours || null)
      .query(`
        INSERT INTO Vitals (UserID, ReadingDateTime, HeartRate, BloodPressureSYS, BloodPressureDIA, BloodSugar, SleepHours)
        VALUES (@UserID, @ReadingDateTime, @HeartRate, @BloodPressureSYS, @BloodPressureDIA, @BloodSugar, @SleepHours);
        SELECT SCOPE_IDENTITY() AS VitalID;
      `);
    const newId = result.recordset[0].VitalID;
    return { VitalID: newId, ...vitalsData, ReadingDateTime: new Date() };
  } catch (error) {
    console.error("Database error in createVitalsRecord:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get vitals records by user (with pagination)
async function getVitalsRecordsByUserId(userId, limit = 50, offset = 0) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT 
        VitalID, UserID, ReadingDateTime, HeartRate, BloodPressureSYS, 
        BloodPressureDIA, BloodSugar, SleepHours
      FROM Vitals
      WHERE UserID = @UserID
      ORDER BY ReadingDateTime DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `;
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getVitalsRecordsByUserId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get a specific vitals record by ID and user ID (for security)
async function getVitalsRecordById(vitalId, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT 
        VitalID, UserID, ReadingDateTime, HeartRate, BloodPressureSYS, 
        BloodPressureDIA, BloodSugar, SleepHours
      FROM Vitals
      WHERE VitalID = @VitalID AND UserID = @UserID
    `;
    const result = await connection
      .request()
      .input("VitalID", sql.Int, vitalId)
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error in getVitalsRecordById:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete vitals record (with user validation)
async function deleteVitalsRecord(vitalId, userId = null) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    let query = `DELETE FROM Vitals WHERE VitalID = @VitalID`;
    let request = connection.request().input("VitalID", sql.Int, vitalId);
    
    // If userId is provided, add it to the query for additional security
    if (userId) {
      query += ` AND UserID = @UserID`;
      request = request.input("UserID", sql.Int, userId);
    }
    
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error in deleteVitalsRecord:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Update vitals record (with user validation)
async function updateVitalsRecord(vitalId, vitalsData, userId = null) {
  const { BloodSugar, BloodPressureSYS, BloodPressureDIA, HeartRate, SleepHours } = vitalsData;
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    let query = `
      UPDATE Vitals
      SET BloodSugar = @BloodSugar,
          BloodPressureSYS = @BloodPressureSYS,
          BloodPressureDIA = @BloodPressureDIA,
          HeartRate = @HeartRate,
          SleepHours = @SleepHours
      WHERE VitalID = @VitalID
    `;
    
    let request = connection
      .request()
      .input("VitalID", sql.Int, vitalId)
      .input("BloodSugar", sql.Float, BloodSugar || null)
      .input("BloodPressureSYS", sql.Int, BloodPressureSYS || null)
      .input("BloodPressureDIA", sql.Int, BloodPressureDIA || null)
      .input("HeartRate", sql.Int, HeartRate || null)
      .input("SleepHours", sql.Float, SleepHours || null);
    
    // If userId is provided, add it to the query for additional security
    if (userId) {
      query += ` AND UserID = @UserID`;
      request = request.input("UserID", sql.Int, userId);
    }
    
    const result = await request.query(query);
    
    if (result.rowsAffected[0] === 0) return null;
    return { VitalID: vitalId, ...vitalsData };
  } catch (error) {
    console.error("Database error in updateVitalsRecord:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get vitals statistics for a user
async function getVitalsStatistics(userId, days = 30) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT 
        COUNT(*) as totalReadings,
        AVG(CAST(HeartRate AS FLOAT)) as avgHeartRate,
        MIN(HeartRate) as minHeartRate,
        MAX(HeartRate) as maxHeartRate,
        AVG(CAST(BloodPressureSYS AS FLOAT)) as avgSystolic,
        AVG(CAST(BloodPressureDIA AS FLOAT)) as avgDiastolic,
        AVG(CAST(BloodSugar AS FLOAT)) as avgBloodSugar,
        AVG(CAST(SleepHours AS FLOAT)) as avgSleepHours
      FROM Vitals
      WHERE UserID = @UserID 
        AND ReadingDateTime >= DATEADD(day, -@Days, GETDATE())
    `;
    
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .input("Days", sql.Int, days)
      .query(query);
      
    return result.recordset[0] || {};
  } catch (error) {
    console.error("Database error in getVitalsStatistics:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get vitals trends for a user (weekly/monthly averages)
async function getVitalsTrends(userId, period = 'weekly') {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    
    let dateGrouping, dateRange;
    if (period === 'weekly') {
      dateGrouping = 'DATEPART(week, ReadingDateTime), DATEPART(year, ReadingDateTime)';
      dateRange = 'DATEADD(week, -12, GETDATE())'; // Last 12 weeks
    } else { // monthly
      dateGrouping = 'DATEPART(month, ReadingDateTime), DATEPART(year, ReadingDateTime)';
      dateRange = 'DATEADD(month, -12, GETDATE())'; // Last 12 months
    }
    
    const query = `
      SELECT 
        ${dateGrouping} as Period,
        AVG(CAST(HeartRate AS FLOAT)) as avgHeartRate,
        AVG(CAST(BloodPressureSYS AS FLOAT)) as avgSystolic,
        AVG(CAST(BloodPressureDIA AS FLOAT)) as avgDiastolic,
        AVG(CAST(BloodSugar AS FLOAT)) as avgBloodSugar,
        AVG(CAST(SleepHours AS FLOAT)) as avgSleepHours,
        COUNT(*) as readingCount
      FROM Vitals
      WHERE UserID = @UserID 
        AND ReadingDateTime >= ${dateRange}
      GROUP BY ${dateGrouping}
      ORDER BY Period DESC
    `;
    
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(query);
      
    return result.recordset;
  } catch (error) {
    console.error("Database error in getVitalsTrends:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getFitnessDataByUserId,
  createVitalsRecord,
  getVitalsRecordsByUserId,
  getVitalsRecordById,
  deleteVitalsRecord,
  updateVitalsRecord,
  getVitalsStatistics,
  getVitalsTrends
};