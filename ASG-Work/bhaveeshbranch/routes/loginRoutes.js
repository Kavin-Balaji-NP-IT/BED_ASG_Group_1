const express = require('express');
const router = express.Router();
const LoginController = require('../controllers/LoginController');
const validateLogin = require('../validators/authValidator');

// router.post('/login', LoginController.login);

router.post('/', validateLogin, LoginController.login);


module.exports = router;