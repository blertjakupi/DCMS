const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserClaim = sequelize.define('UserClaim', {
  claim_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  claim_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  claim_value: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'user_claims',
  timestamps: false
});

module.exports = UserClaim;

