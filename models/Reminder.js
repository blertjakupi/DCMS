const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reminder = sequelize.define('Reminder', {
  reminder_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sent_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pending'
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'reminders',
  timestamps: false
});

module.exports = Reminder;