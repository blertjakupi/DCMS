const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/TreatmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Treatments
 *     description: Treatment catalog
 * /treatments:
 *   get:
 *     summary: List treatments
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Treatments returned
 *   post:
 *     summary: Create a treatment
 *     tags: [Treatments]
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
 *         description: Treatment created
 * /treatments/{id}:
 *   get:
 *     summary: Get a treatment by ID
 *     tags: [Treatments]
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
 *         description: Treatment returned
 *   put:
 *     summary: Update a treatment
 *     tags: [Treatments]
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
 *         description: Treatment updated
 *   delete:
 *     summary: Delete a treatment
 *     tags: [Treatments]
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
 *         description: Treatment deleted
 */
router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), treatmentController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DENTIST', 'PATIENT'), treatmentController.getById);
router.post('/', roleMiddleware('ADMIN', 'DENTIST'), treatmentController.create);
router.put('/:id', roleMiddleware('ADMIN' , 'DENTIST'), treatmentController.update);
router.delete('/:id', roleMiddleware('ADMIN', 'DENTIST'), treatmentController.delete);

module.exports = router;
