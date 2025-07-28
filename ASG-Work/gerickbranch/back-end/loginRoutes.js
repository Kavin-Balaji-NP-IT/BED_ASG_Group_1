const express = require('express');
const router = express.Router();    
const LoginController = require('./loginController');
const validateLogin = require('../authValidator');

router.post('/', validateLogin, LoginController.login);

module.exports = router;