const express = require('express');
const router = express.Router();
const patientTreatmentController = require('../controllers/PatientTreatmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Patient Treatments
 *     description: Treatments assigned to patients
 * /patient-treatments/appointment/{appointmentId}:
 *   get:
 *     summary: Get patient treatments by appointment
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment treatments returned
 * /patient-treatments/patient/{patientId}:
 *   get:
 *     summary: Get treatments for a patient
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient treatments returned
 * /patient-treatments/dentist/{dentistId}:
 *   get:
 *     summary: Get patient treatments for a dentist
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dentist patient treatments returned
 * /patient-treatments:
 *   get:
 *     summary: List patient treatments
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient treatments returned
 *   post:
 *     summary: Create a patient treatment
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Patient treatment created
 * /patient-treatments/{id}:
 *   get:
 *     summary: Get a patient treatment by ID
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient treatment returned
 *   put:
 *     summary: Update a patient treatment
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Patient treatment updated
 *   delete:
 *     summary: Delete a patient treatment
 *     tags: [Patient Treatments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient treatment deleted
 */
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
