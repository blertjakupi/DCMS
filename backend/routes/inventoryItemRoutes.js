const express = require('express');
const router = express.Router();
const inventoryItemController = require('../controllers/InventoryItemController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Inventory Items
 *     description: Inventory item catalog
 * /inventory-items/low-stock:
 *   get:
 *     summary: List low-stock inventory items
 *     tags: [Inventory Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low-stock items returned
 * /inventory-items:
 *   get:
 *     summary: List inventory items
 *     tags: [Inventory Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory items returned
 *   post:
 *     summary: Create an inventory item
 *     tags: [Inventory Items]
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
 *         description: Inventory item created
 * /inventory-items/{id}:
 *   get:
 *     summary: Get an inventory item by ID
 *     tags: [Inventory Items]
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
 *         description: Inventory item returned
 *   put:
 *     summary: Update an inventory item
 *     tags: [Inventory Items]
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
 *         description: Inventory item updated
 *   delete:
 *     summary: Delete an inventory item
 *     tags: [Inventory Items]
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
 *         description: Inventory item deleted
 */
router.use(authMiddleware);

router.get('/low-stock', roleMiddleware('ADMIN', 'RECEPTIONIST'), inventoryItemController.getLowStock);
router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), inventoryItemController.getAll);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), inventoryItemController.getById);

router.post('/', roleMiddleware('ADMIN'), inventoryItemController.create);
router.put('/:id', roleMiddleware('ADMIN'), inventoryItemController.update);
router.delete('/:id', roleMiddleware('ADMIN'), inventoryItemController.delete);

module.exports = router;
