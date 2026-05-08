const express = require('express');
const router = express.Router();
const inventoryTransactionController = require('../controllers/InventoryTransactionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/item/:itemId', roleMiddleware('ADMIN'), inventoryTransactionController.getByItem);
router.get('/', roleMiddleware('ADMIN'), inventoryTransactionController.getAll);
router.get('/:id', roleMiddleware('ADMIN'), inventoryTransactionController.getById);

router.post('/', roleMiddleware('ADMIN'), inventoryTransactionController.create);
router.put('/:id', roleMiddleware('ADMIN'), inventoryTransactionController.update);
router.delete('/:id', roleMiddleware('ADMIN'), inventoryTransactionController.delete);

module.exports = router;
