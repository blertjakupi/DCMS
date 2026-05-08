const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
    refresh_token_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', 
            key: 'user_id' 
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    token: {
        type: DataTypes.STRING(500), 
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'refresh_tokens',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['token']
        },
        {
            fields: ['user_id']
        },
        { fields: ['expires_at'] } 
    ]
});

module.exports = RefreshToken;
