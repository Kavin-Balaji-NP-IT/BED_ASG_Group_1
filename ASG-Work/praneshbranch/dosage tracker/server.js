app.post('/api/medicines', (req, res) => {
  const { name, dosage, time } = req.body;

  // Basic validation
  if (!name || !dosage || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Read existing data
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  // Add new record
  const newMedicine = { name, dosage, time };
  data.push(newMedicine);

  // Save updated data
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

  // Respond to client
  res.status(201).json({ message: 'Medicine added successfully', medicine: newMedicine });
});
