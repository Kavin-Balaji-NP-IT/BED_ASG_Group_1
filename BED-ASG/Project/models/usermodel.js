const sql = require('mssql');
const dbConfig = require('../dbconfig');

// Enhanced database configuration
const enhancedConfig = {
  ...dbConfig,
  pool: {
    max: 20,
    min: 5, // Keep minimum connections
    idleTimeoutMillis: 300000, // 5 minutes
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  options: {
    ...dbConfig.options,
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 60000,
    connectionTimeout: 60000
  }
};

// Global connection pool
let pool = null;
let connecting = false;
let lastConnectionAttempt = 0;
const RECONNECT_DELAY = 5000; // 5 seconds

// Create or get database pool with automatic reconnection
async function getPool() {
  // If pool exists and is connected, return it
  if (pool && pool.connected && !pool.connecting) {
    return pool;
  }

  // If already connecting, wait for it
  if (connecting) {
    console.log('⏳ Waiting for existing connection attempt...');
    while (connecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return pool;
  }

  // Prevent too frequent reconnection attempts
  const now = Date.now();
  if (now - lastConnectionAttempt < RECONNECT_DELAY) {
    console.log('⏳ Waiting before reconnection attempt...');
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY - (now - lastConnectionAttempt)));
  }

  connecting = true;
  lastConnectionAttempt = Date.now();
  
  try {
    console.log('🔌 Creating new database connection pool...');
    
    // Close existing pool if it exists but isn't connected
    if (pool) {
      try {
        await pool.close();
        console.log('🗑️ Old pool closed');
      } catch (err) {
        console.log('⚠️ Old pool cleanup error (ignoring):', err.message);
      }
      pool = null;
    }

    // Create new pool
    pool = new sql.ConnectionPool(enhancedConfig);
    
    // Set up event handlers before connecting
    pool.on('connect', () => {
      console.log('✅ Database pool connected successfully');
    });

    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
      if (err.code === 'ECONNCLOSED' || err.code === 'ENOTOPEN') {
        console.log('🔄 Connection lost, will reconnect on next request');
        pool = null;
      }
    });

    pool.on('close', () => {
      console.log('⚠️ Database pool closed');
      pool = null;
    });

    // Connect to the pool
    await pool.connect();
    console.log('✅ Database pool ready');

    return pool;
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    pool = null;
    throw error;
  } finally {
    connecting = false;
  }
}

// Execute database operations with automatic retry and reconnection
async function executeWithRetry(operation, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database operation attempt ${attempt}/${maxRetries}`);
      const currentPool = await getPool();
      return await operation(currentPool);
    } catch (error) {
      lastError = error;
      console.error(`❌ Database operation attempt ${attempt} failed:`, error.message);
      
      // Reset pool on connection errors
      if (error.code === 'ECONNCLOSED' || error.code === 'ENOTOPEN' || error.code === 'ETIMEOUT') {
        console.log('🔄 Resetting connection pool due to connection error');
        pool = null;
        connecting = false;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Find a user by email
async function findUserByEmail(email) {
  return executeWithRetry(async (currentPool) => {
    console.log('🔍 Finding user by email:', email);
    const result = await currentPool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    console.log("findUserByEmail result:", result.recordset.length > 0 ? 'User found' : 'User not found');
    return result.recordset[0];
  });
}

// Create a new user
async function createUser(user) {
  return executeWithRetry(async (currentPool) => {
    const { name, email, passwordHash, dateOfBirth, gender, healthConditions } = user;
    console.log('➕ Creating new user:', email);

    const query = `
      INSERT INTO Users (Name, Email, PasswordHash, DateOfBirth, Gender, HealthConditions)
      OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.DateOfBirth, INSERTED.Gender, INSERTED.HealthConditions
      VALUES (@name, @email, @passwordHash, @dateOfBirth, @gender, @healthConditions)
    `;

    const result = await currentPool.request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("dateOfBirth", sql.Date, dateOfBirth || null)
      .input("gender", sql.NVarChar, gender || null)
      .input("healthConditions", sql.NVarChar, healthConditions || null)
      .query(query);

    const newUser = result.recordset[0];
    console.log("✅ User created successfully:", newUser);
    return newUser;
  });
}

// Get user by ID
async function findUserById(userId) {
  return executeWithRetry(async (currentPool) => {
    console.log('🔍 Finding user by ID:', userId);
    const result = await currentPool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Users WHERE UserID = @userId');
    
    return result.recordset[0];
  });
}

// Update user profile
async function updateUser(userId, updateData) {
  return executeWithRetry(async (currentPool) => {
    const { name, dateOfBirth, gender, healthConditions } = updateData;
    console.log('🔄 Updating user:', userId);
    
    const query = `
      UPDATE Users 
      SET Name = @name, DateOfBirth = @dateOfBirth, Gender = @gender, HealthConditions = @healthConditions
      OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.DateOfBirth, INSERTED.Gender, INSERTED.HealthConditions
      WHERE UserID = @userId
    `;

    const result = await currentPool.request()
      .input("userId", sql.Int, userId)
      .input("name", sql.NVarChar, name)
      .input("dateOfBirth", sql.Date, dateOfBirth || null)
      .input("gender", sql.NVarChar, gender || null)
      .input("healthConditions", sql.NVarChar, healthConditions || null)
      .query(query);

    return result.recordset[0];
  });
}

// Test database connection
async function testConnection() {
  try {
    return await executeWithRetry(async (currentPool) => {
      const result = await currentPool.request().query('SELECT 1 as test');
      return result.recordset.length > 0;
    });
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Get connection status
function getConnectionStatus() {
  return {
    hasPool: !!pool,
    isConnected: pool ? pool.connected : false,
    connecting: connecting
  };
}

// Close connection pool (call this when shutting down the app)
async function closePool() {
  if (pool) {
    try {
      await pool.close();
      console.log('✅ Database pool closed successfully');
    } catch (error) {
      console.error('❌ Error closing database pool:', error);
    }
    pool = null;
  }
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  updateUser,
  testConnection,
  getConnectionStatus,
  closePool,
  executeWithRetry,
  getPool // Export for use in other models
};