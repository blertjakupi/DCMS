const express = require('express');
const router = express.Router();
const invoiceItemController = require('../controllers/invoiceItemController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

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