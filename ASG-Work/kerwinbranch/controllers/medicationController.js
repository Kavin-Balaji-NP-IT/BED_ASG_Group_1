const medicationModel = require('../models/medicationModels');

async function getFilteredMedications(req, res) {
  const { date } = req.query;
  const userId = req.user.userId; // Extract userId from token

  try {
    const medications = await medicationModel.getMedicationsByDateAndTime(date, userId);
    res.status(200).json(medications);
  } catch (err) {
    console.error("Error in getFilteredMedications:", err);
    res.status(500).send('Server error');
  }
}

async function getAllMedicationByDate(req, res) {
  const { date } = req.query;
  const userId = req.user.userId;

  try {
    const medications = await medicationModel.getAllMedicationsByDate(date, userId);
    res.status(200).json(medications);
  } catch (err) {
    console.error("Error in getAllMedicationsByDate:", err);
    res.status(500).send('Server error');
  }
}

async function getMedicationById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const medication = await medicationModel.getMedicationById(id, userId);
    if (medication) {
      res.status(200).json(medication);
    } else {
      res.status(404).send('Medication not found');
    }
  } catch (err) {
    console.error("Error in getMedicationById:", err);
    res.status(500).send('Server error');
  }
}

async function deleteMedicationById(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await medicationModel.deleteMedicationById(id, userId);
    if (result.success) {
      res.status(200).json({ message: "Medication and associated notes deleted successfully" });
    } else {
      res.status(404).json({ message: result.message || "Medication not found" });
    }
  } catch (err) {
    console.error("Error in deleteMedicationById controller:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function addMedication(req, res) {
  const userId = req.user.userId;
  const {
    name,
    schedule_date,
    frequency_type,
    repeat_times,
    repeat_duration,
    start_hour,
    end_hour,
  } = req.body;

  if (!name || !schedule_date || !frequency_type) {
    return res.status(400).json({ message: "Missing required fields: name, date, or frequency_type" });
  }

  const medicationData = {
    name: name.trim(),
    schedule_date,
    frequency_type: frequency_type.trim() || "Daily",
    repeat_times: Number(repeat_times),
    repeat_duration: Number(repeat_duration || 0),
    start_hour,
    end_hour,
    schedule_hour: parseInt(start_hour.split(':')[0], 10),
    userId,
  };

  try {
    const result = await medicationModel.addMedication(medicationData);
    if (result.success) {
      res.status(201).json({ message: "Medication added successfully" });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error in addMedication controller:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateMedicationController(req, res) {
  const medicationId = req.params.id;
  const userId = req.user.userId;
  const medicationData = { ...req.body, userId };

  try {
    const result = await medicationModel.updateMedication(medicationId, medicationData);
    if (result.success) {
      res.status(200).json({ message: "Medication updated successfully" });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error updating medication:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getMedicationOccurrencesController(req, res) {
  const userId = req.user.userId;

  try {
    const occurrences = await medicationModel.getAllMedicationOccurrences(userId);
    res.status(200).json(occurrences);
  } catch (err) {
    console.error("Error retrieving MedicationOccurrences:", err);
    res.status(500).json({ message: "Failed to retrieve medication occurrences" });
  }
}

async function getOccurrencesByMedicationIdController(req, res) {
  const medicationId = req.params.medicationId;
  const userId = req.user.userId;

  try {
    const result = await medicationModel.getOccurrencesByMedicationId(medicationId, userId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching occurrences by medication ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}


async function getOccurrencesByMedIdAndDateController(req, res) {
  const { medication_id, date } = req.query;
  const userId = req.user.userId;

  if (!medication_id || !date) {
    return res.status(400).json({ message: "Missing medication_id or date" });
  }

  try {
    const result = await medicationModel.getOccurrencesByMedIdAndDate(medication_id, date, userId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching occurrences by date and ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}



module.exports = {
  getFilteredMedications,
  getMedicationById,
  getAllMedicationByDate,
  deleteMedicationById,
  addMedication,
  updateMedicationController,
  getMedicationOccurrencesController,
  getOccurrencesByMedicationIdController,
  getOccurrencesByMedIdAndDateController
};