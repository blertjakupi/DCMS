const express = require('express');
const router = express.Router();
const inventoryTransactionController = require('../controllers/InventoryTransactionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Inventory Transactions
 *     description: Inventory stock movements
 * /inventory-transactions/item/{itemId}:
 *   get:
 *     summary: Get transactions for an inventory item
 *     tags: [Inventory Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item transactions returned
 * /inventory-transactions:
 *   get:
 *     summary: List inventory transactions
 *     tags: [Inventory Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory transactions returned
 *   post:
 *     summary: Create an inventory transaction
 *     tags: [Inventory Transactions]
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
 *         description: Inventory transaction created
 * /inventory-transactions/{id}:
 *   get:
 *     summary: Get an inventory transaction by ID
 *     tags: [Inventory Transactions]
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
 *         description: Inventory transaction returned
 *   put:
 *     summary: Update an inventory transaction
 *     tags: [Inventory Transactions]
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
 *         description: Inventory transaction updated
 *   delete:
 *     summary: Delete an inventory transaction
 *     tags: [Inventory Transactions]
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
 *         description: Inventory transaction deleted
 */
router.use(authMiddleware);

router.get('/item/:itemId', roleMiddleware('ADMIN'), inventoryTransactionController.getByItem);
router.get('/', roleMiddleware('ADMIN'), inventoryTransactionController.getAll);
router.get('/:id', roleMiddleware('ADMIN'), inventoryTransactionController.getById);

router.post('/', roleMiddleware('ADMIN'), inventoryTransactionController.create);
router.put('/:id', roleMiddleware('ADMIN'), inventoryTransactionController.update);
router.delete('/:id', roleMiddleware('ADMIN'), inventoryTransactionController.delete);

module.exports = router;
