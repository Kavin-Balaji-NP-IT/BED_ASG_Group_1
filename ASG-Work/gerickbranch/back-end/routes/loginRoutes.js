const express = require('express');
const router = express.Router();    
const LoginController = require('../controllers/loginController');
const validateLogin = require('../validators/authValidator.js') ;

router.post('/', validateLogin, LoginController.login);

module.exports = router;