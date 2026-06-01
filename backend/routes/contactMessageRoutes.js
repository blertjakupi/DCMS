const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/ContactMessageController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Contact Messages
 *     description: Public contact message administration
 * /contact-messages:
 *   get:
 *     summary: List contact messages
 *     tags: [Contact Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact messages returned
 * /contact-messages/{id}/read:
 *   put:
 *     summary: Mark a contact message as read
 *     tags: [Contact Messages]
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
 *         description: Contact message marked as read
 */
router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN'), contactMessageController.getAll);
router.put('/:id/read', roleMiddleware('ADMIN'), contactMessageController.markRead);

module.exports = router;
