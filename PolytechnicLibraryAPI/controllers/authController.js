const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const config = require("../db/sqlConfig");

// User Registration
exports.registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!["member", "librarian"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const pool = await sql.connect(config);

    // Check if username already exists
    const check = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM Users WHERE username = @username");

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    await pool.request()
      .input("username", sql.VarChar, username)
      .input("passwordHash", sql.VarChar, hashedPassword)
      .input("role", sql.VarChar, role)
      .query(`
        INSERT INTO Users (username, passwordHash, role)
        VALUES (@username, @passwordHash, @role)
      `);

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User Login
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM Users WHERE username = @username");

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const payload = {
      id: user.user_id,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
