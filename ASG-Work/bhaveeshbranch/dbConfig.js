require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE, // 'BED'
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false, // Use true if using Azure
    trustServerCertificate: true // Needed for local dev
  }
};

module.exports = config;
