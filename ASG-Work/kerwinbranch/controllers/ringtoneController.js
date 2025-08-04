const { postRingtoneById, postRingtoneOccurrenceById } = require('../models/ringtoneModels');

async function postRingtoneByIdController(req, res) {
  const id = parseInt(req.params.id);
  const { audio_link } = req.body;
  const userId = req.user.userId;

  if (!id || !audio_link) {
    return res.status(400).json({ message: "Missing id or audio_link" });
  }

  try {
    const result = await postRingtoneById(id, userId, audio_link);
    if (result > 0) {
      res.status(200).json({ message: "Ringtone updated successfully" });
    } else {
      res.status(404).json({ message: "No medication found or unauthorized" });
    }
  } catch (err) {
    console.error("Error in postRingtoneByIdController:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function postRingtoneOccurrenceByIdController(req, res) {
  const id = parseInt(req.params.id);
  const { audio_link } = req.body;
  const userId = req.user.userId;

  if (!id || !audio_link) {
    return res.status(400).json({ message: "Missing id or audio_link" });
  }

  try {
    const result = await postRingtoneOccurrenceById(id, userId, audio_link);
    if (result > 0) {
      res.status(200).json({ message: "Ringtone updated successfully" });
    } else {
      res.status(404).json({ message: "No occurrence found or unauthorized" });
    }
  } catch (err) {
    console.error("Error in postRingtoneOccurrenceByIdController:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  postRingtoneByIdController,
  postRingtoneOccurrenceByIdController,
};