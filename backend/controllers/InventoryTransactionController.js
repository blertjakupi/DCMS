const {
  InventoryTransaction,
  InventoryItem,
  sequelize
} = require('../models');

const VALID_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];

const getStockStatus = (quantity, minimumStock) => {
  if (Number(quantity || 0) <= 0) return 'Out of Stock';
  if (Number(quantity || 0) <= Number(minimumStock || 0)) return 'Low Stock';
  return 'Active';
};

const getIncludeOptions = () => [
  {
    model: InventoryItem,
    attributes: ['item_id', 'item_name', 'unit', 'quantity_in_stock', 'minimum_stock', 'status']
  }
];

const updateItemStock = async (item, quantity, transaction) => {
  await item.update({
    quantity_in_stock: quantity,
    status: getStockStatus(quantity, item.minimum_stock)
  }, { transaction });
};

const inventoryTransactionController = {
  getAll: async (req, res) => {
    try {
      const transactions = await InventoryTransaction.findAll({
        include: getIncludeOptions(),
        order: [['transaction_date', 'DESC'], ['transaction_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Transaksionet e inventarit u moren me sukses.',
        data: transactions
      });
    } catch (error) {
      console.error('GET ALL INVENTORY TRANSACTIONS ERROR:', error);
      return res.status(500).json({ message: 'Gabim i brendshem.' });
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
      return res.status(500).json({ message: 'Gabim i brendshem.' });
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
        message: 'Transaksionet u moren me sukses.',
        data: transactions
      });
    } catch (error) {
      console.error('GET BY ITEM ERROR:', error);
      return res.status(500).json({ message: 'Gabim i brendshem.' });
    }
  },

  create: async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
      const { transaction_type, quantity, transaction_date, notes, item_id } = req.body;
      const parsedQuantity = Number(quantity);

      if (!transaction_type || quantity === undefined || quantity === null || !transaction_date || !item_id) {
        await dbTransaction.rollback();
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojne: transaction_type, quantity, transaction_date, item_id.'
        });
      }

      if (!VALID_TYPES.includes(transaction_type)) {
        await dbTransaction.rollback();
        return res.status(400).json({
          message: `Lloji i transaksionit duhet te jete nje nga: ${VALID_TYPES.join(', ')}.`
        });
      }

      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0 || (transaction_type !== 'ADJUSTMENT' && parsedQuantity === 0)) {
        await dbTransaction.rollback();
        return res.status(400).json({
          message: 'Sasia duhet te jete numer i plote pozitiv. Adjustment mund te jete edhe 0.'
        });
      }

      const item = await InventoryItem.findOne({
        where: { item_id, is_deleted: false },
        transaction: dbTransaction
      });
      if (!item) {
        await dbTransaction.rollback();
        return res.status(404).json({ message: 'Artikulli i inventarit nuk ekziston.' });
      }

      let newStock;
      if (transaction_type === 'IN') {
        newStock = item.quantity_in_stock + parsedQuantity;
      } else if (transaction_type === 'OUT') {
        newStock = item.quantity_in_stock - parsedQuantity;
        if (newStock < 0) {
          await dbTransaction.rollback();
          return res.status(400).json({
            message: `Stoku i pamjaftueshem. Stoku aktual: ${item.quantity_in_stock}, sasia e kerkuar: ${parsedQuantity}.`
          });
        }
      } else {
        newStock = parsedQuantity;
      }

      const newTransaction = await InventoryTransaction.create({
        transaction_type,
        quantity: parsedQuantity,
        transaction_date,
        notes: notes || null,
        item_id
      }, { transaction: dbTransaction });

      await updateItemStock(item, newStock, dbTransaction);

      const result = await InventoryTransaction.findOne({
        where: { transaction_id: newTransaction.transaction_id },
        include: getIncludeOptions(),
        transaction: dbTransaction
      });

      await dbTransaction.commit();

      return res.status(201).json({
        message: 'Transaksioni u krijua me sukses.',
        data: result
      });
    } catch (error) {
      await dbTransaction.rollback();
      console.error('CREATE INVENTORY TRANSACTION ERROR:', error);
      return res.status(500).json({ message: 'Gabim i brendshem gjate krijimit te transaksionit.' });
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
        message: 'Transaksioni u perditesua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('UPDATE INVENTORY TRANSACTION ERROR:', error);
      return res.status(500).json({ message: 'Gabim i brendshem.' });
    }
  },

  delete: async (req, res) => {
    return res.status(400).json({
      message: 'Transaksionet e inventarit nuk fshihen. Krijo nje ADJUSTMENT per korrigjim stoku.'
    });
  }
};

module.exports = inventoryTransactionController;
