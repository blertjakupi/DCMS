const {
  Reminder,
  Appointment,
  Patient,
  Dentist
} = require('../models');

const VALID_STATUSES = ['Pending', 'Sent', 'Failed'];

const getIncludeOptions = (appointmentWhere = {}) => [
  {
    model: Appointment,
    attributes: ['appointment_id', 'appointment_date', 'appointment_time'],
    where: appointmentWhere,
    required: Object.keys(appointmentWhere).length > 0
  }
];

const reminderController = {
  getAll: async (req, res) => {
    try {
      const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
      let appointmentWhere = {};

      if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
        if (userRole === 'PATIENT') {
          const patient = await Patient.findOne({ where: { user_id: req.user.user_id, is_deleted: false } });
          if (!patient) return res.status(403).json({ message: 'Nuk keni akses.' });
          appointmentWhere.patient_id = patient.patient_id;
        } else if (userRole === 'DENTIST') {
          const dentist = await Dentist.findOne({ where: { user_id: req.user.user_id, is_deleted: false } });
          if (!dentist) return res.status(403).json({ message: 'Nuk keni akses.' });
          appointmentWhere.dentist_id = dentist.dentist_id;
        }
      }

      const reminders = await Reminder.findAll({
        include: getIncludeOptions(appointmentWhere),
        order: [['reminder_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Përkujtesat u morën me sukses.',
        data: reminders
      });
    } catch (error) {
      console.error('GET ALL REMINDERS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së përkujtesave.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const reminder = await Reminder.findOne({
        where: { reminder_id: id },
        include: getIncludeOptions()
      });

      if (!reminder) {
        return res.status(404).json({ message: 'Përkujtesa nuk u gjet.' });
      }

      return res.status(200).json({
        message: 'Përkujtesa u mor me sukses.',
        data: reminder
      });
    } catch (error) {
      console.error('GET REMINDER BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së përkujtesës.'
      });
    }
  },

  getByAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: 'Termini nuk u gjet.' });
      }

      const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
        if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
          if (userRole === 'PATIENT') {
            const patient = await Patient.findOne({ where: { user_id: req.user.user_id, is_deleted: false } });
            if (!patient || appointment.patient_id !== patient.patient_id) {
              return res.status(403).json({ message: 'Nuk keni akses.' });
            }
          } else if (userRole === 'DENTIST') {
            const dentist = await Dentist.findOne({ where: { user_id: req.user.user_id, is_deleted: false } });
            if (!dentist || appointment.dentist_id !== dentist.dentist_id) {
              return res.status(403).json({ message: 'Nuk keni akses.' });
            }
          }
        }

      const reminders = await Reminder.findAll({
        where: { appointment_id: appointmentId },
        include: getIncludeOptions(),
        order: [['reminder_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Përkujtesat u morën me sukses.',
        data: reminders
      });
    } catch (error) {
      console.error('GET BY APPOINTMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const { type, sent_date, status, appointment_id } = req.body;

      if (!type || !appointment_id) {
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojnë: type, appointment_id.'
        });
      }

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Statusi duhet të jetë një nga: ${VALID_STATUSES.join(', ')}.`
        });
      }

      const appointment = await Appointment.findByPk(appointment_id);
      if (!appointment) {
        return res.status(404).json({ message: 'Termini nuk ekziston.' });
      }

      const newReminder = await Reminder.create({
        type,
        sent_date: sent_date || null,
        status: status || 'Pending',
        appointment_id
      });

      const result = await Reminder.findOne({
        where: { reminder_id: newReminder.reminder_id },
        include: getIncludeOptions()
      });

      return res.status(201).json({
        message: 'Përkujtesa u krijua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('CREATE REMINDER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të përkujtesës.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { type, sent_date, status, appointment_id } = req.body;

      const reminder = await Reminder.findByPk(id);
      if (!reminder) {
        return res.status(404).json({ message: 'Përkujtesa nuk u gjet.' });
      }

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Statusi duhet të jetë një nga: ${VALID_STATUSES.join(', ')}.`
        });
      }

      if (appointment_id) {
        const appointment = await Appointment.findByPk(appointment_id);
        if (!appointment) {
          return res.status(404).json({ message: 'Termini nuk ekziston.' });
        }
      }

      const updateData = {};
      if (type) updateData.type = type;
      if (sent_date !== undefined) updateData.sent_date = sent_date;
      if (status) updateData.status = status;
      if (appointment_id) updateData.appointment_id = appointment_id;

      await reminder.update(updateData);

      const result = await Reminder.findOne({
        where: { reminder_id: id },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Përkujtesa u përditësua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('UPDATE REMINDER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const reminder = await Reminder.findByPk(id);
      if (!reminder) {
        return res.status(404).json({ message: 'Përkujtesa nuk u gjet.' });
      }

      await reminder.destroy();

      return res.status(200).json({
        message: 'Përkujtesa u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE REMINDER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  }
};

module.exports = reminderController;
