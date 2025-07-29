const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));  // For serving frontend files

// Temporary in-memory storage
let medicalRecords = [];

// API to add new record
app.post('/api/medical-records', (req, res) => {
  const { diagnosis, allergies, treatments } = req.body;
  medicalRecords.push({ diagnosis, allergies, treatments });
  res.status(201).json({ message: 'Record added' });
});

// API to get all records
app.get('/api/medical-records', (req, res) => {
  res.json(medicalRecords);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
