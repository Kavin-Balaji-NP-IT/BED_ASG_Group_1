// test-db-connection.js - Run this to test your database connection
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
};

async function testConnection() {
  console.log('🧪 Testing database connection...');
  console.log('📊 Configuration:');
  console.log(`   Server: ${dbConfig.server}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-2) : 'NOT SET'}`);
  
  try {
    console.log('\n🔌 Attempting to connect...');
    const pool = await sql.connect(dbConfig);
    
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    console.log('🔍 Testing query...');
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database');
    
    console.log('✅ Query successful!');
    console.log(`   SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
    console.log(`   Connected to database: ${result.recordset[0].database}`);
    
    // Test if Settings table exists
    console.log('\n📋 Checking Settings table...');
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Settings'
    `);
    
    if (tableCheck.recordset.length > 0) {
      console.log('✅ Settings table exists');
      
      // Check table structure
      const structureCheck = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Settings' 
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('📊 Settings table structure:');
      structureCheck.recordset.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check if required columns exist
      const requiredColumns = ['Theme', 'FontSize', 'NotificationSound', 'MedicationReminders', 'AppointmentReminders'];
      const existingColumns = structureCheck.recordset.map(col => col.COLUMN_NAME);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing required columns:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
        console.log('\n💡 You need to run the database update script to add these columns');
      } else {
        console.log('✅ All required columns exist');
      }
      
    } else {
      console.log('❌ Settings table does not exist');
      console.log('💡 You need to run the database creation script');
    }
    
    // Test Users table
    console.log('\n👥 Checking Users table...');
    const usersCheck = await pool.request().query(`
      SELECT COUNT(*) as userCount 
      FROM Users
    `);
    console.log(`✅ Users table has ${usersCheck.recordset[0].userCount} users`);
    
    // Check if user 12 exists (from your token)
    const user12Check = await pool.request().query(`
      SELECT UserID, Name, Email 
      FROM Users 
      WHERE UserID = 12
    `);
    
    if (user12Check.recordset.length > 0) {
      const user = user12Check.recordset[0];
      console.log(`✅ User 12 exists: ${user.Name} (${user.Email})`);
    } else {
      console.log('❌ User 12 does not exist (needed for your current token)');
      console.log('💡 You may need to create this user or get a new token');
    }
    
    await pool.close();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'Unknown'}`);
    
    if (error.code === 'ELOGIN') {
      console.error('💡 Login failed - check username and password');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Server not found - check server name and port');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - check if SQL Server is running');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check if SQL Server is accepting connections');
    }
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('   1. Make sure SQL Server is running');
    console.error('   2. Check if SQL Server is listening on port 1433');
    console.error('   3. Verify username and password');
    console.error('   4. Check if SQL Server authentication is enabled');
    console.error('   5. Try connecting with SQL Server Management Studio first');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { testConnection };