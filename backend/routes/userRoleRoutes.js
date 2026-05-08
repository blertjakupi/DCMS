const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/UserRoleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');


router.use(authMiddleware);


router.get('/', roleMiddleware('ADMIN'), userRoleController.getAll);
router.post('/', roleMiddleware('ADMIN'), userRoleController.assign);
router.delete('/', roleMiddleware('ADMIN'), userRoleController.remove);


router.get('/user/:userId', (req, res, next) => {
  const targetUserId = parseInt(req.params.userId);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }
  const isSelf = req.user.user_id === targetUserId;
  const isAdmin = req.user.roles.some(r => r.toUpperCase() === 'ADMIN');
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
}, userRoleController.getRolesByUser);


router.put('/user/:userId', roleMiddleware('ADMIN'), userRoleController.updateUserRoles);

module.exports = router;
