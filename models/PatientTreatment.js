const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PatientTreatment = sequelize.define('PatientTreatment', {
  patient_treatment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  treatment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  treatment_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dentist_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'patient_treatments',
  timestamps: false
});

module.exports = PatientTreatment;