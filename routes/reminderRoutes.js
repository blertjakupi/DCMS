const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/ReminderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/appointment/:appointmentId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getByAppointment);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getById);

router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), reminderController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), reminderController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), reminderController.delete);

module.exports = router;
