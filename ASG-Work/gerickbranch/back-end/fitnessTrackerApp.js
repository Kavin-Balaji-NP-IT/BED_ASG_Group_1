const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
dotenv.config();

const { poolConnect } = require('./config/fitnessTrackerConfig');

const app = express();
const PORT = process.env.FITNESS_PORT || 3001; 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'front-end')));

const loginRoutes = require('./routes/loginRoutes'); 
const registerRoutes = require('./routes/registerRoutes');
const userRoutes = require('./routes/userRoutes');
const fitnessTrackerRoutes = require('./routes/fitnessTrackerRoutes');

poolConnect.then(() => {
    console.log('Fitness Service: SQL Server database connection pool established successfully.');
}).catch(err => {
    console.error('Fitness Service: SQL Server database connection pool failed:', err);
    process.exit(1);
});


app.use('/api/fitness-tracker', fitnessTrackerRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front-end', 'index.html'));
});


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the server!');
});

app.listen(PORT, () => {
  console.log(`🚀 Fitness Service running on port ${PORT}`);
  console.log(`Access Frontend at: http://localhost:${PORT}`);
});