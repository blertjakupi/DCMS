const { sequelize, Payment, Invoice } = require('../models');


const updateInvoiceStatus = async (invoice_id, transaction) => {
  const invoice = await Invoice.findByPk(invoice_id, {
    include: [{ model: Payment, attributes: ['amount'] }],
    transaction
  });
  if (!invoice) return;

  const totalPaid = invoice.Payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalAmount = parseFloat(invoice.total_amount);
  
  let status = 'Unpaid';

  
  const roundedTotalPaid = Math.round(totalPaid * 100) / 100;
  const roundedTotalAmount = Math.round(totalAmount * 100) / 100;

  if (roundedTotalAmount <= 0) {
    status = 'Paid'; 
  } else if (roundedTotalPaid >= roundedTotalAmount) {
    status = 'Paid';
  } else if (roundedTotalPaid > 0) {
    status = 'Partially Paid';
  }

  await invoice.update({ status }, { transaction });
};
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id, {
      include: [{ model: Invoice, attributes: ['invoice_id', 'status', 'total_amount'] }]
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching payment' });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, invoice_id, payment_status, payment_method } = req.query;
    
    const pageNum = parseInt(page, 10) || 1;
    let limitNum = parseInt(limit, 10) || 20;
    limitNum = Math.min(limitNum, 100);
    const offset = (pageNum - 1) * limitNum;
    
    const where = {};
    if (invoice_id) where.invoice_id = invoice_id;
    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;
    
    const payments = await Payment.findAndCountAll({
      where,
      include: [{ model: Invoice, attributes: ['invoice_id', 'status', 'total_amount'] }],
      limit: limitNum,
      offset,
      order: [['payment_date', 'DESC']]
    });
    
    res.json({
      total: payments.count,
      page: pageNum,
      limit: limitNum,
      data: payments.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};


exports.createPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { invoice_id, amount, payment_date, payment_method, payment_status } = req.body;
    
    if (!invoice_id || !amount || !payment_date || !payment_method) {
      await t.rollback();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const invoice = await Invoice.findByPk(invoice_id, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (amount <= 0) {
    await t.rollback();
    return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    
    if (invoice.status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot add payment to a cancelled invoice' });
    }
    
    const newPayment = await Payment.create({
      invoice_id,
      amount,
      payment_date,
      payment_method,
      payment_status: payment_status || 'Completed'
    }, { transaction: t });
    
    await updateInvoiceStatus(invoice_id, t);
    
    await t.commit();
    res.status(201).json(newPayment);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { amount, payment_date, payment_method, payment_status } = req.body;
    
    const payment = await Payment.findByPk(id, {
      include: [{ model: Invoice, attributes: ['status'] }],
      transaction: t
    });


    if (!payment) {
      await t.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (amount <= 0) {
    await t.rollback();
    return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    
    
    if (payment.Invoice.status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot update payment on a cancelled invoice' });
    }
    
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (payment_date !== undefined) updateData.payment_date = payment_date;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    
    await payment.update(updateData, { transaction: t });
    await updateInvoiceStatus(payment.invoice_id, t);
    
    await t.commit();
    res.json(payment);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id, {
      include: [{ model: Invoice, attributes: ['status'] }],
      transaction: t
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    
    if (payment.Invoice.status === 'Cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot delete payment from a cancelled invoice' });
    }
    
    const invoice_id = payment.invoice_id;
    await payment.destroy({ transaction: t });
    
    await updateInvoiceStatus(invoice_id, t);
    
    await t.commit();
    res.json({ message: 'Payment deleted and status updated' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
};