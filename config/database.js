const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dental_clinic_db', 'root', 'MySQLpass', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;