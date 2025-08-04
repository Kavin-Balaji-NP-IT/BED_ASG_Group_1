const AppointmentModel = require('../models/AppointmentModel');

const AppointmentController = {
  // Create new appointment
  create: async (req, res) => {
    try {
      const userId = req.user.userId; // from authenticateToken middleware
      const { appointmentDate, description } = req.body;

      console.log(`Creating appointment for user ${userId}:`, { appointmentDate, description });

      // Validate input
      if (!appointmentDate || !description) {
        return res.status(400).json({ 
          message: 'Appointment date and description are required' 
        });
      }

      // Validate that the appointment is in the future
      const appointmentDateTime = new Date(appointmentDate);
      const now = new Date();
      
      if (appointmentDateTime <= now) {
        return res.status(400).json({ 
          message: 'Appointment date must be in the future' 
        });
      }

      const success = await AppointmentModel.create(userId, appointmentDate, description);

      if (success) {
        console.log('✅ Appointment created successfully');
        return res.status(201).json({ message: 'Appointment created successfully' });
      } else {
        console.log('❌ Failed to create appointment');
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

      console.log(`Fetching appointments for user ${userId}`);

      const appointments = await AppointmentModel.getByUser(userId);

      console.log(`Found ${appointments.length} appointments for user ${userId}`);
      
      return res.status(200).json(appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get a specific appointment by ID
  getAppointmentById: async (req, res) => {
    try {
      const userId = req.user.userId;
      const appointmentId = parseInt(req.params.appointmentId, 10);

      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID' });
      }

      console.log(`Fetching appointment ${appointmentId} for user ${userId}`);

      const appointment = await AppointmentModel.getById(appointmentId, userId);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      return res.status(200).json(appointment);
    } catch (error) {
      console.error('Get appointment error:', error);
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

      // Validate that at least one field is provided
      if (!appointmentDate && !description) {
        return res.status(400).json({ 
          message: 'At least one field (appointmentDate or description) must be provided' 
        });
      }

      // If date is provided, validate that it's in the future
      if (appointmentDate) {
        const appointmentDateTime = new Date(appointmentDate);
        const now = new Date();
        
        if (appointmentDateTime <= now) {
          return res.status(400).json({ 
            message: 'Appointment date must be in the future' 
          });
        }
      }

      console.log(`Updating appointment ${appointmentId} for user ${userId}`);

      const success = await AppointmentModel.update(appointmentId, userId, appointmentDate, description);

      if (success) {
        console.log('✅ Appointment updated successfully');
        return res.status(200).json({ message: 'Appointment updated successfully' });
      } else {
        console.log('❌ Appointment not found or no permission');
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

      console.log(`Deleting appointment ${appointmentId} for user ${userId}`);

      const success = await AppointmentModel.delete(appointmentId, userId);

      if (success) {
        console.log('✅ Appointment deleted successfully');
        return res.status(200).json({ message: 'Appointment deleted successfully' });
      } else {
        console.log('❌ Appointment not found or no permission');
        return res.status(404).json({ message: 'Appointment not found or no permission' });
      }
    } catch (error) {
      console.error('Delete appointment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = AppointmentController;