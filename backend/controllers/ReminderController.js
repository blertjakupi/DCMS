const {
  Reminder,
  Appointment,
  Patient,
  Dentist,
  Treatment
} = require('../models');
const { Op } = require('sequelize');
const { syncRemindersForAppointments, APPOINTMENT_REMINDER_TYPE } = require('../services/reminderService');

const VALID_STATUSES = ['Pending', 'Sent', 'Failed'];

const toLocalDateOnly = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const getIncludeOptions = (appointmentWhere = {}) => [
  {
    model: Appointment,
    attributes: ['appointment_id', 'appointment_date', 'appointment_time', 'status'],
    where: appointmentWhere,
    required: Object.keys(appointmentWhere).length > 0,
    include: [
      {
        model: Dentist,
        attributes: ['dentist_id', 'first_name', 'last_name']
      },
      {
        model: Treatment,
        attributes: ['treatment_id', 'treatment_name']
      }
    ]
  },
  {
    model: Patient,
    attributes: ['patient_id', 'first_name', 'last_name']
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

      await syncRemindersForAppointments(appointmentWhere);

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

  getSummary: async (req, res) => {
    try {
      const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
      const now = new Date();
      const today = toLocalDateOnly(now);
      let appointmentWhere = {};

      if (userRole === 'DENTIST') {
        const dentist = await Dentist.findOne({ where: { user_id: req.user.user_id, is_deleted: false } });
        if (!dentist) return res.status(403).json({ message: 'Nuk keni akses.' });
        appointmentWhere.dentist_id = dentist.dentist_id;
      } else if (userRole === 'PATIENT') {
        const patient = await Patient.findOne({ where: { user_id: req.user.user_id, is_deleted: false } });
        if (!patient) return res.status(403).json({ message: 'Nuk keni akses.' });
        appointmentWhere.patient_id = patient.patient_id;
      } else if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
        return res.status(403).json({ message: 'Nuk keni akses.' });
      }

      await syncRemindersForAppointments(appointmentWhere);

      const dueReminders = await Reminder.findAll({
        where: {
          type: APPOINTMENT_REMINDER_TYPE,
          status: 'Pending',
          send_at: { [Op.lte]: now }
        },
        include: getIncludeOptions(appointmentWhere),
        order: [['send_at', 'ASC']]
      });

      const todayAppointments = await Appointment.findAll({
        where: {
          ...appointmentWhere,
          appointment_date: today,
          status: { [Op.in]: ['Scheduled', 'Completed', 'No-Show'] }
        },
        include: [
          { model: Patient, attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Dentist, attributes: ['dentist_id', 'first_name', 'last_name'] },
          { model: Treatment, attributes: ['treatment_id', 'treatment_name'] }
        ],
        order: [['appointment_time', 'ASC']]
      });

      return res.status(200).json({
        message: 'Përmbledhja e përkujtesave u mor me sukses.',
        data: {
          dueReminders,
          todayAppointmentCount: todayAppointments.length,
          todayAppointments,
          security: [
            {
              type: 'SECURITY_PASSWORD',
              title: 'Siguria e llogarisë',
              message: 'Ndrysho password-in periodikisht dhe mos e ndaj me persona të tjerë.'
            },
            {
              type: 'SECURITY_SESSION',
              title: 'Kontroll i aksesit',
              message: 'Nëse dyshon për qasje të paautorizuar, ndrysho password-in menjëherë.'
            }
          ]
        }
      });
    } catch (error) {
      console.error('GET REMINDER SUMMARY ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së përmbledhjes së përkujtesave.'
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
      const { reminder_type, type, scheduled_date, send_at, sent_date, status, appointment_id } = req.body;
      const reminderType = reminder_type || type;
      const scheduledDate = scheduled_date || send_at || sent_date;

      if (!reminderType || !appointment_id || !scheduledDate) {
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojnë: type, send_at, appointment_id.'
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
        type: reminderType,
        send_at: scheduledDate,
        sent_date: null,
        status: status || 'Pending',
        appointment_id,
        patient_id: appointment.patient_id
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
      const { reminder_type, type, scheduled_date, send_at, sent_date, status, appointment_id } = req.body;
      const reminderType = reminder_type || type;
      const scheduledDate = scheduled_date || send_at;

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
      if (reminderType) updateData.type = reminderType;
      if (scheduledDate !== undefined) updateData.send_at = scheduledDate;
      if (sent_date !== undefined) updateData.sent_date = sent_date;
      if (status) updateData.status = status;
      if (appointment_id) {
        const appointment = await Appointment.findByPk(appointment_id);
        updateData.appointment_id = appointment_id;
        updateData.patient_id = appointment.patient_id;
      }

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
