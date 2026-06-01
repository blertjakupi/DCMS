const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment tracking
 * /payments/sum:
 *   get:
 *     summary: Sum payments by date range
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payment sum returned
 * /payments:
 *   get:
 *     summary: List payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments returned
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
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
 *         description: Payment created
 * /payments/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     tags: [Payments]
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
 *         description: Payment returned
 *   put:
 *     summary: Update a payment
 *     tags: [Payments]
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
 *         description: Payment updated
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payments]
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
 *         description: Payment deleted
 */
router.use(authMiddleware);

router.get('/sum', 
  roleMiddleware('ADMIN', 'RECEPTIONIST'), 
  paymentController.sumByDateRange
);

router.get('/', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), 
  paymentController.getAllPayments
);

router.get('/:id', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'DOCTOR'), 
  paymentController.getPaymentById
);

router.post('/', 
  roleMiddleware('ADMIN', 'RECEPTIONIST', 'PATIENT'), 
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
