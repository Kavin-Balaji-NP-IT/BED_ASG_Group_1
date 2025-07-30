const bcrypt = require('bcrypt');
const sql = require('mssql');
const dbConfig = require('../dbConfig');

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

      // Collect fields to update dynamically
      const fields = [];
      if (userData.username !== undefined) fields.push('username = @username');
      if (userData.password !== undefined) fields.push('password = @password');
      if (userData.role !== undefined) fields.push('role = @role');

      if (fields.length === 0) {
        // Nothing to update
        return false;
      }

      const query = `
        UPDATE Users
        SET ${fields.join(', ')}
        WHERE id = @id
      `;

      const request = pool.request().input('id', sql.Int, id);

      if (userData.username !== undefined) {
        request.input('username', sql.VarChar, userData.username);
      }
      if (userData.password !== undefined) {
        request.input('password', sql.VarChar, userData.password);
      }
      if (userData.role !== undefined) {
        request.input('role', sql.VarChar, userData.role);
      }

      const result = await request.query(query);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('UpdateUser error:', error);
      throw error;
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
    } catch (error) {
      console.error('DeleteUser error:', error);
      throw error;
    } finally {
      if (pool) await pool.close();
    }
  },
  deleteUserByUsername: async (username) => {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('DELETE FROM Users WHERE username = @username');
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error('deleteUserByUsername error:', error);
    throw error;
  } finally {
    if (pool) await pool.close();
  }
}

};

module.exports = UserModel;
