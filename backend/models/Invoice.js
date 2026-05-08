const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  invoice_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Unpaid'
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'invoices',
  timestamps: false
});

module.exports = Invoice;