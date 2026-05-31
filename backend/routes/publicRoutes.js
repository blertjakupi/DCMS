const express = require('express');
const router = express.Router();
const publicController = require('../controllers/PublicController');
const contactMessageController = require('../controllers/ContactMessageController');

router.get('/clinic', publicController.getClinicOverview);
router.post('/contact', contactMessageController.createPublic);

module.exports = router;
