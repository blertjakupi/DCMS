const express = require('express');
const router = express.Router();
const workScheduleController = require('../controllers/WorkScheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), workScheduleController.getScheduleByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), workScheduleController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), workScheduleController.getById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), workScheduleController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), workScheduleController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), workScheduleController.delete);

module.exports = router;
