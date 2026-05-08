const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), 
  paymentController.getAllPayments
);

router.get('/:id', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), 
  paymentController.getPaymentById
);

router.post('/', 
  roleMiddleware('ADMIN', 'RECEPTIONIST'), 
  paymentController.createPayment
);

router.put('/:id', 
  roleMiddleware('ADMIN', 'RECEPTIONIST'), 
  paymentController.updatePayment
);

router.delete('/:id', 
  roleMiddleware('ADMIN'), 
  paymentController.deletePayment
);

module.exports = router;