const { Op } = require('sequelize');
const { InventoryItem, sequelize } = require('../models');

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
      const { item_name, description, quantity_in_stock, unit, minimum_stock, expiry_date, status } = req.body;

      if (!item_name || !unit || quantity_in_stock === undefined || quantity_in_stock === null) {
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojnë: item_name, unit, quantity_in_stock.'
        });
      }

      if (quantity_in_stock < 0) {
        return res.status(400).json({
          message: 'Sasia në stok nuk mund të jetë negative.'
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
        quantity_in_stock,
        unit,
        minimum_stock: minimum_stock || 0,
        expiry_date: expiry_date || null,
        status: status || 'Active',
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
      const { item_name, description, quantity_in_stock, unit, minimum_stock, expiry_date, status } = req.body;

      const item = await InventoryItem.findOne({
        where: { item_id: id, is_deleted: false }
      });
      if (!item) {
        return res.status(404).json({ message: 'Artikulli i inventarit nuk u gjet.' });
      }

      if (quantity_in_stock !== undefined && quantity_in_stock !== null && quantity_in_stock < 0) {
        return res.status(400).json({
          message: 'Sasia në stok nuk mund të jetë negative.'
        });
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
      if (quantity_in_stock !== undefined && quantity_in_stock !== null) updateData.quantity_in_stock = quantity_in_stock;
      if (unit) updateData.unit = unit;
      if (minimum_stock !== undefined && minimum_stock !== null) updateData.minimum_stock = minimum_stock;
      if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
      if (status) updateData.status = status;

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
