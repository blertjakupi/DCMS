const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dentist = sequelize.define('Dentist', {
  dentist_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Active'
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'dentists',
  timestamps: false
});

module.exports = Dentist;