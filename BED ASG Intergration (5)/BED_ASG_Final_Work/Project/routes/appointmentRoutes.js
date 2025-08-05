const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');
const authenticateToken = require('../middleware/authMiddleware');

// Validation middleware for creating appointments
const validateAppointment = (req, res, next) => {
  const { appointmentDate, description } = req.body;
  
  if (!appointmentDate) {
    return res.status(400).json({ message: 'Appointment date is required' });
  }
  
  if (!description || description.trim().length === 0) {
    return res.status(400).json({ message: 'Description is required' });
  }
  
  if (description.length > 255) {
    return res.status(400).json({ message: 'Description must not exceed 255 characters' });
  }
  
  // Validate date format
  const appointmentDateTime = new Date(appointmentDate);
  if (isNaN(appointmentDateTime.getTime())) {
    return res.status(400).json({ message: 'Invalid appointment date format' });
  }
  
  // Check if date is in the future
  const now = new Date();
  if (appointmentDateTime <= now) {
    return res.status(400).json({ message: 'Appointment date must be in the future' });
  }
  
  next();
};

// Validation middleware for updating appointments
const validateUpdateAppointment = (req, res, next) => {
  const { appointmentDate, description } = req.body;
  
  // At least one field must be provided for update
  if (!appointmentDate && !description && description !== '') {
    return res.status(400).json({ 
      message: 'At least one field (appointmentDate or description) must be provided' 
    });
  }
  
  // Validate description length if provided
  if (description && description.length > 255) {
    return res.status(400).json({ message: 'Description must not exceed 255 characters' });
  }
  
  // If date is provided, validate it
  if (appointmentDate) {
    const appointmentDateTime = new Date(appointmentDate);
    
    if (isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({ message: 'Invalid appointment date format' });
    }
    
    const now = new Date();
    if (appointmentDateTime <= now) {
      return res.status(400).json({ message: 'Appointment date must be in the future' });
    }
  }
  
  next();
};

// Routes
router.post('/', authenticateToken, validateAppointment, AppointmentController.create);
router.get('/', authenticateToken, AppointmentController.getUserAppointments);
router.get('/:appointmentId', authenticateToken, AppointmentController.getAppointmentById);
router.put('/:appointmentId', authenticateToken, validateUpdateAppointment, AppointmentController.update);
router.delete('/:appointmentId', authenticateToken, AppointmentController.delete);

module.exports = router;