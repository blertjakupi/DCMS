const {
  InventoryTransaction,
  InventoryItem
} = require('../models');

const VALID_TYPES = ['IN', 'OUT'];

const getIncludeOptions = () => [
  {
    model: InventoryItem,
    attributes: ['item_id', 'item_name', 'unit', 'quantity_in_stock']
  }
];

const inventoryTransactionController = {
  getAll: async (req, res) => {
    try {
      const transactions = await InventoryTransaction.findAll({
        include: getIncludeOptions(),
        order: [['transaction_date', 'DESC'], ['transaction_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Transaksionet e inventarit u morën me sukses.',
        data: transactions
      });
    } catch (error) {
      console.error('GET ALL INVENTORY TRANSACTIONS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së transaksioneve të inventarit.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await InventoryTransaction.findOne({
        where: { transaction_id: id },
        include: getIncludeOptions()
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaksioni nuk u gjet.' });
      }

      return res.status(200).json({
        message: 'Transaksioni u mor me sukses.',
        data: transaction
      });
    } catch (error) {
      console.error('GET INVENTORY TRANSACTION BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së transaksionit.'
      });
    }
  },

  getByItem: async (req, res) => {
    try {
      const { itemId } = req.params;

      const item = await InventoryItem.findOne({
        where: { item_id: itemId, is_deleted: false }
      });
      if (!item) {
        return res.status(404).json({ message: 'Artikulli i inventarit nuk u gjet.' });
      }

      const transactions = await InventoryTransaction.findAll({
        where: { item_id: itemId },
        include: getIncludeOptions(),
        order: [['transaction_date', 'DESC'], ['transaction_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Transaksionet u morën me sukses.',
        data: transactions
      });
    } catch (error) {
      console.error('GET BY ITEM ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const { transaction_type, quantity, transaction_date, notes, item_id } = req.body;

      if (!transaction_type || !quantity || !transaction_date || !item_id) {
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojnë: transaction_type, quantity, transaction_date, item_id.'
        });
      }

      if (!VALID_TYPES.includes(transaction_type)) {
        return res.status(400).json({
          message: `Lloji i transaksionit duhet të jetë një nga: ${VALID_TYPES.join(', ')}.`
        });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: 'Sasia duhet të jetë një numër i plotë pozitiv më i madh se 0.'
        });
      }

      const item = await InventoryItem.findOne({
        where: { item_id, is_deleted: false }
      });
      if (!item) {
        return res.status(404).json({ message: 'Artikulli i inventarit nuk ekziston ose është fshirë.' });
      }

      if (transaction_type === 'OUT') {
        if (item.quantity_in_stock - quantity < 0) {
          return res.status(400).json({
            message: `Stoku i pamjaftueshëm. Stoku aktual: ${item.quantity_in_stock}, sasia e kërkuar: ${quantity}.`
          });
        }
      }

      const newTransaction = await InventoryTransaction.create({
        transaction_type,
        quantity,
        transaction_date,
        notes: notes || null,
        item_id
      });

      // Update stock
      if (transaction_type === 'IN') {
        await item.update({ quantity_in_stock: item.quantity_in_stock + quantity });
      } else {
        await item.update({ quantity_in_stock: item.quantity_in_stock - quantity });
      }

      const result = await InventoryTransaction.findOne({
        where: { transaction_id: newTransaction.transaction_id },
        include: getIncludeOptions()
      });

      return res.status(201).json({
        message: 'Transaksioni u krijua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('CREATE INVENTORY TRANSACTION ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të transaksionit.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { transaction_date, notes } = req.body;

      const transaction = await InventoryTransaction.findByPk(id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaksioni nuk u gjet.' });
      }

      const updateData = {};
      if (transaction_date) updateData.transaction_date = transaction_date;
      if (notes !== undefined) updateData.notes = notes;

      await transaction.update(updateData);

      const result = await InventoryTransaction.findOne({
        where: { transaction_id: id },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Transaksioni u përditësua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('UPDATE INVENTORY TRANSACTION ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await InventoryTransaction.findByPk(id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaksioni nuk u gjet.' });
      }

      const item = await InventoryItem.findOne({
        where: { item_id: transaction.item_id, is_deleted: false }
      });

      if (item) {
        // Reverse the stock effect
        if (transaction.transaction_type === 'IN') {
          const newStock = item.quantity_in_stock - transaction.quantity;
          if (newStock < 0) {
            return res.status(400).json({
              message: `Nuk mund të fshihet transaksioni. Kthimi i stokut do të rezultonte në vlerë negative (${newStock}).`
            });
          }
          await item.update({ quantity_in_stock: newStock });
        } else if (transaction.transaction_type === 'OUT') {
          await item.update({ quantity_in_stock: item.quantity_in_stock + transaction.quantity });
        }
      }

      await transaction.destroy();

      return res.status(200).json({
        message: 'Transaksioni u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE INVENTORY TRANSACTION ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  }
};

module.exports = inventoryTransactionController;
