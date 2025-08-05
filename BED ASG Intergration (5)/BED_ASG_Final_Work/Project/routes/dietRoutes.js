const express = require('express');
const router = express.Router();
const authenticateToken = require('./middlewares/authMiddleware'); // path to your auth middleware
const dietController = require('./controllers/dietcontroller');
const { validateDietPlan, validateDietPlanId } = require('./middlewares/dietValidation');

router.use(authenticateToken); // All routes below require authentication

router.get('/dietplans', dietController.getAllDiets);
router.get('/dietplans/:id', validateDietPlanId, dietController.getDietById);
router.post('/dietplans', validateDietPlan, dietController.createDiet);
router.put('/dietplans/:id', validateDietPlanId, validateDietPlan, dietController.updateDiet);
router.delete('/dietplans/:id', validateDietPlanId, dietController.deleteDiet);

module.exports = router;
