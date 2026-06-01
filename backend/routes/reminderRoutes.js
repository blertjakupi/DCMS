const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/ReminderController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Reminders
 *     description: Appointment reminder management
 * /reminders/appointment/{appointmentId}:
 *   get:
 *     summary: Get reminders for an appointment
 *     tags: [Reminders]
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
 *         description: Appointment reminders returned
 * /reminders/summary:
 *   get:
 *     summary: Get reminder summary
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder summary returned
 * /reminders:
 *   get:
 *     summary: List reminders
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminders returned
 *   post:
 *     summary: Create a reminder
 *     tags: [Reminders]
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
 *         description: Reminder created
 * /reminders/{id}:
 *   get:
 *     summary: Get a reminder by ID
 *     tags: [Reminders]
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
 *         description: Reminder returned
 *   put:
 *     summary: Update a reminder
 *     tags: [Reminders]
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
 *         description: Reminder updated
 *   delete:
 *     summary: Delete a reminder
 *     tags: [Reminders]
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
 *         description: Reminder deleted
 */
router.use(authMiddleware);

router.get('/appointment/:appointmentId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getByAppointment);
router.get('/summary', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getSummary);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), reminderController.getById);

router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), reminderController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), reminderController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), reminderController.delete);

module.exports = router;
