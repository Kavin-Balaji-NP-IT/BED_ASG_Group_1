const sql = require('mssql');
const dbConfig = require('../dbconfig'); // Make sure this path is correct

// Get fitness dashboard data for a user
const getFitnessData = async (req, res) => {
    let connection;
    try {
        const userId = req.user.userId;
        console.log(`🏃‍♂️ Fetching fitness dashboard data for user: ${userId}`);

        // Create a new connection for this request
        connection = await sql.connect(dbConfig);

        // Get recent vitals records (last 30 days)
        const vitalsQuery = `
            SELECT TOP 10
                VitalID,
                ReadingDateTime,
                HeartRate,
                BloodPressureSYS,
                BloodPressureDIA,
                BloodSugar,
                SleepHours
            FROM Vitals 
            WHERE UserID = @userId 
                AND ReadingDateTime >= DATEADD(day, -30, GETDATE())
            ORDER BY ReadingDateTime DESC
        `;

        // Get vitals summary/statistics
        const summaryQuery = `
            SELECT 
                COUNT(*) as TotalRecords,
                AVG(CAST(HeartRate as FLOAT)) as AvgHeartRate,
                AVG(CAST(BloodPressureSYS as FLOAT)) as AvgSystolic,
                AVG(CAST(BloodPressureDIA as FLOAT)) as AvgDiastolic,
                AVG(BloodSugar) as AvgBloodSugar,
                AVG(SleepHours) as AvgSleepHours,
                MAX(ReadingDateTime) as LastReading
            FROM Vitals 
            WHERE UserID = @userId 
                AND ReadingDateTime >= DATEADD(day, -30, GETDATE())
        `;

        // Get blood sugar trend data (last 7 days)
        const bloodSugarTrendQuery = `
            SELECT 
                CAST(ReadingDateTime as DATE) as Date,
                AVG(BloodSugar) as AvgBloodSugar
            FROM Vitals 
            WHERE UserID = @userId 
                AND ReadingDateTime >= DATEADD(day, -7, GETDATE())
                AND BloodSugar IS NOT NULL
            GROUP BY CAST(ReadingDateTime as DATE)
            ORDER BY Date ASC
        `;

        // Execute queries using the connection
        const vitalsRequest = connection.request();
        vitalsRequest.input('userId', sql.Int, userId);
        
        const summaryRequest = connection.request();
        summaryRequest.input('userId', sql.Int, userId);

        const trendRequest = connection.request();
        trendRequest.input('userId', sql.Int, userId);

        const [vitalsResult, summaryResult, trendResult] = await Promise.all([
            vitalsRequest.query(vitalsQuery),
            summaryRequest.query(summaryQuery),
            trendRequest.query(bloodSugarTrendQuery)
        ]);

        const recentVitals = vitalsResult.recordset;
        const summary = summaryResult.recordset[0];
        const bloodSugarTrend = trendResult.recordset;

        console.log(`✅ Found ${recentVitals.length} recent vitals records`);
        
        // Get latest reading for current display
        const latestReading = recentVitals.length > 0 ? recentVitals[0] : {};

        // Format heart rate data
        const heartRateData = {
            latestValue: latestReading.HeartRate || 0,
            latestDateTime: latestReading.ReadingDateTime,
            min: recentVitals.filter(v => v.HeartRate).length > 0 ? 
                 Math.min(...recentVitals.filter(v => v.HeartRate).map(v => v.HeartRate)) : null,
            max: recentVitals.filter(v => v.HeartRate).length > 0 ? 
                 Math.max(...recentVitals.filter(v => v.HeartRate).map(v => v.HeartRate)) : null,
            avg: summary.AvgHeartRate,
            history: recentVitals.filter(v => v.HeartRate).slice(0, 10).map(v => ({
                dateTime: v.ReadingDateTime,
                value: v.HeartRate
            })).reverse() // Reverse to show chronological order
        };

        // Format blood pressure data
        const bloodPressureData = {
            sys: latestReading.BloodPressureSYS || null,
            dia: latestReading.BloodPressureDIA || null,
            pulse: latestReading.HeartRate || null,
            lastTakenDateTime: latestReading.ReadingDateTime,
            bloodSugar: latestReading.BloodSugar || null
        };

        // Format the response to match what the frontend expects
        const dashboardData = {
            success: true,
            bloodSugarData: bloodSugarTrend,
            heartRate: heartRateData,
            bloodPressure: bloodPressureData,
            summary: {
                totalRecords: summary.TotalRecords || 0,
                averages: {
                    heartRate: summary.AvgHeartRate ? Math.round(summary.AvgHeartRate) : null,
                    systolic: summary.AvgSystolic ? Math.round(summary.AvgSystolic) : null,
                    diastolic: summary.AvgDiastolic ? Math.round(summary.AvgDiastolic) : null,
                    bloodSugar: summary.AvgBloodSugar ? Math.round(summary.AvgBloodSugar * 10) / 10 : null,
                    sleepHours: summary.AvgSleepHours ? Math.round(summary.AvgSleepHours * 10) / 10 : null
                },
                lastReading: summary.LastReading
            },
            recentVitals: recentVitals,
            userId: userId,
            period: 'Last 30 days'
        };

        res.json(dashboardData);

    } catch (error) {
        console.error('💥 Error fetching fitness dashboard data:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// Create new vitals record
const createVitalsRecord = async (req, res) => {
    let connection;
    try {
        const userId = req.user.userId; // From JWT token
        const {
            ReadingDateTime,
            HeartRate,
            BloodPressureSYS,
            BloodPressureDIA,
            BloodSugar,
            SleepHours
        } = req.body;

        console.log('🩺 Creating vitals record for user:', userId);
        console.log('📊 Vitals data received:', req.body);

        // Create a new connection for this request
        connection = await sql.connect(dbConfig);

        // Validate required fields
        if (!ReadingDateTime) {
            console.log('❌ Validation failed: ReadingDateTime is required');
            return res.status(400).json({ 
                error: 'ReadingDateTime is required' 
            });
        }

        // Validate that at least one vital sign is provided
        if (!HeartRate && !BloodPressureSYS && !BloodPressureDIA && !BloodSugar && !SleepHours) {
            console.log('❌ Validation failed: At least one vital sign required');
            return res.status(400).json({ 
                error: 'At least one vital sign measurement is required' 
            });
        }

        // Parse and validate datetime
        const parsedDateTime = new Date(ReadingDateTime);
        if (isNaN(parsedDateTime.getTime())) {
            console.log('❌ Validation failed: Invalid datetime format');
            return res.status(400).json({ 
                error: 'Invalid datetime format' 
            });
        }

        // Create SQL query
        const query = `
            INSERT INTO Vitals (
                UserID, 
                ReadingDateTime, 
                HeartRate, 
                BloodPressureSYS, 
                BloodPressureDIA, 
                BloodSugar, 
                SleepHours
            ) 
            OUTPUT INSERTED.VitalID
            VALUES (@userId, @readingDateTime, @heartRate, @bloodPressureSYS, @bloodPressureDIA, @bloodSugar, @sleepHours)
        `;

        // Create a new request with the connection
        const request = connection.request();
        
        // Add parameters with proper types
        request.input('userId', sql.Int, userId);
        request.input('readingDateTime', sql.DateTime, parsedDateTime);
        request.input('heartRate', sql.Int, HeartRate ? parseInt(HeartRate) : null);
        request.input('bloodPressureSYS', sql.Int, BloodPressureSYS ? parseInt(BloodPressureSYS) : null);
        request.input('bloodPressureDIA', sql.Int, BloodPressureDIA ? parseInt(BloodPressureDIA) : null);
        request.input('bloodSugar', sql.Float, BloodSugar ? parseFloat(BloodSugar) : null);
        request.input('sleepHours', sql.Float, SleepHours ? parseFloat(SleepHours) : null);

        console.log('🔄 Executing SQL query...');
        
        // Execute query
        const result = await request.query(query);
        
        const insertedId = result.recordset[0]?.VitalID;
        console.log('✅ Vitals record created successfully with ID:', insertedId);
        
        res.status(201).json({
            success: true,
            message: 'Vital signs recorded successfully',
            vitalId: insertedId,
            data: {
                VitalID: insertedId,
                UserID: userId,
                ReadingDateTime: parsedDateTime.toISOString(),
                HeartRate: HeartRate ? parseInt(HeartRate) : null,
                BloodPressureSYS: BloodPressureSYS ? parseInt(BloodPressureSYS) : null,
                BloodPressureDIA: BloodPressureDIA ? parseInt(BloodPressureDIA) : null,
                BloodSugar: BloodSugar ? parseFloat(BloodSugar) : null,
                SleepHours: SleepHours ? parseFloat(SleepHours) : null
            }
        });

    } catch (error) {
        console.error('💥 Error creating vital reading:', error);
        
        // Handle specific SQL errors
        if (error.number === 2) {
            console.log('❌ Database connection error');
            return res.status(500).json({ 
                error: 'Database connection error',
                message: 'Could not connect to database'
            });
        }
        
        if (error.number === 547) {
            console.log('❌ Foreign key constraint error - Invalid user ID');
            return res.status(400).json({ 
                error: 'Invalid user ID',
                message: 'User does not exist'
            });
        }

        if (error.number === 2627) {
            console.log('❌ Duplicate key error');
            return res.status(400).json({ 
                error: 'Duplicate record',
                message: 'A record with this information already exists'
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// Get vitals records for a user
const getVitalsRecords = async (req, res) => {
    let connection;
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0, orderBy = 'ReadingDateTime', order = 'DESC' } = req.query;

        console.log(`🩺 Fetching vitals records for user: ${userId}`);

        // Create a new connection for this request
        connection = await sql.connect(dbConfig);

        const query = `
            SELECT 
                VitalID,
                ReadingDateTime,
                HeartRate,
                BloodPressureSYS,
                BloodPressureDIA,
                BloodSugar,
                SleepHours
            FROM Vitals 
            WHERE UserID = @userId
            ORDER BY ${orderBy} ${order}
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const request = connection.request();
        request.input('userId', sql.Int, userId);
        request.input('limit', sql.Int, parseInt(limit));
        request.input('offset', sql.Int, parseInt(offset));

        const result = await request.query(query);
        
        console.log(`✅ Found ${result.recordset.length} vitals records`);
        
        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: result.recordset.length === parseInt(limit)
            }
        });

    } catch (error) {
        console.error('💥 Error fetching vitals records:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// Get single vitals record by ID
const getVitalsRecordById = async (req, res) => {
    let connection;
    try {
        const userId = req.user.userId;
        const vitalId = req.params.id;

        console.log(`🩺 Fetching vitals record ${vitalId} for user: ${userId}`);

        // Create a new connection for this request
        connection = await sql.connect(dbConfig);

        const query = `
            SELECT 
                VitalID,
                ReadingDateTime,
                HeartRate,
                BloodPressureSYS,
                BloodPressureDIA,
                BloodSugar,
                SleepHours
            FROM Vitals 
            WHERE VitalID = @vitalId AND UserID = @userId
        `;

        const request = connection.request();
        request.input('vitalId', sql.Int, parseInt(vitalId));
        request.input('userId', sql.Int, userId);

        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            console.log(`❌ Vitals record ${vitalId} not found for user ${userId}`);
            return res.status(404).json({
                error: 'Vitals record not found'
            });
        }

        console.log(`✅ Found vitals record ${vitalId}`);
        
        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('💥 Error fetching vitals record:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// Update vitals record
const updateVitalsRecord = async (req, res) => {
    let connection;
    try {
        const userId = req.user.userId;
        const vitalId = req.params.id;
        const {
            ReadingDateTime,
            HeartRate,
            BloodPressureSYS,
            BloodPressureDIA,
            BloodSugar,
            SleepHours
        } = req.body;

        console.log(`🩺 Updating vitals record ${vitalId} for user: ${userId}`);

        // Create a new connection for this request
        connection = await sql.connect(dbConfig);

        // Check if record exists and belongs to user
        const checkQuery = `SELECT VitalID FROM Vitals WHERE VitalID = @vitalId AND UserID = @userId`;
        const checkRequest = connection.request();
        checkRequest.input('vitalId', sql.Int, parseInt(vitalId));
        checkRequest.input('userId', sql.Int, userId);
        const checkResult = await checkRequest.query(checkQuery);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                error: 'Vitals record not found'
            });
        }

        // Update query
        const updateQuery = `
            UPDATE Vitals SET
                ReadingDateTime = COALESCE(@readingDateTime, ReadingDateTime),
                HeartRate = @heartRate,
                BloodPressureSYS = @bloodPressureSYS,
                BloodPressureDIA = @bloodPressureDIA,
                BloodSugar = @bloodSugar,
                SleepHours = @sleepHours
            WHERE VitalID = @vitalId AND UserID = @userId
        `;

        const updateRequest = connection.request();
        updateRequest.input('vitalId', sql.Int, parseInt(vitalId));
        updateRequest.input('userId', sql.Int, userId);
        updateRequest.input('readingDateTime', sql.DateTime, ReadingDateTime ? new Date(ReadingDateTime) : null);
        updateRequest.input('heartRate', sql.Int, HeartRate ? parseInt(HeartRate) : null);
        updateRequest.input('bloodPressureSYS', sql.Int, BloodPressureSYS ? parseInt(BloodPressureSYS) : null);
        updateRequest.input('bloodPressureDIA', sql.Int, BloodPressureDIA ? parseInt(BloodPressureDIA) : null);
        updateRequest.input('bloodSugar', sql.Float, BloodSugar ? parseFloat(BloodSugar) : null);
        updateRequest.input('sleepHours', sql.Float, SleepHours ? parseFloat(SleepHours) : null);

        await updateRequest.query(updateQuery);

        console.log(`✅ Vitals record ${vitalId} updated successfully`);

        res.json({
            success: true,
            message: 'Vitals record updated successfully'
        });

    } catch (error) {
        console.error('💥 Error updating vitals record:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// Delete vitals record
const deleteVitalsRecord = async (req, res) => {
    let connection;
    try {
        const userId = req.user.userId;
        const vitalId = req.params.id;

        console.log(`🩺 Deleting vitals record ${vitalId} for user: ${userId}`);

        // Create a new connection for this request
        connection = await sql.connect(dbConfig);

        const query = `
            DELETE FROM Vitals 
            WHERE VitalID = @vitalId AND UserID = @userId
        `;

        const request = connection.request();
        request.input('vitalId', sql.Int, parseInt(vitalId));
        request.input('userId', sql.Int, userId);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            console.log(`❌ Vitals record ${vitalId} not found for user ${userId}`);
            return res.status(404).json({
                error: 'Vitals record not found'
            });
        }

        console.log(`✅ Vitals record ${vitalId} deleted successfully`);

        res.json({
            success: true,
            message: 'Vitals record deleted successfully'
        });

    } catch (error) {
        console.error('💥 Error deleting vitals record:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    } finally {
        // Always close the connection
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
};

// Export all functions
module.exports = {
    getFitnessData,
    createVitalsRecord,
    getVitalsRecords,
    getVitalsRecordById,
    updateVitalsRecord,
    deleteVitalsRecord
};