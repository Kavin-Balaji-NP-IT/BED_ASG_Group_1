const Joi = require('joi');

const updateAppointmentSchema = Joi.object({
  appointmentDate: Joi.date().iso().optional().messages({
    'date.base': 'Appointment date must be a valid ISO date'
  }),
  description: Joi.string().max(255).optional().messages({
    'string.max': 'Description must not exceed 255 characters'
  })
}).or('appointmentDate', 'description'); // At least one must be provided


function validateUpdateAppointment(req, res, next) {
  const { error } = updateAppointmentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages });
  }
  next();
}


module.exports = validateUpdateAppointment;