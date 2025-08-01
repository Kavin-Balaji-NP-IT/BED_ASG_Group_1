
const { getAutoNoteFields, addNote, noteExists } = require('../models/medicationNoteModels');


function formatTimeString(timeInput) {
    if (!timeInput) return 'Invalid Time';

    try {
        const date = new Date(timeInput);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (err) {
        return 'Invalid Time';
    }
}


async function generateAndStoreAutoNote(medicationId) {
    const rows = await getAutoNoteFields(medicationId);

    if (!rows || rows.length === 0) {
        console.warn("No medication found or missing fields for auto-note.");
        return { success: false };
    }

    const med = rows[0];

    const noteLines = [
        `Repeat Times: ${med.repeat_times}`,
        `Start Hour: ${formatTimeString(med.start_hour)}`,
        `End Hour: ${formatTimeString(med.end_hour)}`,
        `Repeat Duration: ${med.repeat_duration}`,
        `Frequency Type: ${med.frequency_type}`,
    ];


    const insertResults = [];

   for (const noteText of noteLines) {
    const exists = await noteExists(medicationId, noteText);
    if (!exists) {
        const result = await addNote(medicationId, noteText, 0, 'auto');
        insertResults.push(result);
    }
    }

    return { success: true, insertedCount: insertResults.length };
}

module.exports = {
    generateAndStoreAutoNote
};
