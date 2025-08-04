const Joi = require("joi");

const medicationSchema = Joi.object({
  Name: Joi.string().min(1).max(100).required().messages({
    "string.base": "Medication name must be a string",
    "string.empty": "Medication name cannot be empty",
    "string.max": "Medication name must not exceed 100 characters",
    "any.required": "Medication name is required",
  }),
  Dosage: Joi.string().min(1).max(50).required().messages({
    "string.base": "Dosage must be a string",
    "string.empty": "Dosage cannot be empty",
    "string.max": "Dosage must not exceed 50 characters",
    "any.required": "Dosage is required",
  }),
  Frequency: Joi.string().min(1).max(50).required().messages({
    "string.base": "Frequency must be a string",
    "string.empty": "Frequency cannot be empty",
    "string.max": "Frequency must not exceed 50 characters",
    "any.required": "Frequency is required",
  }),
  StartDate: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),
  EndDate: Joi.date().optional().allow(null).messages({
    "date.base": "End date must be a valid date",
  }),
  Notes: Joi.string().max(500).optional().allow("").messages({
    "string.base": "Notes must be a string",
    "string.max": "Notes must not exceed 500 characters",
  }),
});

const trackingSchema = Joi.object({
  MedicationID: Joi.number().positive().required().messages({
    "number.base": "Medication ID must be a number",
    "number.positive": "Medication ID must be positive",
    "any.required": "Medication ID is required",
  }),
  TakenDate: Joi.date().optional().messages({
    "date.base": "Taken date must be a valid date",
  }),
  TakenTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional().messages({
    "string.pattern.base": "Taken time must be in HH:MM or HH:MM:SS format",
  }),
  Taken: Joi.boolean().required().messages({
    "boolean.base": "Taken status must be true or false",
    "any.required": "Taken status is required",
  }),
});

function validateMedication(req, res, next) {
  const { error } = medicationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

function validateMedicationId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid Medication ID. ID must be a positive number" });
  }
  next();
}

function validateTracking(req, res, next) {
  const { error } = trackingSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }
  next();
}

module.exports = {
  validateMedication,
  validateMedicationId,
  validateTracking,
};