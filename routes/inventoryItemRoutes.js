const express = require('express');
const router = express.Router();
const inventoryItemController = require('../controllers/InventoryItemController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/low-stock', roleMiddleware('ADMIN', 'RECEPTIONIST'), inventoryItemController.getLowStock);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), inventoryItemController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), inventoryItemController.getById);

router.post('/', roleMiddleware('ADMIN'), inventoryItemController.create);
router.put('/:id', roleMiddleware('ADMIN'), inventoryItemController.update);
router.delete('/:id', roleMiddleware('ADMIN'), inventoryItemController.delete);

module.exports = router;
