// debug-login.js - Test login functionality
const bcrypt = require('bcrypt');
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
    encrypt: false,
    enableArithAbort: true
  }
};

async function debugLogin() {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Step 1: Check what's actually in the database
    console.log('🔍 Checking users in database...\n');
    const allUsers = await pool.request().query('SELECT UserID, Name, Email, PasswordHash FROM Users WHERE Email IN (\'bhaveesh@example.com\', \'kavin@example.com\')');
    
    allUsers.recordset.forEach(user => {
      console.log(`👤 User: ${user.Name}`);
      console.log(`📧 Email: ${user.Email}`);
      console.log(`🔑 Password Hash: ${user.PasswordHash.substring(0, 20)}...`);
      console.log(`🔒 Hash Type: ${user.PasswordHash.startsWith('$2b$') ? 'bcrypt' : 'NOT bcrypt'}`);
      console.log('---');
    });
    
    // Step 2: Create a fresh user with known password
    console.log('\n🔨 Creating test user with known password...');
    const testPassword = 'test123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    
    // Delete existing test user if exists
    await pool.request()
      .input('email', sql.VarChar, 'testuser@example.com')
      .query('DELETE FROM Users WHERE Email = @email');
    
    // Create new test user
    const insertResult = await pool.request()
      .input('name', sql.NVarChar, 'Test User')
      .input('email', sql.NVarChar, 'testuser@example.com')
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .input('dateOfBirth', sql.Date, null)
      .input('gender', sql.NVarChar, null)
      .input('healthConditions', sql.NVarChar, null)
      .query(`
        INSERT INTO Users (Name, Email, PasswordHash, DateOfBirth, Gender, HealthConditions)
        OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email
        VALUES (@name, @email, @passwordHash, @dateOfBirth, @gender, @healthConditions)
      `);
    
    const newUser = insertResult.recordset[0];
    console.log('✅ Created test user:', newUser);
    console.log('📧 Email: testuser@example.com');
    console.log('🔑 Password: test123');
    
    // Step 3: Test the login process manually
    console.log('\n🧪 Testing login process...');
    
    // Simulate findUserByEmail
    const userResult = await pool.request()
      .input('email', sql.VarChar, 'testuser@example.com')
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (userResult.recordset.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = userResult.recordset[0];
    console.log('✅ User found:', user.Name, user.Email);
    
    // Test password comparison
    const passwordMatch = await bcrypt.compare('test123', user.PasswordHash);
    console.log('🔒 Password match result:', passwordMatch);
    
    if (passwordMatch) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
    // Step 4: Test with wrong password
    const wrongPasswordMatch = await bcrypt.compare('wrongpassword', user.PasswordHash);
    console.log('🔒 Wrong password match result:', wrongPasswordMatch);
    
    // Step 5: Test case sensitivity
    console.log('\n📝 Testing email case sensitivity...');
    const upperCaseResult = await pool.request()
      .input('email', sql.VarChar, 'TESTUSER@EXAMPLE.COM')
      .query('SELECT * FROM Users WHERE Email = @email');
    
    console.log('🔤 Uppercase email found:', upperCaseResult.recordset.length > 0);
    
    await pool.close();
    
    console.log('\n🎯 Next steps:');
    console.log('1. Try logging in with: testuser@example.com / test123');
    console.log('2. Check if your login form is working correctly');
    console.log('3. Make sure you are using the fixed usermodel.js');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin();