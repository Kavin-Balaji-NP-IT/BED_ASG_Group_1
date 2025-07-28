const express = require('express');
const router = express.Router();
const RegisterController = require('./RegisterController');
const validateRegister = require('./registerValidator');

router.post('/', validateRegister, RegisterController.register);

module.exports = router;
