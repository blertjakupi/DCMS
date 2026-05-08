const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DentistAvailability = sequelize.define('DentistAvailability', {

   availability_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
   },

   dentist_id: {
      type: DataTypes.INTEGER,
      allowNull: false
   },

   unavailable_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
   },

   start_time: {
      type: DataTypes.TIME,
      allowNull: true
   },

   end_time: {
      type: DataTypes.TIME,
      allowNull: true
   },

   reason: {
      type: DataTypes.STRING(255),
      allowNull: true
   },

   is_full_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
   }

}, {
   tableName: 'dentist_availability',
   timestamps: false
});

module.exports = DentistAvailability;