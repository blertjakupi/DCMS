const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserToken = sequelize.define('UserToken', {
    token_id: {
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
    login_provider: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    token_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    token_value: {
        type: DataTypes.STRING(500),
        allowNull: false
    }
}, {
    tableName: 'user_tokens',
    timestamps: false,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['token_value']   
        },
        {
        	unique: true, 
           fields: ['user_id', 'login_provider', 'token_name']
        }
    ]
});

module.exports = UserToken;
