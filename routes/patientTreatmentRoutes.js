const express = require('express');
const router = express.Router();
const patientTreatmentController = require('../controllers/PatientTreatmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/appointment/:appointmentId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), patientTreatmentController.getByAppointment);
router.get('/patient/:patientId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), patientTreatmentController.getByPatient);
router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), patientTreatmentController.getByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), patientTreatmentController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), patientTreatmentController.getById);

router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), patientTreatmentController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), patientTreatmentController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), patientTreatmentController.delete);

module.exports = router;
