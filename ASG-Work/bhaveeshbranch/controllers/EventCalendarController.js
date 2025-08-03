const eventModel = require('../models/eventCalendarModel');

module.exports = {
  createEvent: async (req, res) => {
    const { eventTitle, eventDate, eventLocation, eventDescription } = req.body;
    const userId = req.user.userId;

    try {
      await eventModel.createEvent(userId, eventTitle, eventDate, eventLocation, eventDescription);
      res.status(201).json({ message: 'Event created successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error while creating event' });
    }
  },

  getAllEventsForUser: async (req, res) => {
    const userId = req.user.userId;

    try {
      const events = await eventModel.getAllEventsForUser(userId);
      res.json(events);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error while fetching events' });
    }
  },

  updateEvent: async (req, res) => {
    const eventId = req.params.id;
    const { eventTitle, eventDate, eventLocation, eventDescription } = req.body;
    const userId = req.user.userId;

    try {
      const result = await eventModel.updateEvent(eventId, userId, eventTitle, eventDate, eventLocation, eventDescription);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Event not found or no permission' });
      }

      res.json({ message: 'Event updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error while updating event' });
    }
  },

  deleteEvent: async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.userId;

    try {
      const result = await eventModel.deleteEvent(eventId, userId);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Event not found or no permission' });
      }

      res.json({ message: 'Event deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error while deleting event' });
    }
  }
};
