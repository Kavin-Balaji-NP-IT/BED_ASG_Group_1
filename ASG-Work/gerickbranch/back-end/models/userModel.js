const bcrypt = require('bcrypt');
const { sql, poolConnect } = require('../config/fitnessTrackerConfig'); 

const UserModel = {
  findByUsername: async (username) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM Users WHERE username = @username');
      return result.recordset[0];
    } catch (error) {
      console.error('DB query error:', error);
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  findById: async (id) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE id = @id');
      return result.recordset[0];
    } catch (error) {
      console.error('DB query error:', error);
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  validatePassword: async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
  },

  createUser: async (user) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('username', sql.VarChar, user.username)
        .input('password', sql.VarChar, user.password)
        .input('role', sql.VarChar, user.role)
        .query('INSERT INTO Users (username, password, role) VALUES (@username, @password, @role)');
      return result.rowsAffected[0] === 1;
    } catch (error) {
      console.error('DB insert error:', error);
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },

  updateUser: async (id, userData) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const query = `
        UPDATE Users
        SET 
          username = @username,
          ${userData.password ? 'password = @password,' : ''}
          role = @role
        WHERE id = @id
      `;
      const request = pool.request()
        .input('id', sql.Int, id)
        .input('username', sql.VarChar, userData.username)
        .input('role', sql.VarChar, userData.role);

      if (userData.password) {
        request.input('password', sql.VarChar, userData.password);
      }

      // Clean up trailing comma before WHERE clause
      const formattedQuery = query.replace(/,\s*WHERE/, ' WHERE');

      const result = await request.query(formattedQuery);
      return result.rowsAffected[0] > 0;
    } finally {
      if (pool) await pool.close();
    }
  },

  deleteUser: async (id) => {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Users WHERE id = @id');
      return result.rowsAffected[0] > 0;
    } finally {
      if (pool) await pool.close();
    }
  }
};

module.exports = UserModel;
