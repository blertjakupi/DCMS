const express = require('express');
const router = express.Router();
const patientController = require('../controllers/PatientController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Patients
 *     description: Patient records
 * /patients/count:
 *   get:
 *     summary: Count active patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active patient count returned
 * /patients/me:
 *   get:
 *     summary: Get the authenticated patient's profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile returned
 * /patients/my:
 *   get:
 *     summary: Get patients assigned to the authenticated dentist
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dentist patients returned
 * /patients:
 *   get:
 *     summary: List patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients returned
 *   post:
 *     summary: Create a patient
 *     tags: [Patients]
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
 *         description: Patient created
 * /patients/{id}:
 *   get:
 *     summary: Get a patient by ID
 *     tags: [Patients]
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
 *         description: Patient returned
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
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
 *         description: Patient updated
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
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
 *         description: Patient deleted
 */
router.use(authMiddleware);

router.get('/count', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.countActive);
router.get('/me', roleMiddleware('PATIENT'), patientController.getMe);
router.get('/my', roleMiddleware('DENTIST'), patientController.getMyPatients);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.getById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), patientController.update);
router.delete('/:id', roleMiddleware('ADMIN'), patientController.delete);

module.exports = router;
