const express = require('express');
const router = express.Router();
const dentistController = require('../controllers/DentistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Dentists
 *     description: Dentist profiles and dashboard data
 * /dentists/{id}/patients:
 *   get:
 *     summary: Get patients assigned to a dentist
 *     tags: [Dentists]
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
 *         description: Dentist patients returned
 * /dentists/dashboard:
 *   get:
 *     summary: Get dentist dashboard data
 *     tags: [Dentists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data returned
 * /dentists/me:
 *   get:
 *     summary: Get the authenticated dentist profile
 *     tags: [Dentists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dentist profile returned
 * /dentists/count:
 *   get:
 *     summary: Count active dentists
 *     tags: [Dentists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active dentist count returned
 * /dentists:
 *   get:
 *     summary: List dentists
 *     tags: [Dentists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dentists returned
 *   post:
 *     summary: Create a dentist
 *     tags: [Dentists]
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
 *         description: Dentist created
 * /dentists/{id}:
 *   get:
 *     summary: Get a dentist by ID
 *     tags: [Dentists]
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
 *         description: Dentist returned
 *   put:
 *     summary: Update a dentist
 *     tags: [Dentists]
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
 *         description: Dentist updated
 *   delete:
 *     summary: Delete a dentist
 *     tags: [Dentists]
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
 *         description: Dentist deleted
 */
router.use(authMiddleware);

router.get('/:id/patients', roleMiddleware('DENTIST'), dentistController.getPatientsByDentist);
router.get('/dashboard', roleMiddleware('DENTIST'), dentistController.getDashboard);
router.get('/me', roleMiddleware('DENTIST'), dentistController.getMe);
router.get('/count', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), dentistController.countActive);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentistController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), dentistController.getById);
router.post('/', roleMiddleware('ADMIN'), dentistController.create);
router.put('/:id', roleMiddleware('ADMIN'), dentistController.update);
router.delete('/:id', roleMiddleware('ADMIN'), dentistController.delete);

module.exports = router;
