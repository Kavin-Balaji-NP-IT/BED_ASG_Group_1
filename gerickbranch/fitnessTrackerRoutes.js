const express = require('express');
const router = express.Router();
// --- THIS LINE HAS BEEN CORRECTED ---
const { sql, poolConnect } = require('./fitnessTrackerConfig');

const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
};

const authenticateUser = (req, res, next) => {
    next();
};

router.get('/:userId', authenticateUser, async (req, res) => {
    const { userId } = req.params;
    const bloodSugarDays = parseInt(req.query.bloodSugarDays) || 7;
    const heartRateHours = parseInt(req.query.heartRateHours) || 24;

    let pool;
    try {
        pool = await poolConnect;
        
        const request = new sql.Request(pool);
        request.input('userId', sql.Int, userId);

        const fitnessData = {};

        request.input('bloodSugarDays', sql.Int, bloodSugarDays);
        const bloodSugarQuery = `
            SELECT
                CONVERT(DATE, ReadingDateTime) AS Date,
                AVG(BloodSugar) AS AvgBloodSugar
            FROM Vitals
            WHERE UserID = @userId
              AND ReadingDateTime >= DATEADD(day, -@bloodSugarDays, GETDATE())
            GROUP BY CONVERT(DATE, ReadingDateTime)
            ORDER BY Date ASC;
        `;
        const bloodSugarResult = await request.query(bloodSugarQuery);
        fitnessData.bloodSugarData = bloodSugarResult.recordset;

        const latestVitalsQuery = `
            SELECT TOP 1
                ReadingDateTime, HeartRate, BloodPressureSYS, BloodPressureDIA, BloodSugar
            FROM Vitals
            WHERE UserID = @userId
            ORDER BY ReadingDateTime DESC;
        `;

        const latestVitalsResult = await request.query(latestVitalsQuery);
        const latestVital = latestVitalsResult.recordset[0] || null;

        if (latestVital) {
            fitnessData.heartRate = {
                latestValue: latestVital.HeartRate,
                latestDateTime: latestVital.ReadingDateTime
            };
            fitnessData.bloodPressure = {
                sys: latestVital.BloodPressureSYS,
                dia: latestVital.BloodPressureDIA,
                pulse: latestVital.HeartRate,
                lastTakenDateTime: latestVital.ReadingDateTime,
                bloodSugar: latestVital.BloodSugar 
            };
        } else {
            fitnessData.heartRate = { latestValue: null, latestDateTime: null, min: null, max: null, avg: null, history: [] };
            fitnessData.bloodPressure = { 
                sys: null, 
                dia: null, 
                pulse: null, 
                lastTakenDateTime: null, 
                bloodSugar: null 
            };
        }

        request.input('heartRateHours', sql.Int, heartRateHours);
        const heartRateHistoryQuery = `
            SELECT
                ReadingDateTime, HeartRate AS value -- Renaming for easier charting
            FROM Vitals
            WHERE UserID = @userId
              AND ReadingDateTime >= DATEADD(hour, -@heartRateHours, GETDATE())
            ORDER BY ReadingDateTime ASC;
        `;
        const heartRateHistoryResult = await request.query(heartRateHistoryQuery);
        fitnessData.heartRate.history = heartRateHistoryResult.recordset;

        if (fitnessData.heartRate.history.length > 0) {
            const hrValues = fitnessData.heartRate.history.map(r => r.value);
            fitnessData.heartRate.min = Math.min(...hrValues);
            fitnessData.heartRate.max = Math.max(...hrValues);
            fitnessData.heartRate.avg = hrValues.reduce((sum, val) => sum + val, 0) / hrValues.length;
        }

        res.json(fitnessData);

    } catch (err) {
        console.error(`Error fetching fitness tracker data for UserID ${userId}:`, err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;