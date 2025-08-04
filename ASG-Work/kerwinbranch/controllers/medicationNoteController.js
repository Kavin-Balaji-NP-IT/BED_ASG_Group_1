const { addNote, getNote, getAutoNoteFields, deleteSpecificNote } = require("../models/medicationNoteModels");
const { generateAndStoreAutoNote } = require("../db_interactions/dbInteraction");

async function createNote(req, res) {
  const { medicationId, note_text, note_type } = req.body;
  const userId = req.user.userId; // Extract userId from token

  if (!medicationId || !note_text || !note_type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await addNote(medicationId, userId, note_text, 0, note_type);
    if (result.success) {
      return res.status(201).json({ message: "Successfully added notes" });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error creating note:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function retrieveNote(req, res) {
  const { medicationId } = req.query;
  const userId = req.user.userId; // Extract userId from token

  if (!medicationId) {
    return res.status(400).json({ message: "Missing medicationId in query" });
  }

  try {
    const notes = await getNote(medicationId, userId);
    res.status(200).json(notes);
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getAutoNoteFieldsController(req, res) {
  const id = parseInt(req.params.id);
  const userId = req.user.userId; // Extract userId from token

  if (!id) {
    return res.status(400).json({ message: "Missing medicationId in query" });
  }

  try {
    const rows = await getAutoNoteFields(id, userId);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No medication found or fields are null" });
    }

    const med = rows[0];
    const notes = [
      `Repeat Times: ${med.repeat_times}`,
      `Start Hour: ${med.start_hour}`,
      `End Hour: ${med.end_hour}`,
      `Repeat Duration: ${med.repeat_duration}`,
      `Frequency Type: ${med.frequency_type}`,
    ];

    // Add notes into the DB
    await generateAndStoreAutoNote(id, userId);

    res.status(200).json(notes);
  } catch (err) {
    console.error("Error fetching notes from medication columns: ", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteSpecificNoteController(req, res) {
  const { medication_id, note_text } = req.body;
  const userId = req.user.userId; // Extract userId from token

  if (!medication_id || !note_text) {
    return res.status(400).json({ message: "Missing note ID" });
  }

  try {
    const result = await deleteSpecificNote(medication_id, userId, note_text);
    if (result.success) {
      return res.status(200).json({ message: "Note deleted" });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createNote,
  retrieveNote,
  getAutoNoteFieldsController,
  deleteSpecificNoteController,
};