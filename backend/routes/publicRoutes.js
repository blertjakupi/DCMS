const express = require('express');
const router = express.Router();
const publicController = require('../controllers/PublicController');
const contactMessageController = require('../controllers/ContactMessageController');

/**
 * @swagger
 * tags:
 *   - name: Public
 *     description: Public clinic website endpoints
 * /public/clinic:
 *   get:
 *     summary: Get public clinic overview
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Clinic overview returned
 * /public/contact:
 *   post:
 *     summary: Submit a public contact message
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contact message submitted
 */
router.get('/clinic', publicController.getClinicOverview);
router.post('/contact', contactMessageController.createPublic);

module.exports = router;
