const medicationModel = require("../models/medicationmodel");
const trackerModel = require("../models/DosageTrackerModel");

// Get all medications for authenticated user
async function getAllMedications(req, res) {
  try {
    console.log("User ID in getAllMedications:", req.user.userId);
    const activeOnly = req.query.active === 'true';
    
    let medications;
    if (activeOnly) {
      medications = await medicationModel.getActiveMedicationsByUserId(req.user.userId);
    } else {
      medications = await medicationModel.getMedicationsByUserId(req.user.userId);
    }
    
    res.json(medications);
  } catch (error) {
    console.error("Error getting user medications:", error);
    res.status(500).json({ error: "Failed to get medications" });
  }
}

// Get medication by MedicationID (only if belongs to user)
async function getMedicationById(req, res) {
  try {
    const id = parseInt(req.params.id);
    console.log("User ID in getMedicationById:", req.user.userId);
    const medication = await medicationModel.getMedicationById(id);
    if (!medication) return res.status(404).json({ error: "Medication not found" });
    if (medication.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });
    
    // Include tracking history if requested
    if (req.query.tracking === 'true') {
      const tracking = await trackerModel.getTrackingByMedicationId(id);
      medication.tracking = tracking;
    }
    
    res.json(medication);
  } catch (error) {
    console.error("Error in getMedicationById:", error);
    res.status(500).json({ error: "Error retrieving medication" });
  }
}

// Create new medication for user
async function createMedication(req, res) {
  try {
    console.log("User ID in createMedication:", req.user.userId);
    const medicationData = { ...req.body, UserID: req.user.userId };
    const newMedication = await medicationModel.createMedication(medicationData);
    res.status(201).json(newMedication);
  } catch (error) {
    console.error("Error in createMedication:", error);
    res.status(500).json({ error: "Error creating medication" });
  }
}

// Delete medication by MedicationID
async function deleteMedication(req, res) {
  try {
    const id = parseInt(req.params.id);
    console.log("User ID in deleteMedication:", req.user.userId);
    const medication = await medicationModel.getMedicationById(id);
    if (!medication) return res.status(404).json({ error: "Medication not found" });
    if (medication.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });
    const deleted = await medicationModel.deleteMedication(id);
    if (deleted)
      res.json({ message: `Medication with ID ${id} deleted successfully.` });
    else res.status(500).json({ error: "Error deleting medication" });
  } catch (error) {
    console.error("Error in deleteMedication:", error);
    res.status(500).json({ error: "Error deleting medication" });
  }
}

// Update medication by MedicationID
async function updateMedication(req, res) {
  try {
    const id = parseInt(req.params.id);
    console.log("User ID in updateMedication:", req.user.userId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid MedicationID" });
    }

    const existing = await medicationModel.getMedicationById(id);
    if (!existing) return res.status(404).json({ error: "Medication not found" });
    if (existing.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });

    // Extract only allowed fields from req.body
    const { Name, Dosage, Frequency, StartDate, EndDate, Notes } = req.body;
    const updateData = { Name, Dosage, Frequency, StartDate, EndDate, Notes };

    const updated = await medicationModel.updateMedication(id, updateData);
    if (updated)
      res.json({ message: `Medication with ID ${id} updated successfully.`, data: updated });
    else res.status(500).json({ error: "Error updating medication" });
  } catch (error) {
    console.error("Error in updateMedication:", error);
    res.status(500).json({ error: "Error updating medication" });
  }
}

// Track medication intake
async function trackMedication(req, res) {
  try {
    const { MedicationID, Taken, TakenDate, TakenTime } = req.body;
    console.log("User ID in trackMedication:", req.user.userId);

    // Verify medication belongs to user
    const medication = await medicationModel.getMedicationById(MedicationID);
    if (!medication) return res.status(404).json({ error: "Medication not found" });
    if (medication.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });

    const trackingData = {
      MedicationID,
      TakenDate: TakenDate || new Date().toISOString().split('T')[0],
      TakenTime: TakenTime || new Date().toTimeString().split(' ')[0],
      Taken
    };

    const newTracking = await trackerModel.createTracking(trackingData);
    res.status(201).json({ 
      message: "Medication tracking recorded successfully",
      data: newTracking
    });
  } catch (error) {
    console.error("Error in trackMedication:", error);
    res.status(500).json({ error: "Error tracking medication" });
  }
}

// Get today's medication tracking
async function getTodayTracking(req, res) {
  try {
    console.log("User ID in getTodayTracking:", req.user.userId);
    const todayTracking = await trackerModel.getTodayTrackingByUserId(req.user.userId);
    res.json({
      date: new Date().toISOString().split('T')[0],
      data: todayTracking
    });
  } catch (error) {
    console.error("Error in getTodayTracking:", error);
    res.status(500).json({ error: "Error getting today's tracking" });
  }
}

module.exports = {
  getAllMedications,
  getMedicationById,
  createMedication,
  deleteMedication,
  updateMedication,
  trackMedication,
  getTodayTracking,
};
