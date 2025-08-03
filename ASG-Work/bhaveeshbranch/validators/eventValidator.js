const Joi = require('joi');

const eventSchema = Joi.object({
  eventTitle: Joi.string().min(3).max(255).required().messages({
    'string.empty': 'Event title is required',
    'string.min': 'Event title must be at least 3 characters long',
    'string.max': 'Event title cannot exceed 255 characters'
  }),
  eventDate: Joi.date().iso().required().messages({
    'date.base': 'Event date must be a valid date',
    'any.required': 'Event date is required',
  }),
  eventLocation: Joi.string().min(3).max(255).required().messages({
    'string.empty': 'Event location is required',
    'string.min': 'Event location must be at least 3 characters long',
    'string.max': 'Event location cannot exceed 255 characters'
  }),
  eventDescription: Joi.string().min(3).max(1000).required().messages({
    'string.empty': 'Event description is required',
    'string.min': 'Event description must be at least 3 characters long',
    'string.max': 'Event description cannot exceed 1000 characters'
  }),
});

function validateEvent(req, res, next) {
  const { error } = eventSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages });
  }

  next();
}

module.exports = validateEvent;
