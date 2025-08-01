const { postRingtoneById, postRingtoneOccurrenceById } = require('../models/ringtoneModels');

async function postRingtoneByIdController(req, res) { // postRingtoneById
    try {
        const id = parseInt(req.params.id);
        const { audio_link } = req.body;

        if (!id || !audio_link) {
        return res.status(400).json({ message: "Missing id or audio_link" });
        }

        const result = await postRingtoneById(id, audio_link);

        if (result[0] === 0) {
        return res.status(404).json({ message: "No medication found with that ID" });
        }

        res.status(200).json({ message: "Ringtone updated successfully" });
  } catch (err) {
        console.error("Error in postRingtoneByIdController:", err.message);
        res.status(500).json({ message: "Server error" });
  }
}

async function postRingtoneOccurrenceByIdController(req, res) { // postRingtoneById
    try {
        const id = parseInt(req.params.id);
        const { audio_link } = req.body;

        if (!id || !audio_link) {
        return res.status(400).json({ message: "Missing id or audio_link" });
        }

        const result = await postRingtoneOccurrenceById(id, audio_link);

        if (result[0] === 0) {
        return res.status(404).json({ message: "No medication found with that ID" });
        }

        res.status(200).json({ message: "Ringtone updated successfully" });
  } catch (err) {
        console.error("Error in postRingtoneByIdController:", err.message);
        res.status(500).json({ message: "Server error" });
  }
}



module.exports = {
    postRingtoneByIdController,
    postRingtoneOccurrenceByIdController
};