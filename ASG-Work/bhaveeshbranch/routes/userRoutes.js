const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const verifyToken = require('../middleware/authMiddleware'); // protect routes

// Get user info by id
router.get('/:id', verifyToken, UserController.getUserById);

// Update user info
//router.put('/:id', verifyToken, UserController.updateUser);

// Delete user
// router.delete('/:id', verifyToken, UserController.deleteUser);

// allows the admin to change the password
router.put('/admin/change-password', verifyToken, UserController.adminChangePassword);

// Allows admin to delete a user
//router.delete('/admin/delete/:id', verifyToken, UserController.deleteUser);

// 🔐 Only admin should be allowed to delete a user
router.delete('/:username', verifyToken, UserController.deleteUserByUsername);

// This endpoint will be called by other services
router.get('/me', verifyToken, UserController.getCurrentUser);


module.exports = router;
