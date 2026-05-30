const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/count', roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT', 'DENTIST'), appointmentController.countByDateAndStatus);
router.get('/dentist/:dentistId/availability', roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT'), appointmentController.getAvailability);
router.get('/patient/:patientId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT'), appointmentController.getAppointmentsByPatient);
router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), appointmentController.getAppointmentsByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), appointmentController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), appointmentController.getById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT'), appointmentController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), appointmentController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT'), appointmentController.delete);

module.exports = router;
