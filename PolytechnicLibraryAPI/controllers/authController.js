const bcrypt = require("bcryptjs");
const sql = require("mssql");
const config = require("../db/sqlConfig");

exports.registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!["member", "librarian"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const pool = await sql.connect(config);

    const check = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM Users WHERE username = @username");

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.request()
      .input("username", sql.VarChar, username)
      .input("passwordHash", sql.VarChar, hashedPassword)
      .input("role", sql.VarChar, role)
      .query(`INSERT INTO Users (username, passwordHash, role)
              VALUES (@username, @passwordHash, @role)`);

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};