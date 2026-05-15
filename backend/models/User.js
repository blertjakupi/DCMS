const { DataTypes } = require("sequelize");
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email_confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lockout_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    access_failed_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'Active'
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    
    role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: 'roles',
        key: 'role_id'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
    },
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;