const { sequelize, Invoice, Patient, Appointment, InvoiceItem, Payment, Treatment } = require('../models');
const { Op } = require('sequelize');

async function recalcInvoiceTotal(invoiceId) {
  const items = await InvoiceItem.findAll({
    where: { invoice_id: invoiceId },
    attributes: ['price', 'quantity']
  });
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1, 10)), 0);
  await Invoice.update({ total_amount: total }, { where: { invoice_id: invoiceId } });
  return total;
}

async function updateInvoiceStatus(invoiceId) {
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [{ model: Payment, attributes: ['amount'] }]
  });
  if (!invoice) return;
  const paidSum = invoice.Payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const total = parseFloat(invoice.total_amount);
  let status = 'Unpaid';
  if (paidSum >= total && total > 0) status = 'Paid';
  else if (paidSum > 0 && paidSum < total) status = 'Partially Paid';
  await invoice.update({ status });
}

exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patient_id, appointment_id } = req.query;
    
    const pageNum = parseInt(page, 10) || 1;
    let limitNum = parseInt(limit, 10) || 20;
    
    limitNum = Math.min(limitNum, 100); 

    const offset = (pageNum - 1) * limitNum;
    
    const where = {};
    if (status) where.status = status;
    if (appointment_id) where.appointment_id = appointment_id;

    // Patient security: if PATIENT role, force filter by their patient_id
    const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
    if (userRole === 'PATIENT') {
      const ownPatient = await Patient.findOne({
        where: { user_id: req.user.user_id, is_deleted: false }
      });
      if (!ownPatient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      where.patient_id = ownPatient.patient_id;
    } else {
      if (patient_id) where.patient_id = patient_id;
    }

    const invoices = await Invoice.findAndCountAll({
      where,
      include: [
        { model: Patient, attributes: ['patient_id', 'first_name', 'last_name'] },
        { model: Appointment, attributes: ['appointment_id', 'appointment_date', 'treatment_id'] },
        {
          model: InvoiceItem,
          include: [{ model: Treatment, attributes: ['treatment_id', 'treatment_name', 'price'] }]
        },
        { model: Payment, attributes: ['payment_id', 'amount', 'payment_date', 'payment_method', 'payment_status'] }
      ],
      limit: limitNum,
      offset: offset,
      order: [['invoice_date', 'DESC']]
    });

    res.json({
      total: invoices.count,
      page: pageNum,
      limit: limitNum,
      data: invoices.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Patient, attributes: ['patient_id', 'first_name', 'last_name', 'email'] },
        { model: Appointment, attributes: ['appointment_id', 'appointment_date'] },
        {
          model: InvoiceItem,
          include: [{ model: Treatment, attributes: ['treatment_id', 'treatment_name', 'price'] }]
        },
        { model: Payment, attributes: ['payment_id', 'amount', 'payment_date', 'payment_method', 'payment_status'] }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Patient security: check if patient is allowed to see this invoice
    const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
    if (userRole === 'PATIENT') {
      const ownPatient = await Patient.findOne({
        where: { user_id: req.user.user_id, is_deleted: false }
      });
      if (!ownPatient || invoice.patient_id !== ownPatient.patient_id) {
        return res.status(403).json({ message: 'Nuk keni akses në këtë faturë.' });
      }
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching invoice' });
  }
};


exports.createInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { patient_id, appointment_id, invoice_date } = req.body;


    const patient = await Patient.findByPk(patient_id, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const appointment = await Appointment.findByPk(appointment_id, { transaction });
    if (!appointment) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.patient_id !== parseInt(patient_id, 10)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Appointment does not belong to this patient' });
    }

    const existingInvoice = await Invoice.findOne({ where: { appointment_id }, transaction });
    if (existingInvoice) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invoice already exists for this appointment' });
    }

    const newInvoice = await Invoice.create({
      patient_id,
      appointment_id,
      invoice_date,
      total_amount: 0.00,
      status: 'Unpaid'
    }, { transaction });

    if (appointment.treatment_id) {
      const treatment = await Treatment.findByPk(appointment.treatment_id, { transaction });
      if (treatment) {
        await InvoiceItem.create({
          invoice_id: newInvoice.invoice_id,
          treatment_id: treatment.treatment_id,
          quantity: 1,
          price: treatment.price
        }, { transaction });

        const total = parseFloat(treatment.price || 0);
        await newInvoice.update({ total_amount: total, status: total > 0 ? 'Unpaid' : 'Paid' }, { transaction });
      }
    }

    await transaction.commit();
    const invoice = await Invoice.findByPk(newInvoice.invoice_id, {
      include: [
        { model: Patient, attributes: ['patient_id', 'first_name', 'last_name'] },
        { model: Appointment, attributes: ['appointment_id', 'appointment_date', 'treatment_id'] },
        { model: InvoiceItem, include: [{ model: Treatment, attributes: ['treatment_id', 'treatment_name', 'price'] }] }
      ]
    });

    res.status(201).json(invoice);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error creating invoice' });
  }
};


exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, invoice_date } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    
    if (status === 'Cancelled') {
      const paymentExists = await Payment.findOne({ where: { invoice_id: id } });
      if (paymentExists) {
        return res.status(400).json({ message: 'Cannot cancel invoice with existing payments' });
      }
    }

    await invoice.update({ status, invoice_date });
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating invoice' });
  }
};


exports.deleteInvoice = async (req, res) => {
  
  const t = await sequelize.transaction(); 

  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, { transaction: t });
    
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const paymentExists = await Payment.findOne({ where: { invoice_id: id }, transaction: t });
    if (paymentExists) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot delete invoice with existing payments' });
    }
    
    await InvoiceItem.destroy({ where: { invoice_id: id }, transaction: t });
    await invoice.destroy({ transaction: t });

    await t.commit(); 
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    await t.rollback(); 
    console.error(error);
    res.status(500).json({ message: 'Server error deleting invoice' });
  }
};

exports.recalculateTotal = async (req, res) => {
  try {

    const { id } = req.params;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        message: 'Invoice not found'
      });
    }

    const total = await recalcInvoiceTotal(id);

    await updateInvoiceStatus(id);

    return res.status(200).json({
      message: 'Invoice total recalculated successfully',
      total_amount: total
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: 'Server error recalculating invoice'
    });

  }
};
