// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const loginRoutes = require('./routes/loginRoutes');
const registerRoutes = require('./routes/registerRoutes');
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const eventCalendarRoutes = require('./routes/eventCalendarRoutes');

app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/users', userRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/events', eventCalendarRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;  // Export app without listening
