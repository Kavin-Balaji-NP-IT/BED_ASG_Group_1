const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

// Get user info by id
router.get('/:id', verifyToken, UserController.getUserById);

// Update user info
router.put('/:id', verifyToken, UserController.updateUser);

// Delete user
router.delete('/:id', verifyToken, UserController.deleteUser);

module.exports = router;
