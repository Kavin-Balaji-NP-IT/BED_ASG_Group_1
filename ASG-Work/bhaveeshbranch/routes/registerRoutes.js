const express = require('express');
const router = express.Router();
const RegisterController = require('../controllers/RegisterController');
const validateRegister = require('../validators/registerValidator');

router.post('/', validateRegister, RegisterController.register);

module.exports = router;
