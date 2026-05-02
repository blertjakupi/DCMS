const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const invoiceController = require('../controllers/invoiceController');

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), invoiceController.getAllInvoices);
router.get('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), invoiceController.getInvoiceById);
router.post('/', roleMiddleware('ADMIN', 'RECEPTIONIST'), invoiceController.createInvoice);
router.put('/:id', roleMiddleware('ADMIN', 'RECEPTIONIST'), invoiceController.updateInvoice);
router.delete('/:id', roleMiddleware('ADMIN'), invoiceController.deleteInvoice);
router.post('/:id/recalculate', roleMiddleware('ADMIN', 'RECEPTIONIST'), invoiceController.recalculateTotal);

module.exports = router;