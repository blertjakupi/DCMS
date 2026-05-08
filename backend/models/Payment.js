const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Completed'
  },
  invoice_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'payments',
  timestamps: false
});

module.exports = Payment;