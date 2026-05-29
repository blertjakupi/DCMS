const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  Dentist,
  Appointment,
  Patient,
  DentalRecord,
  Treatment
} = require('../models');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = ['Active', 'Inactive'];
const DENTIST_ROLE_NORMALIZED_NAME = 'DENTIST';

const dentistController = {
  getAll: async (req, res) => {
    try {
      const dentists = await Dentist.findAll({
        where: { is_deleted: false },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ],
        order: [['dentist_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Dentistët u morën me sukses.',
        data: dentists
      });
    } catch (error) {
      console.error('GET ALL DENTISTS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së dentistëve.'
      });
    }
  },
  getMe: async (req, res) => {
    try {
      const dentist = await Dentist.findOne({
        where: { user_id: req.user.user_id, is_deleted: false },
        include: [{ model: User, attributes: ['first_name', 'last_name', 'email'] }]
      });
      if (!dentist) return res.status(404).json({ message: 'Dentist profile not found' });
      res.json(dentist);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  countActive: async (req, res) => {
    try {
      const count = await Dentist.count({
        where: {
          status: 'Active',
          is_deleted: false
        }
      });
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const dentist = await Dentist.findOne({
        where: {
          dentist_id: id,
          is_deleted: false
        },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ]
      });

      if (!dentist) {
        return res.status(404).json({
          message: 'Dentisti nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Dentisti u mor me sukses.',
        data: dentist
      });
    } catch (error) {
      console.error('GET DENTIST BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së dentistit.'
      });
    }
  },

  create: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const {
        first_name,
        last_name,
        email,
        password,
        phone_number,
        birth_date,
        phone,
        specialization,
        status
      } = req.body;

      if (!first_name || !last_name || !email || !password) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'first_name, last_name, email dhe password janë të detyrueshme.'
        });
      }

      if (!emailRegex.test(email)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Email nuk është në format valid.'
        });
      }

      if (password.length < 8) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Password duhet të ketë të paktën 8 karaktere.'
        });
      }

      if (status && !allowedStatuses.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Statusi nuk është valid.'
        });
      }

      const existingUser = await User.findOne({
        where: { email },
        transaction
      });

      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Email ekziston tashmë.'
        });
      }

      const dentistRole = await Role.findOne({
        where: { normalized_name: DENTIST_ROLE_NORMALIZED_NAME },
        transaction
      });

      if (!dentistRole) {
        await transaction.rollback();
        return res.status(500).json({
          message: `Roli '${DENTIST_ROLE_NORMALIZED_NAME}' nuk u gjet në databazë.`
        });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newUser = await User.create(
        {
          first_name,
          last_name,
          email,
          password_hash,
          phone_number: phone_number || null,
          status: status || 'Active',
          is_deleted: false,
          access_failed_count: 0,
          lockout_enabled: false,
          role_id: dentistRole.role_id  
        },
        { transaction }
      );
      
      const newDentist = await Dentist.create(
        {
          user_id: newUser.user_id,
          first_name,
          last_name,
          birth_date: birth_date || null,
          phone: phone || phone_number || null,
          email,
          specialization: specialization || null,
          status: status || 'Active',
          is_deleted: false
        },
        { transaction }
      );

      await transaction.commit();

      const createdDentist = await Dentist.findOne({
        where: { dentist_id: newDentist.dentist_id },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ]
      });

      return res.status(201).json({
        message: 'Dentisti u krijua me sukses.',
        data: createdDentist
      });
    } catch (error) {
      await transaction.rollback();
      console.error('CREATE DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të dentistit.'
      });
    }
  },

  update: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        birth_date,
        phone,
        email,
        specialization,
        status
      } = req.body;

      const dentist = await Dentist.findOne({
        where: {
          dentist_id: id,
          is_deleted: false
        },
        transaction
      });

      if (!dentist) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Dentisti nuk u gjet.'
        });
      }

      if (email) {
        if (!emailRegex.test(email)) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Email nuk është në format valid.'
          });
        }

        if (email !== dentist.email) {
          const existingUser = await User.findOne({
            where: {
              email,
              user_id: { [Op.ne]: dentist.user_id }
            },
            transaction
          });

          if (existingUser) {
            await transaction.rollback();
            return res.status(400).json({
              message: 'Email ekziston tashmë.'
            });
          }
        }
      }

      if (status && !allowedStatuses.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Statusi nuk është valid.'
        });
      }

      const dentistUpdateData = {};
      if (first_name) dentistUpdateData.first_name = first_name;
      if (last_name) dentistUpdateData.last_name = last_name;
      if (birth_date !== undefined) dentistUpdateData.birth_date = birth_date;
      if (phone !== undefined) dentistUpdateData.phone = phone;
      if (email) dentistUpdateData.email = email;
      if (specialization !== undefined) dentistUpdateData.specialization = specialization;
      if (status) dentistUpdateData.status = status;

      await dentist.update(dentistUpdateData, { transaction });

      const userUpdateData = {};
      if (first_name) userUpdateData.first_name = first_name;
      if (last_name) userUpdateData.last_name = last_name;
      if (email) userUpdateData.email = email;
      if (status) userUpdateData.status = status;

      if (Object.keys(userUpdateData).length > 0) {
        await User.update(userUpdateData, {
          where: { user_id: dentist.user_id },
          transaction
        });
      }

      await transaction.commit();

      const updatedDentist = await Dentist.findOne({
        where: { dentist_id: id },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ]
      });

      return res.status(200).json({
        message: 'Dentisti u përditësua me sukses.',
        data: updatedDentist
      });
    } catch (error) {
      await transaction.rollback();
      console.error('UPDATE DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të dentistit.'
      });
    }
  },

  delete: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const dentist = await Dentist.findOne({
        where: {
          dentist_id: id,
          is_deleted: false
        },
        transaction
      });

      if (!dentist) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Dentisti nuk u gjet.'
        });
      }

      await dentist.update(
        {
          is_deleted: true,
          status: 'Inactive'
        },
        { transaction }
      );

      await User.update(
        {
          is_deleted: true,
          status: 'Inactive'
        },
        {
          where: { user_id: dentist.user_id },
          transaction
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: 'Dentisti u fshi me sukses.'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('DELETE DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë fshirjes së dentistit.'
      });
    }
  },

  getDashboard: async (req, res) => {
    try {
      const dentist = await Dentist.findOne({
        where: { user_id: req.user.user_id, is_deleted: false },
        include: [{ model: User, attributes: ['first_name', 'last_name', 'email'] }]
      });
      if (!dentist) return res.status(404).json({ message: 'Dentist not found' });

      const dentistId = dentist.dentist_id;
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const todayApps = await Appointment.findAll({
        where: {
          dentist_id: dentistId,
          appointment_date: today,
          status: { [Op.ne]: 'Cancelled' }
        },
        include: [
          { model: Patient, attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Treatment, attributes: ['treatment_id', 'treatment_name', 'average_duration'] }
        ],
        order: [['appointment_time', 'ASC']]
      });

      const patientsSeenCount = await Appointment.count({
        where: { dentist_id: dentistId, status: { [Op.ne]: 'Cancelled' } },
        distinct: true,
        col: 'patient_id'
      });

      const pendingRecordsCount = await DentalRecord.count({
        where: { dentist_id: dentistId }
      });

      const nextAppointment = await Appointment.findOne({
        where: {
          dentist_id: dentistId,
          status: { [Op.notIn]: ['Cancelled', 'Completed', 'No-Show'] },
          [Op.or]: [
            { appointment_date: { [Op.gt]: today } },
            { appointment_date: today, appointment_time: { [Op.gte]: currentTime } }
          ]
        },
        include: [
          { model: Patient, attributes: ['patient_id', 'first_name', 'last_name'] },
          { model: Treatment, attributes: ['treatment_id', 'treatment_name', 'average_duration'] }
        ],
        order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
      });

      const schedule = todayApps.map(a => ({
        appointment_id: a.appointment_id,
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time.slice(0, 5),
        patient_id: a.patient_id,
        patient_name: `${a.Patient?.first_name || ''} ${a.Patient?.last_name || ''}`.trim(),
        treatment_id: a.treatment_id,
        treatment_name: a.Treatment?.treatment_name || `Treatment #${a.treatment_id}`,
        duration: a.duration,
        status: a.status
      }));

      const queueApps = todayApps.filter(a => a.appointment_time >= currentTime && a.status === 'Scheduled');
      const queue = queueApps.map(a => {
        const patientName = `${a.Patient?.first_name || ''} ${a.Patient?.last_name || ''}`.trim() || 'Unknown';
        const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const apptDateTime = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const diffMinutes = Math.round((apptDateTime - now) / 60000);
        return {
          initials,
          name: patientName,
          location: diffMinutes > 5 ? 'Waiting Room' : 'Ready',
          time: a.appointment_time.slice(0, 5),
          wait: diffMinutes > 0 ? `${diffMinutes}m wait` : 'Now',
          active: a.appointment_time === queueApps[0]?.appointment_time
        };
      });

      const recentRecords = await DentalRecord.findAll({
        where: { dentist_id: dentistId },
        include: [{ model: Patient, attributes: ['first_name', 'last_name'] }],
        order: [['record_date', 'DESC']],
        limit: 3
      });
      const recent = recentRecords.map(rec => {
        const patientName = rec.Patient ? `${rec.Patient.first_name} ${rec.Patient.last_name}` : `Patient #${rec.patient_id}`;
        const initials = patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return {
          record_id: rec.record_id,
          initials,
          name: patientName,
          lastVisit: rec.record_date,
          treatment: rec.condition || 'Exam',
          color: 'bg-tertiary-container/30 text-on-tertiary-container'
        };
      });

      res.json({
        dentist: {
          first_name: dentist.first_name,
          last_name: dentist.last_name
        },
        stats: {
          todayAppointmentsCount: todayApps.length,
          patientsSeenCount,
          pendingRecordsCount
        },
        nextAppointment: nextAppointment ? {
          time: nextAppointment.appointment_time.slice(0, 5),
          date: nextAppointment.appointment_date,
          appointment_id: nextAppointment.appointment_id,
          treatment_name: nextAppointment.Treatment?.treatment_name || `Treatment #${nextAppointment.treatment_id}`,
          patient_name: `${nextAppointment.Patient?.first_name || ''} ${nextAppointment.Patient?.last_name || ''}`.trim(),
          minutes_to_go: Math.max(0, Math.ceil((new Date(`${nextAppointment.appointment_date}T${nextAppointment.appointment_time}`) - now) / 60000))
        } : null,
        schedule,
        queue,
        recentRecords: recent
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getPatientsByDentist: async (req, res) => {
    try {
      const dentistId = req.params.id;
      const appointments = await Appointment.findAll({
        where: { dentist_id: dentistId, status: { [Op.ne]: 'Cancelled' } },
        include: [{ model: Patient, where: { is_deleted: false } }],
        attributes: []
      });
      const uniquePatients = [];
      const seen = new Set();
      appointments.forEach(app => {
        if (app.Patient && !seen.has(app.Patient.patient_id)) {
          seen.add(app.Patient.patient_id);
          uniquePatients.push(app.Patient);
        }
      });
      res.json({ data: uniquePatients });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = dentistController;
