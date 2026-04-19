const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/TreatmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), treatmentController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), treatmentController.getById);
router.post('/', roleMiddleware('ADMIN'), treatmentController.create);
router.put('/:id', roleMiddleware('ADMIN'), treatmentController.update);
router.delete('/:id', roleMiddleware('ADMIN'), treatmentController.delete);

module.exports = router;
