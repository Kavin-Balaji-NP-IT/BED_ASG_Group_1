const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
dotenv.config();

const { poolConnect } = require('./fitnessTrackerConfig');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const loginRoutes = require('./back-end/loginRoutes'); 
const registerRoutes = require('./back-end/registerRoutes');
const userRoutes = require('./back-end/userRoutes');
const fitnessTrackerRoutes = require('./back-end/fitnessTrackerRoutes');

poolConnect.then(() => {
    console.log('SQL Server database connection pool established successfully.');
}).catch(err => {
    console.error('SQL Server database connection pool failed:', err);
    process.exit(1);
});

app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/users', userRoutes);

app.use('/api/fitness-tracker', fitnessTrackerRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the server!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Access Frontend at: http://localhost:${PORT}/index.html`);
  console.log(`Fitness Tracker API available at: http://localhost:${PORT}/api/fitness-tracker/:userId`);
});