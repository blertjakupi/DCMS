const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkSchedule = sequelize.define('WorkSchedule', {
  schedule_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  day: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  dentist_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'work_schedules',
  timestamps: false
});

module.exports = WorkSchedule;