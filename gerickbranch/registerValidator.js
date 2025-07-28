const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 3 characters long'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long'
  }),
  role: Joi.string().valid('user', 'admin').optional()
});

function validateRegister(req, res, next) {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ errors: messages });
  }

  next();
}

module.exports = validateRegister;
