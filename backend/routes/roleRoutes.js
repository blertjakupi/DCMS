const express = require('express');
const router = express.Router();
const roleController = require('../controllers/RoleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/', roleController.create);
router.put('/:id', roleController.update);
router.delete('/:id', roleController.delete);
router.get('/:id/users', roleController.getUsersByRole);

module.exports = router;
