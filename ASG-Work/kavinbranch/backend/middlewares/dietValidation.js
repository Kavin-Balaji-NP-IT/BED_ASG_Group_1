const Joi = require("joi"); // Import Joi for validation

// Validation schema for DietPlan (used for POST/PUT)
const dietPlanSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    "number.base": "User ID must be a number",
    "number.positive": "User ID must be a positive number",
    "any.required": "User ID is required",
  }),
  mealName: Joi.string().min(1).max(100).required().messages({
    "string.base": "Meal name must be a string",
    "string.empty": "Meal name cannot be empty",
    "string.max": "Meal name must not exceed 100 characters",
    "any.required": "Meal name is required",
  }),
  calories: Joi.number().positive().required().messages({
    "number.base": "Calories must be a number",
    "number.positive": "Calories must be a positive number",
    "any.required": "Calories are required",
  }),
  mealType: Joi.string().valid("breakfast", "lunch", "dinner", "snack").required().messages({
    "string.base": "Meal type must be a string",
    "any.only": "Meal type must be one of: breakfast, lunch, dinner, snack",
    "any.required": "Meal type is required",
  }),
  mealDate: Joi.date().required().messages({
    "date.base": "Meal date must be a valid date",
    "any.required": "Meal date is required",
  }),
  notes: Joi.string().max(255).optional().allow("").messages({
    "string.base": "Notes must be a string",
    "string.max": "Notes must not exceed 255 characters",
  }),
});

// Middleware to validate DietPlan data (for POST/PUT)
function validateDietPlan(req, res, next) {
  const { error } = dietPlanSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(", ");
    return res.status(400).json({ error: errorMessage });
  }

  next();
}

// Middleware to validate DietPlan ID from URL parameters
function validateDietPlanId(req, res, next) {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid DietPlan ID. ID must be a positive number" });
  }

  next();
}

module.exports = {
  validateDietPlan,
  validateDietPlanId,
};