
const AppointmentModel = require('../models/AppointmentModel');

const AppointmentController = {
  // Create new appointment
  create: async (req, res) => {
    try {
      const userId = req.user.userId; // from verifyToken middleware
      const { appointmentDate, description } = req.body;

      if (!appointmentDate) {
        return res.status(400).json({ message: 'Appointment date is required' });
      }

      const success = await AppointmentModel.create(userId, appointmentDate, description || '');

      if (success) {
        return res.status(201).json({ message: 'Appointment created successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to create appointment' });
      }
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get all appointments for the logged-in user
  getUserAppointments: async (req, res) => {
    try {
      const userId = req.user.userId;

      const appointments = await AppointmentModel.getByUser(userId);

      return res.status(200).json(appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Update appointment by ID, only if it belongs to logged-in user
  update: async (req, res) => {
    try {
      const userId = req.user.userId;
      const appointmentId = parseInt(req.params.appointmentId, 10);
      const { appointmentDate, description } = req.body;

      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }

      const success = await AppointmentModel.update(appointmentId, userId, appointmentDate, description || '');

      if (success) {
        return res.status(200).json({ message: 'Appointment updated successfully' });
      } else {
        return res.status(404).json({ message: 'Appointment not found or no permission' });
      }
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete appointment by ID, only if it belongs to logged-in user
  delete: async (req, res) => {
    try {
      const userId = req.user.userId;
      const appointmentId = parseInt(req.params.appointmentId, 10);

      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }

      const success = await AppointmentModel.delete(appointmentId, userId);

      if (success) {
        return res.status(200).json({ message: 'Appointment deleted successfully' });
      } else {
        return res.status(404).json({ message: 'Appointment not found or no permission' });
      }
    } catch (error) {
      console.error('Delete appointment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = AppointmentController;
