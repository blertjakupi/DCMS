const express = require('express');
const router = express.Router();
const workScheduleController = require('../controllers/WorkScheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Work Schedules
 *     description: Dentist work schedules
 * /work-schedules/dentist/{dentistId}:
 *   get:
 *     summary: Get work schedules for a dentist
 *     tags: [Work Schedules]
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
 *         description: Dentist schedules returned
 * /work-schedules:
 *   get:
 *     summary: List work schedules
 *     tags: [Work Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work schedules returned
 *   post:
 *     summary: Create a work schedule
 *     tags: [Work Schedules]
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
 *         description: Work schedule created
 * /work-schedules/{id}:
 *   get:
 *     summary: Get a work schedule by ID
 *     tags: [Work Schedules]
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
 *         description: Work schedule returned
 *   put:
 *     summary: Update a work schedule
 *     tags: [Work Schedules]
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
 *         description: Work schedule updated
 *   delete:
 *     summary: Delete a work schedule
 *     tags: [Work Schedules]
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
 *         description: Work schedule deleted
 */
router.use(authMiddleware);

router.get('/dentist/:dentistId', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), workScheduleController.getScheduleByDentist);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), workScheduleController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST'), workScheduleController.getById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), workScheduleController.create);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), workScheduleController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), workScheduleController.delete);

module.exports = router;
