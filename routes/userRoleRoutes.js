const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/UserRoleController');

router.get('/', userRoleController.getAll);
router.get('/user/:userId', userRoleController.getRolesByUser);
router.post('/', userRoleController.assign);
router.delete('/', userRoleController.remove);
router.put('/user/:userId', userRoleController.updateUserRoles);

module.exports = router;
