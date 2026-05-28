const { Op } = require('sequelize');
const { InventoryItem, sequelize } = require('../models');

const VALID_UNITS = ['Box', 'Piece', 'Bottle', 'Pack', 'Tube', 'Vial', 'Syringe'];
const VALID_CATEGORIES = ['Consumable', 'Instrument', 'Medication', 'Equipment'];

const getStockStatus = (quantity, minimumStock) => {
  if (Number(quantity || 0) <= 0) return 'Out of Stock';
  if (Number(quantity || 0) <= Number(minimumStock || 0)) return 'Low Stock';
  return 'Active';
};

const inventoryItemController = {
  getAll: async (req, res) => {
    try {
      const items = await InventoryItem.findAll({
        where: { is_deleted: false },
        order: [['item_name', 'ASC'], ['item_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Artikujt e inventarit u morën me sukses.',
        data: items
      });
    } catch (error) {
      console.error('GET ALL INVENTORY ITEMS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së artikujve të inventarit.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await InventoryItem.findOne({
        where: { item_id: id, is_deleted: false }
      });

      if (!item) {
        return res.status(404).json({ message: 'Artikulli i inventarit nuk u gjet.' });
      }

      return res.status(200).json({
        message: 'Artikulli i inventarit u mor me sukses.',
        data: item
      });
    } catch (error) {
      console.error('GET INVENTORY ITEM BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së artikullit të inventarit.'
      });
    }
  },

  getLowStock: async (req, res) => {
    try {
      const items = await InventoryItem.findAll({
        where: {
          is_deleted: false,
          [Op.and]: sequelize.where(
            sequelize.col('quantity_in_stock'),
            Op.lte,
            sequelize.col('minimum_stock')
          )
        },
        order: [['quantity_in_stock', 'ASC'], ['item_name', 'ASC']]
      });

      return res.status(200).json({
        message: 'Artikujt me stok të ulët u morën me sukses.',
        data: items
      });
    } catch (error) {
      console.error('GET LOW STOCK ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const {
        item_name,
        description,
        unit,
        minimum_stock,
        expiry_date,
        category,
        supplier_name,
        batch_lot_number,
        purchase_price,
        storage_location,
        barcode
      } = req.body;

      if (!item_name || !unit) {
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojne: item_name, unit.'
        });
      }

      if (!VALID_UNITS.includes(unit)) {
        return res.status(400).json({
          message: `Unit duhet te jete nje nga: ${VALID_UNITS.join(', ')}.`
        });
      }

      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: `Category duhet te jete nje nga: ${VALID_CATEGORIES.join(', ')}.`
        });
      }

      if (minimum_stock !== undefined && minimum_stock !== null && minimum_stock < 0) {
        return res.status(400).json({
          message: 'Stoku minimal nuk mund të jetë negativ.'
        });
      }

      const existing = await InventoryItem.findOne({
        where: { item_name, is_deleted: false }
      });
      if (existing) {
        return res.status(409).json({
          message: 'Një artikull me këtë emër ekziston tashmë.'
        });
      }

      const newItem = await InventoryItem.create({
        item_name,
        description: description || null,
        category: category || null,
        supplier_name: supplier_name || null,
        batch_lot_number: batch_lot_number || null,
        purchase_price: purchase_price === '' || purchase_price === undefined ? null : purchase_price,
        storage_location: storage_location || null,
        barcode: barcode || null,
        quantity_in_stock: 0,
        unit,
        minimum_stock: minimum_stock || 0,
        expiry_date: expiry_date || null,
        status: getStockStatus(0, minimum_stock || 0),
        is_deleted: false
      });

      return res.status(201).json({
        message: 'Artikulli i inventarit u krijua me sukses.',
        data: newItem
      });
    } catch (error) {
      console.error('CREATE INVENTORY ITEM ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të artikullit të inventarit.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        item_name,
        description,
        unit,
        minimum_stock,
        expiry_date,
        status,
        category,
        supplier_name,
        batch_lot_number,
        purchase_price,
        storage_location,
        barcode
      } = req.body;

      const item = await InventoryItem.findOne({
        where: { item_id: id, is_deleted: false }
      });
      if (!item) {
        return res.status(404).json({ message: 'Artikulli i inventarit nuk u gjet.' });
      }

      if (minimum_stock !== undefined && minimum_stock !== null && minimum_stock < 0) {
        return res.status(400).json({
          message: 'Stoku minimal nuk mund të jetë negativ.'
        });
      }

      if (item_name && item_name !== item.item_name) {
        const existing = await InventoryItem.findOne({
          where: { item_name, is_deleted: false, item_id: { [Op.ne]: id } }
        });
        if (existing) {
          return res.status(409).json({
            message: 'Një artikull me këtë emër ekziston tashmë.'
          });
        }
      }

      const updateData = {};
      if (item_name) updateData.item_name = item_name;
      if (description !== undefined) updateData.description = description;
      if (unit) updateData.unit = unit;
      if (minimum_stock !== undefined && minimum_stock !== null) updateData.minimum_stock = minimum_stock;
      if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
      if (category !== undefined) updateData.category = category || null;
      if (supplier_name !== undefined) updateData.supplier_name = supplier_name || null;
      if (batch_lot_number !== undefined) updateData.batch_lot_number = batch_lot_number || null;
      if (purchase_price !== undefined) updateData.purchase_price = purchase_price === '' ? null : purchase_price;
      if (storage_location !== undefined) updateData.storage_location = storage_location || null;
      if (barcode !== undefined) updateData.barcode = barcode || null;
      if (status) updateData.status = status;
      if (minimum_stock !== undefined && minimum_stock !== null && !status) {
        updateData.status = getStockStatus(item.quantity_in_stock, minimum_stock);
      }

      await item.update(updateData);

      return res.status(200).json({
        message: 'Artikulli i inventarit u përditësua me sukses.',
        data: item
      });
    } catch (error) {
      console.error('UPDATE INVENTORY ITEM ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await InventoryItem.findOne({
        where: { item_id: id, is_deleted: false }
      });
      if (!item) {
        return res.status(404).json({ message: 'Artikulli i inventarit nuk u gjet.' });
      }

      await item.update({ is_deleted: true, status: 'Inactive' });

      return res.status(200).json({
        message: 'Artikulli i inventarit u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE INVENTORY ITEM ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  }
};

module.exports = inventoryItemController;
