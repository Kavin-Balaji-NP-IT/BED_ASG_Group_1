const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware'); // path to your auth middleware
const medicationController = require('../controllers/medicationController');
const { validateMedication, validateMedicationId, validateTracking } = require('../middleware/medicationValidation');

router.use(authenticateToken); // All routes below require authentication

router.get('/medications', medicationController.getAllMedications);
router.get('/medications/today', medicationController.getTodayTracking);
router.get('/medications/:id', validateMedicationId, medicationController.getMedicationById);
router.post('/medications', validateMedication, medicationController.createMedication);
router.post('/medications/track', validateTracking, medicationController.trackMedication);
router.put('/medications/:id', validateMedicationId, validateMedication, medicationController.updateMedication);
router.delete('/medications/:id', validateMedicationId, medicationController.deleteMedication);

module.exports = router;
