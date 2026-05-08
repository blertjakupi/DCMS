const express = require('express');
const router = express.Router();
const patientController = require('../controllers/PatientController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.getById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.update);
router.delete('/:id', roleMiddleware('ADMIN'), patientController.delete);

module.exports = router;
