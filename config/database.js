const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dental_clinic_db', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;