const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  invoice_item_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  treatment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'invoice_items',
  timestamps: false
});

module.exports = InvoiceItem;