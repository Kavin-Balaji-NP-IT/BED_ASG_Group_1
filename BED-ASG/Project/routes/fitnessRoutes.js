const express = require('express');
const router = express.Router();
const fitnessController = require('../controllers/fitnesscontroller');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Debug middleware for fitness routes
router.use((req, res, next) => {
  console.log(`🏃‍♂️ Fitness route handler: ${req.method} ${req.path}`);
  console.log(`👤 User ID: ${req.user?.userId}`);
  next();
});

// IMPORTANT: More specific routes must come BEFORE general ones
// Vitals CRUD routes (must come before the general '/' route)
router.get('/vitals', fitnessController.getVitalsRecords);
router.get('/vitals/:id', fitnessController.getVitalsRecordById);
router.post('/vitals', fitnessController.createVitalsRecord);
router.put('/vitals/:id', fitnessController.updateVitalsRecord);
router.delete('/vitals/:id', fitnessController.deleteVitalsRecord);

// Main dashboard data route - this should come AFTER the /vitals routes
router.get('/', fitnessController.getFitnessData);

// Legacy route for backward compatibility - also after /vitals routes
router.get('/:userId', (req, res) => {
  console.log(`⚠️ Legacy route accessed with userId: ${req.params.userId}`);
  console.log(`🔄 Redirecting to main fitness data for authenticated user: ${req.user.userId}`);
  // Always use authenticated user ID, ignore the URL parameter
  fitnessController.getFitnessData(req, res);
});

module.exports = router;