const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Appointments
 *     description: Appointment scheduling and lookup
 * /appointments/count:
 *   get:
 *     summary: Count appointments by date and status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment count returned
 * /appointments/dentist/{dentistId}/availability:
 *   get:
 *     summary: Get a dentist's appointment availability
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dentistId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Availability returned
 * /appointments/patient/{patientId}:
 *   get:
 *     summary: Get appointments for a patient
 *     tags: [Appointments]
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
 *         description: Patient appointments returned
 * /appointments/dentist/{dentistId}:
 *   get:
 *     summary: Get appointments for a dentist
 *     tags: [Appointments]
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
 *         description: Dentist appointments returned
 * /appointments:
 *   get:
 *     summary: List appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments returned
 *   post:
 *     summary: Create an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date
 *               appointment_time:
 *                 type: string
 *               duration:
 *                 type: integer
 *               dentist_id:
 *                 type: integer
 *               patient_id:
 *                 type: integer
 *               treatment_id:
 *                 type: integer
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created
 * /appointments/{id}:
 *   get:
 *     summary: Get an appointment by ID
 *     tags: [Appointments]
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
 *         description: Appointment returned
 *       404:
 *         description: Appointment not found
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
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
 *         description: Appointment updated
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
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
 *         description: Appointment deleted
 */
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
