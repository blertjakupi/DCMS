const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/patient/:patientId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT'), appointmentController.getAppointmentsByPatient);
router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), appointmentController.getAppointmentsByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), appointmentController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), appointmentController.getById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), appointmentController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), appointmentController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), appointmentController.delete);

module.exports = router;
