const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const invoiceController = require('../controllers/invoiceController');

/**
 * @swagger
 * tags:
 *   - name: Invoices
 *     description: Invoice management
 * /invoices:
 *   get:
 *     summary: List invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices returned
 *   post:
 *     summary: Create an invoice
 *     tags: [Invoices]
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
 *         description: Invoice created
 * /invoices/{id}:
 *   get:
 *     summary: Get an invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice returned
 *   put:
 *     summary: Update an invoice
 *     tags: [Invoices]
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
 *         description: Invoice updated
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Invoices]
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
 *         description: Invoice deleted
 * /invoices/{id}/recalculate:
 *   post:
 *     summary: Recalculate an invoice total
 *     tags: [Invoices]
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
 *         description: Invoice total recalculated
 */
router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), invoiceController.getAllInvoices);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), invoiceController.getInvoiceById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), invoiceController.createInvoice);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), invoiceController.updateInvoice);
router.delete('/:id', roleMiddleware('ADMIN'), invoiceController.deleteInvoice);
router.post('/:id/recalculate', roleMiddleware('ADMIN', 'RECEPTIONIST'), invoiceController.recalculateTotal);

module.exports = router;
