const { sequelize, Invoice, InvoiceItem, Treatment, Payment } = require('../models');


const updateInvoiceTotal = async (invoice_id, transaction) => {
  const items = await InvoiceItem.findAll({ 
    where: { invoice_id }, 
    transaction 
  });
  
  const newTotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * parseInt(item.quantity));
  }, 0);

  await Invoice.update(
    { total_amount: newTotal }, 
    { where: { invoice_id }, transaction }
  );
};

exports.getAllInvoiceItems = async (req, res) => {
  try {
    const items = await InvoiceItem.findAll({
      include: [
        {
          model: Invoice
        },
        {
          model: Treatment
        }
      ]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({
      message: 'Server error'
    });
  }
};

exports.getInvoiceItemById = async (req, res) => {
  try {

    const { id } = req.params;

    const item = await InvoiceItem.findByPk(id, {
      include: [
        {
          model: Invoice
        },
        {
          model: Treatment
        }
      ]
    });
    
    if (!item) {
      return res.status(404).json({
        message: 'Invoice item not found'
      });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      message: 'Server error'
    });
  }
};

exports.createInvoiceItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { invoice_id, treatment_id, quantity, price } = req.body;

    const invoice = await Invoice.findByPk(invoice_id, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (!quantity || quantity <= 0) {
    await t.rollback();
    return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    if (!price || price < 0) {
    await t.rollback();
    return res.status(400).json({ message: 'Price must be >= 0' });
    }

    
    if (invoice.status !== 'Unpaid') {
      await t.rollback();
      return res.status(400).json({ message: `Cannot add items to a ${invoice.status} invoice` });
    }

    const newItem = await InvoiceItem.create({
      invoice_id,
      treatment_id,
      quantity,
      price
    }, { transaction: t });

    
    await updateInvoiceTotal(invoice_id, t);

    await t.commit();
    res.status(201).json(newItem);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateInvoiceItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;

    const item = await InvoiceItem.findByPk(id, { 
      include: [{ model: Invoice }],
      transaction: t 
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.Invoice.status !== 'Unpaid') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot update items on a locked invoice' });
    }

    await item.update({ quantity, price }, { transaction: t });
    await updateInvoiceTotal(item.invoice_id, t);

    await t.commit();
    res.json(item);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteInvoiceItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const item = await InvoiceItem.findByPk(id, { 
        include: [{ model: Invoice }],
        transaction: t 
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ message: 'Item not found' });
    }

    const invoiceId = item.invoice_id;

    if (item.Invoice.status !== 'Unpaid') {
        await t.rollback();
        return res.status(400).json({ message: 'Cannot delete items from a locked invoice' });
    }

    await item.destroy({ transaction: t });
    await updateInvoiceTotal(invoiceId, t);

    await t.commit();
    res.json({ message: 'Deleted and total updated' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Server error' });
  }
};