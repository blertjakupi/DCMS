const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/TreatmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), treatmentController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), treatmentController.getById);
router.post('/', roleMiddleware('ADMIN', 'DENTIST'), treatmentController.create);
router.put('/:id', roleMiddleware('ADMIN' , 'DENTIST'), treatmentController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'DENTIST'), treatmentController.delete);

module.exports = router;
