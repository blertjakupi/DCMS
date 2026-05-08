const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DentalRecord = sequelize.define('DentalRecord', {
  record_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tooth: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  condition: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  record_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dentist_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'dental_records',
  timestamps: false
});

module.exports = DentalRecord;