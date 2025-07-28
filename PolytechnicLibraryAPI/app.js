// app.js
require("dotenv").config();
const express = require("express");
const app = express();

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");

// Middleware to parse JSON requests
app.use(express.json());

// Route definitions
app.use("/register", authRoutes);
app.use("/login", authRoutes);
app.use("/books", bookRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
