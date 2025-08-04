// dbconfig.js - Updated to use your .env variables
require('dotenv').config(); // Load environment variables

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'BEDSPM',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '12345',
  port: parseInt(process.env.DB_PORT) || 1433,
  pool: {
    max: 20,
    min: 5, // Keep minimum connections alive
    idleTimeoutMillis: 300000, // 5 minutes
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  options: {
    encrypt: false, // Set to true if using Azure SQL
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 60000, // 60 seconds
    connectionTimeout: 60000, // 60 seconds
    parseJSON: true,
    rowCollectionOnRequestCompletion: false,
    rowCollectionOnDone: false,
    arrayRowMode: false // Changed from useColumnNames to arrayRowMode
  },
  connectionTimeout: 60000,
  requestTimeout: 60000
};

module.exports = dbConfig;