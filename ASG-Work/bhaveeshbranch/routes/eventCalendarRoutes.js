const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventCalendarController');
const validateEvent = require('../validators/eventValidator');
const verifyToken = require('../middleware/authMiddleware');

// CRUD routes
router.post('/', verifyToken,validateEvent, EventController.createEvent);
router.get('/', verifyToken, validateEvent,EventController.getAllEventsForUser);
router.put('/:id', verifyToken, EventController.updateEvent);
router.delete('/:id', verifyToken, EventController.deleteEvent);

module.exports = router;
