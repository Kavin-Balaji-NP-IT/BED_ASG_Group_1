const medicationModel = require('../models/medicationModels');

async function getFilteredMedications(req, res) {
  const { date } = req.query;


  console.log("Incoming query:", date);
  try {
    const medications = await medicationModel.getMedicationsByDateAndTime(date);
    res.status(200).json(medications);
  } catch (err) {
    console.error("Error in getFilteredMedications:", err);
    res.status(500).send('Server error');
  }
}

async function getAllMedicationByDate (req, res) {
    const { date } = req.query;
    console.log("Incoming query", date);

    try {
      const medications = await medicationModel.getAllMedicationsByDate(date);
      res.status(200).json(medications);
    } catch (err) {
      console.error("Error in getAllMedicationsByDate: ", err);
      res.status(500).send('Server error');
    }
}


// Get medication by ID
async function getMedicationById(req, res) {
  const { id } = req.params;
  try {
    const medication = await medicationModel.getMedicationById(id);
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
  const { id } = req.params;  // Get the medication ID from the request params

  if (!id) {
    return res.status(400).json({ message: "Medication ID is required" });  // Ensure an ID is provided
  }

  try {
    const result = await medicationModel.deleteMedicationById(id);  // Call the model function to delete medication

    if (result.success) {
      return res.status(200).json({ message: "Medication and associated notes deleted successfully" });
    } else {
      return res.status(404).json({ message: result.message || "Medication not found" });
    }
  } catch (err) {
    console.error("Error in deleteMedicationById controller:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


// Add medication
async function addMedication(req, res) {
  const {
    name,
    schedule_date,
    frequency_type,
    repeat_times,
    repeat_duration,
    start_hour,
    end_hour,
    
  } = req.body;

  // Basic presence check
  if (!name || !schedule_date || !frequency_type) {
    return res.status(400).json({ message: "Missing required fields: name, date, or frequency_type" });
  }

  // Convert & validate repeat_times
  const parsedRepeatTimes = Number(repeat_times);
  if (!Number.isInteger(parsedRepeatTimes) || parsedRepeatTimes < 1) {
    return res.status(400).json({ message: "repeat_times must be a positive whole number" });
  }

  // Convert & validate optional repeat_duration
  let parsedRepeatDuration = 0;
  if (repeat_duration !== undefined && repeat_duration !== "") {
    parsedRepeatDuration = Number(repeat_duration);
    if (!Number.isInteger(parsedRepeatDuration) || parsedRepeatDuration < 0) {
      return res.status(400).json({ message: "repeat_duration must be a non-negative whole number" });
    }
  }

  // Convert & validate start_hour and end_hour
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // Matches '00:00' to '23:59'

  if (  
    !timeRegex.test(start_hour) ||
    !timeRegex.test(end_hour)
  ) {
    return res.status(400).json({ message: "Start and end hours must be in HH:mm format (00:00 to 23:59)" });
  }

  const parsedStartHour = start_hour; // still 'HH:mm' format
  const parsedEndHour = end_hour;
  const parsedScheduleHour = parseInt(start_hour.split(':')[0], 10);

  const medicationData = {
    name: name.trim(),
    schedule_date,
    frequency_type: frequency_type.trim() || "Daily",
    repeat_times: parsedRepeatTimes,
    repeat_duration: parsedRepeatDuration,
    start_hour: parsedStartHour,
    end_hour: parsedEndHour,
    schedule_hour: parsedScheduleHour,
  };


  try {
    const result = await medicationModel.addMedication(medicationData);

    if (result.success) {
      return res.status(201).json({ message: "Medication added successfully" });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error in addMedication controller:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


// Update medication
async function updateMedicationController(req, res) {
  const medicationId = req.params.id;
  const medicationData = req.body;

  try {
    // Destructure and validate required fields
    const {
      name,
      schedule_date,
      frequency_type,
      repeat_times,
      repeat_duration,
      start_hour,
      end_hour
    } = medicationData;

    if (
      !name ||
      !schedule_date ||
      !frequency_type ||
      repeat_times === undefined ||
      start_hour === undefined ||
      end_hour === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Parse and sanitize input
    const parsedRepeatTimes = parseInt(repeat_times, 10);
    const parsedRepeatDuration = repeat_duration !== undefined && repeat_duration !== ""
      ? parseInt(repeat_duration, 10)
      : 0;

    const parsedStartHour = start_hour;
    const parsedEndHour = end_hour;
    const parsedScheduleHour = parseInt(parsedStartHour.split(":")[0], 10);

    const cleanData = {
      name,
      schedule_date,
      frequency_type,
      repeat_times: parsedRepeatTimes,
      repeat_duration: parsedRepeatDuration,
      start_hour: parsedStartHour,
      end_hour: parsedEndHour,
      schedule_hour: parsedScheduleHour
    };

    // Call model update
    const result = await medicationModel.updateMedication(medicationId, cleanData);

    if (result.success) {
      return res.status(200).json({ message: "Medication updated successfully" });
    } else {
      return res.status(400).json({ message: result.message });
    }

  } catch (err) {
    console.error("Error updating medication:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


async function getMedicationOccurrencesController(req, res) {
  try {
    const selectedDate = req.query.date; 
    const occurrences = await medicationModel.getAllMedicationOccurrences();

    const formatted = occurrences.map(row => {
      const dateStr = new Date(row.schedule_date).toISOString().split("T")[0]; 
      const timeStr = row.schedule_hour;

      const occurrence_datetime = new Date(`${dateStr}T${timeStr}`);

      return {
        id: row.id, // Add this if needed
        medication_id: row.medication_id,
        name: row.name,
        audio_link: row.audio_link,
        schedule_date: row.schedule_date,
        occurrence_time: row.occurrence_time,
        schedule_hour: row.schedule_hour,
        occurrence_datetime,
      };
    });

    const filtered = selectedDate
      ? formatted.filter(entry => {
          const entryDate = new Date(entry.schedule_date).toISOString().split("T")[0];
          return entryDate === selectedDate;
        })
      : formatted;

    res.status(200).json(filtered);
  } catch (err) {
    console.error('Error retrieving MedicationOccurrences:', err);
    res.status(500).json({ message: 'Failed to retrieve medication occurrences' });
  }
}


async function getOccurrencesByMedIdAndDateController(req, res) {
  const { medication_id, date } = req.query;

  if (!medication_id || !date) {
    return res.status(400).json({ message: "Missing medication_id or date" });
  }

  try {
    const result = await medicationModel.getOccurrencesByMedIdAndDate(medication_id, date);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching occurrences by date and ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getOccurrencesByMedicationIdController(req, res) {
  const medicationId = req.params.medicationId;

  try {
    const result = await medicationModel.getOccurrencesByMedicationId(medicationId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching occurrences by medication ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteOccurrencesController(req, res) {
  const medicationId = req.params.medicationId;

  if (!medicationId) {
    return res.status(400).json({ message: "Missing medicationId in URL." });
  }

  try {
    const result = await deleteOccurrencesByMedicationId(parseInt(medicationId));

    if (result.success) {
      return res.status(200).json({ message: "Occurrences deleted successfully." });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (err) {
    console.error("❌ Controller error:", err);
    return res.status(500).json({ message: "Server error while deleting occurrences." });
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
  getOccurrencesByMedIdAndDateController,
  deleteOccurrencesController
};