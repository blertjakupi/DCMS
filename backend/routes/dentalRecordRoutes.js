const express = require('express');
const router = express.Router();
const dentalRecordController = require('../controllers/DentalRecordController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Dental Records
 *     description: Dental record management
 * /dental-records/appointment/{appointmentId}:
 *   get:
 *     summary: Get dental records by appointment
 *     tags: [Dental Records]
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
 *         description: Appointment dental records returned
 * /dental-records/patient/{patientId}:
 *   get:
 *     summary: Get dental records by patient
 *     tags: [Dental Records]
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
 *         description: Patient dental records returned
 * /dental-records/dentist/{dentistId}:
 *   get:
 *     summary: Get dental records by dentist
 *     tags: [Dental Records]
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
 *         description: Dentist dental records returned
 * /dental-records:
 *   get:
 *     summary: List dental records
 *     tags: [Dental Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dental records returned
 *   post:
 *     summary: Create a dental record
 *     tags: [Dental Records]
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
 *         description: Dental record created
 * /dental-records/{id}/download:
 *   get:
 *     summary: Download a dental record
 *     tags: [Dental Records]
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
 *         description: Dental record file returned
 * /dental-records/{id}:
 *   get:
 *     summary: Get a dental record by ID
 *     tags: [Dental Records]
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
 *         description: Dental record returned
 *   put:
 *     summary: Update a dental record
 *     tags: [Dental Records]
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
 *         description: Dental record updated
 *   delete:
 *     summary: Delete a dental record
 *     tags: [Dental Records]
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
 *         description: Dental record deleted
 */
router.use(authMiddleware);

router.get('/appointment/:appointmentId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.getByAppointment);
router.get('/patient/:patientId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.getByPatient);
router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.getByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), dentalRecordController.getAll);
router.get('/:id/download', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.download);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentalRecordController.getById);

router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentalRecordController.delete);

module.exports = router;
