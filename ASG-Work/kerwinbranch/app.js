const express = require('express');
const cors = require('cors'); 
const sql = require('mssql');
const dotenv = require('dotenv');

const router = express.Router();
const verifyToken = require('../middleware/auth');

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
app.get('/medications', verifyToken, getFilteredMedications);
app.get('/medications/by-date', verifyToken, getAllMedicationByDate);
app.get('/medications/:id', verifyToken, getMedicationById);
app.delete('/medications/:id', verifyToken, deleteMedicationById);
app.post('/medications', verifyToken, addMedication);
app.put('/medications/:id', verifyToken, updateMedicationController);

// Medication notes routes
app.post('/medication-notes', verifyToken, notificationController.createNote);
app.get('/medication-notes', verifyToken, notificationController.retrieveNote);
app.get('/medications/:id/notes/auto', verifyToken, notificationController.getAutoNoteFieldsController);

// Deletes specific medications so no DELETE route
app.post("/medications/delete/notes/by-details", notificationController.deleteSpecificNoteController);

// Post ringtone
app.put("/medications/:id/ringtone", verifyToken, ringtoneController.postRingtoneByIdController);
app.put('/medication-occurrences/:id/ringtone', verifyToken, ringtoneController.postRingtoneOccurrenceByIdController);

// Retrieve from MedicationOccurences Database
app.get('/medication-occurrences', verifyToken, getMedicationOccurrencesController);
app.get('/medication-occurrences-by-date', verifyToken, getOccurrencesByMedIdAndDateController);
app.get('/medication-occurrences/by-medication/:medicationId', getOccurrencesByMedicationIdController);

// Delete occurrence and edit occurrence
app.delete("/medication-occurrences/:medicationId", verifyToken, deleteOccurrencesByMedicationId);


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
