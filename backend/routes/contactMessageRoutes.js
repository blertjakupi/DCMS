const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/ContactMessageController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN'), contactMessageController.getAll);
router.put('/:id/read', roleMiddleware('ADMIN'), contactMessageController.markRead);

module.exports = router;
