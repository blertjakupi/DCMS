const express = require('express');
const router = express.Router();
const dentistController = require('../controllers/DentistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentistController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentistController.getById);
router.post('/', roleMiddleware('ADMIN'), dentistController.create);
router.put('/:id', roleMiddleware('ADMIN'), dentistController.update);
router.delete('/:id', roleMiddleware('ADMIN'), dentistController.delete);

module.exports = router;
