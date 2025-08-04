// test-database-connection.js
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  trustServerCertificate: true,
  options: {
    port: parseInt(process.env.DB_PORT) || 1433,
    connectionTimeout: 60000,
    requestTimeout: 30000,
    encrypt: false, // Try without encryption first
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function testDatabaseConnection() {
  console.log('🔍 Starting database connection test...\n');
  
  // Step 1: Show configuration
  console.log('📋 Database Configuration:');
  console.log(`   Server: ${dbConfig.server}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Port: ${dbConfig.options.port}`);
  console.log(`   Encrypt: ${dbConfig.options.encrypt}`);
  console.log('');

  let pool;
  
  try {
    // Step 2: Test basic connection to server (without specific database)
    console.log('🔌 Testing connection to SQL Server...');
    const serverConfig = { ...dbConfig };
    delete serverConfig.database; // Connect to server without specifying database
    
    pool = await sql.connect(serverConfig);
    console.log('✅ Successfully connected to SQL Server!');
    
    // Step 3: Get SQL Server version
    const versionResult = await pool.request().query('SELECT @@VERSION as version');
    console.log(`📊 SQL Server Version: ${versionResult.recordset[0].version.split('\n')[0]}`);
    
    // Step 4: List all databases
    console.log('\n📁 Available databases:');
    const dbListResult = await pool.request().query('SELECT name FROM sys.databases ORDER BY name');
    dbListResult.recordset.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    
    // Step 5: Check if BEDSPM database exists
    const bedspmCheck = await pool.request()
      .input('dbName', sql.VarChar, 'BEDSPM')
      .query('SELECT name FROM sys.databases WHERE name = @dbName');
    
    if (bedspmCheck.recordset.length > 0) {
      console.log('\n✅ BEDSPM database exists!');
      
      // Step 6: Try to connect to BEDSPM database specifically
      await pool.close();
      console.log('\n🔌 Testing connection to BEDSPM database...');
      pool = await sql.connect(dbConfig);
      console.log('✅ Successfully connected to BEDSPM database!');
      
      // Step 7: Check Users table
      console.log('\n🔍 Checking Users table...');
      const tableCheck = await pool.request().query(`
        SELECT COUNT(*) as tableExists 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'Users'
      `);
      
      if (tableCheck.recordset[0].tableExists > 0) {
        console.log('✅ Users table exists!');
        
        // Step 8: Count existing users
        const userCount = await pool.request().query('SELECT COUNT(*) as userCount FROM Users');
        console.log(`📊 Current user count: ${userCount.recordset[0].userCount}`);
        
        // Step 9: Test a simple user query
        const sampleUsers = await pool.request().query('SELECT TOP 3 UserID, Name, Email FROM Users');
        if (sampleUsers.recordset.length > 0) {
          console.log('\n👥 Sample users:');
          sampleUsers.recordset.forEach(user => {
            console.log(`   - ID: ${user.UserID}, Name: ${user.Name}, Email: ${user.Email}`);
          });
        }
      } else {
        console.log('❌ Users table does not exist! You need to run the database creation script.');
      }
      
    } else {
      console.log('\n❌ BEDSPM database does not exist!');
      console.log('💡 You need to create the database first. Run the SQL script from paste.txt');
    }
    
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error details:', error.message);
    
    // Provide specific guidance based on error type
    if (error.message.includes('Login failed')) {
      console.log('\n💡 Login Issue Solutions:');
      console.log('   1. Check if SQL Server is set to Mixed Mode Authentication');
      console.log('   2. Verify username and password are correct');
      console.log('   3. Check if the user has proper permissions');
      console.log('   4. Try connecting with SQL Server Authentication enabled');
    } else if (error.message.includes('server was not found')) {
      console.log('\n💡 Server Connection Solutions:');
      console.log('   1. Check if SQL Server is running');
      console.log('   2. Try different server names:');
      console.log('      - .\\SQLEXPRESS');
      console.log('      - localhost\\SQLEXPRESS');
      console.log('      - (localdb)\\MSSQLLocalDB');
      console.log('   3. Check Windows Services for SQL Server');
    } else if (error.message.includes('Cannot open database')) {
      console.log('\n💡 Database Access Solutions:');
      console.log('   1. Database might not exist - run the creation script');
      console.log('   2. User might not have access to the specific database');
      console.log('   3. Check database permissions');
    }
    
    console.log('\n🔧 General Troubleshooting:');
    console.log('   1. Check SQL Server Configuration Manager');
    console.log('   2. Ensure TCP/IP is enabled');
    console.log('   3. Check if SQL Server Browser service is running');
    console.log('   4. Verify firewall settings');
    
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Alternative connection test with different server names
async function testAlternativeConnections() {
  const alternatives = [
    'localhost',
    '.\\SQLEXPRESS',
    'localhost\\SQLEXPRESS',
    '(localdb)\\MSSQLLocalDB',
    '127.0.0.1',
    'localhost,1433'
  ];
  
  console.log('\n🔄 Testing alternative server names...\n');
  
  for (const serverName of alternatives) {
    try {
      console.log(`🔌 Trying: ${serverName}`);
      const testConfig = {
        ...dbConfig,
        server: serverName
      };
      delete testConfig.database; // Test server connection only
      
      const pool = await sql.connect(testConfig);
      console.log(`✅ SUCCESS with: ${serverName}`);
      await pool.close();
      break; // Stop at first successful connection
    } catch (error) {
      console.log(`❌ Failed with: ${serverName} - ${error.message.split('\n')[0]}`);
    }
  }
}

// Run the tests
async function runAllTests() {
  await testDatabaseConnection();
  await testAlternativeConnections();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If no connection worked, check if SQL Server is installed and running');
  console.log('2. If server connects but BEDSPM database missing, run the creation script');
  console.log('3. If database exists but tables missing, run the table creation part');
  console.log('4. Update your .env file with the working server name if different');
}

runAllTests().catch(console.error);