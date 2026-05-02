const express = require('express');
const router = express.Router();
const dentalRecordController = require('../controllers/DentalRecordController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/appointment/:appointmentId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.getByAppointment);
router.get('/patient/:patientId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.getByPatient);
router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.getByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), dentalRecordController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.getById);

router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.delete);

module.exports = router;
