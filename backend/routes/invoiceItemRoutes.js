const express = require('express');
const router = express.Router();
const invoiceItemController = require('../controllers/invoiceItemController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Invoice Items
 *     description: Invoice line items
 * /invoice-items:
 *   get:
 *     summary: List invoice items
 *     tags: [Invoice Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice items returned
 *   post:
 *     summary: Create an invoice item
 *     tags: [Invoice Items]
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
 *         description: Invoice item created
 * /invoice-items/{id}:
 *   get:
 *     summary: Get an invoice item by ID
 *     tags: [Invoice Items]
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
 *         description: Invoice item returned
 *   put:
 *     summary: Update an invoice item
 *     tags: [Invoice Items]
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
 *         description: Invoice item updated
 *   delete:
 *     summary: Delete an invoice item
 *     tags: [Invoice Items]
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
 *         description: Invoice item deleted
 */
router.use(authMiddleware);

router.get('/', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), 
  invoiceItemController.getAllInvoiceItems
);


router.get('/:id', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), 
  invoiceItemController.getInvoiceItemById
);


router.post('/', 
  roleMiddleware('ADMIN', 'RECEPTIONIST'), 
  invoiceItemController.createInvoiceItem
);


router.put('/:id', 
  roleMiddleware('ADMIN', 'RECEPTIONIST'), 
  invoiceItemController.updateInvoiceItem
);


router.delete('/:id', 
  roleMiddleware('ADMIN', 'RECEPTIONIST'), 
  invoiceItemController.deleteInvoiceItem
);

module.exports = router;
