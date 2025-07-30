const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');
const verifyToken = require('../middleware/authMiddleware');
const validateAppointment = require('../validators/validateAppointment');
const validateUpdateAppointment = require('../validators/validateUpdateAppointment');

router.post('/', verifyToken, validateAppointment,AppointmentController.create);
router.get('/', verifyToken, AppointmentController.getUserAppointments);
router.put('/:appointmentId', verifyToken, validateUpdateAppointment,AppointmentController.update);
router.delete('/:appointmentId', verifyToken, AppointmentController.delete);

module.exports = router;
