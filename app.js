require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const authController = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoleRoutes = require('./routes/userRoleRoutes');
const patientRoutes = require('./routes/patientRoutes');
const dentistRoutes = require('./routes/dentistRoutes');
const workScheduleRoutes = require('./routes/workScheduleRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const patientTreatmentRoutes = require('./routes/patientTreatmentRoutes');
const invoiceItemRoutes = require('./routes/invoiceItemRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dentists', dentistRoutes);
app.use('/api/work-schedules', workScheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/patient-treatments', patientTreatmentRoutes);
app.use('/api/invoice-items', invoiceItemRoutes);
app.use('/api/invoices',invoiceRoutes)
app.use('/api/payments', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Models synchronized successfully.');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });