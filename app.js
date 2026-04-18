const express = require('express');
const { sequelize } = require('./models');

const app = express();
app.use(express.json());

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Models synchronized successfully.');
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });