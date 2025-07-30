const sql = require('mssql');
const config = require('./dbConfig'); // Make sure the path is correct

async function testConnection() {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected to BED database successfully!');
    
    // Optional: run a test query
    const result = await pool.request().query('SELECT GETDATE() AS CurrentTime');
    console.log('🕒 Server Time:', result.recordset[0].CurrentTime);

    await sql.close();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

testConnection();
