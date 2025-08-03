const express = require('express');
const cors = require('cors'); 
const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const {
    getFilteredMedications,
    getMedicationById,
    getAllMedicationByDate,
    deleteMedicationById,
    addMedication,
    updateMedicationController,
    getMedicationOccurrencesController,
    getOccurrencesByMedIdAndDateController,
    getOccurrencesByMedicationIdController
} = require('./controllers/medicationController');

const notificationController = require("./controllers/medicationNoteController");
const ringtoneController = require("./controllers/ringtoneController");
const { deleteOccurrencesByMedicationId } = require('./models/medicationModels');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Medication routes
app.get('/medications', getFilteredMedications);
app.get('/medications/by-date', getAllMedicationByDate);
app.get('/medications/:id', getMedicationById);
app.delete('/medications/:id', deleteMedicationById);
app.post('/medications', addMedication);
app.put('/medications/:id', updateMedicationController);

// Medication notes routes
app.post('/medication-notes', notificationController.createNote);
app.get('/medication-notes', notificationController.retrieveNote);
app.get('/medications/:id/notes/auto', notificationController.getAutoNoteFieldsController);

// Deletes specific medications so no DELETE route
app.post("/medications/delete/notes/by-details", notificationController.deleteSpecificNoteController);

// Post ringtone
app.put("/medications/:id/ringtone", ringtoneController.postRingtoneByIdController);
app.put('/medication-occurrences/:id/ringtone', ringtoneController.postRingtoneOccurrenceByIdController);

// Retrieve from MedicationOccurences Database
app.get('/medication-occurrences', getMedicationOccurrencesController);
app.get('/medication-occurrences-by-date', getOccurrencesByMedIdAndDateController);
app.get('/medication-occurrences/by-medication/:medicationId', getOccurrencesByMedicationIdController);

// Delete occurrence and edit occurrence
app.delete("/medication-occurrences/:medicationId", deleteOccurrencesByMedicationId);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
