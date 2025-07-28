const express = require('express');
const router = express.Router();    
const LoginController = require('./LoginController');
const validateLogin = require('./authValidator');

router.post('/', validateLogin, LoginController.login);

module.exports = router;