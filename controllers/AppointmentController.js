const { Op } = require('sequelize');
const {
  Appointment,
  Patient,
  Dentist
} = require('../models');

const allowedStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];

const appointmentController = {
  getAll: async (req, res) => {
    try {
      const appointments = await Appointment.findAll({
        where: {
          status: { [Op.ne]: 'Cancelled' }
        },
        include: [
          {
            model: Patient,
            attributes: ['patient_id', 'first_name', 'last_name']
          },
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name']
          }
        ],
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']]
      });

      return res.status(200).json({
        message: 'Terminet u morën me sukses.',
        data: appointments
      });
    } catch (error) {
      console.error('GET ALL APPOINTMENTS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së termineve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findOne({
        where: { appointment_id: id },
        include: [
          {
            model: Patient,
            attributes: ['patient_id', 'first_name', 'last_name']
          },
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name']
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          message: 'Termini nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Termini u mor me sukses.',
        data: appointment
      });
    } catch (error) {
      console.error('GET APPOINTMENT BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së terminit.'
      });
    }
  },

  getAppointmentsByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findOne({
        where: {
          patient_id: patientId,
          is_deleted: false
        }
      });

      if (!patient) {
        return res.status(404).json({
          message: 'Pacienti nuk u gjet.'
        });
      }

      const userRoles = Array.isArray(req.user.roles)
        ? req.user.roles.map(r => r.toUpperCase())
        : [];

      if (!userRoles.includes('ADMIN') && !userRoles.includes('RECEPTIONIST')) {
        const ownPatient = await Patient.findOne({
          where: {
            user_id: req.user.user_id,
            is_deleted: false
          }
        });

        if (!ownPatient || ownPatient.patient_id !== parseInt(patientId)) {
          return res.status(403).json({
            message: 'Nuk keni akses për të parë terminet e këtij pacienti.'
          });
        }
      }

      const appointments = await Appointment.findAll({
        where: {
          patient_id: patientId,
          status: { [Op.ne]: 'Cancelled' }
        },
        include: [
          {
            model: Patient,
            attributes: ['patient_id', 'first_name', 'last_name']
          },
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name']
          }
        ],
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']]
      });

      return res.status(200).json({
        message: 'Terminet e pacientit u morën me sukses.',
        data: appointments
      });
    } catch (error) {
      console.error('GET APPOINTMENTS BY PATIENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së termineve të pacientit.'
      });
    }
  },

  getAppointmentsByDentist: async (req, res) => {
    try {
      const { dentistId } = req.params;

      const dentist = await Dentist.findOne({
        where: {
          dentist_id: dentistId,
          is_deleted: false
        }
      });

      if (!dentist) {
        return res.status(404).json({
          message: 'Dentisti nuk u gjet.'
        });
      }

      const userRoles = Array.isArray(req.user.roles)
        ? req.user.roles.map(r => r.toUpperCase())
        : [];

      if (!userRoles.includes('ADMIN') && !userRoles.includes('RECEPTIONIST')) {
        const ownDentist = await Dentist.findOne({
          where: {
            user_id: req.user.user_id,
            is_deleted: false
          }
        });

        if (!ownDentist || ownDentist.dentist_id !== parseInt(dentistId)) {
          return res.status(403).json({
            message: 'Nuk keni akses për të parë terminet e këtij dentisti.'
          });
        }
      }

      const appointments = await Appointment.findAll({
        where: {
          dentist_id: dentistId,
          status: { [Op.ne]: 'Cancelled' }
        },
        include: [
          {
            model: Patient,
            attributes: ['patient_id', 'first_name', 'last_name']
          },
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name']
          }
        ],
        order: [['appointment_date', 'DESC'], ['appointment_time', 'DESC']]
      });

      return res.status(200).json({
        message: 'Terminet e dentistit u morën me sukses.',
        data: appointments
      });
    } catch (error) {
      console.error('GET APPOINTMENTS BY DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së termineve të dentistit.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const {
        patient_id,
        dentist_id,
        appointment_date,
        appointment_time,
        duration,
        notes,
        status
      } = req.body;

      if (!patient_id || !dentist_id || !appointment_date || !appointment_time || !duration) {
        return res.status(400).json({
          message: 'patient_id, dentist_id, appointment_date, appointment_time dhe duration janë të detyrueshme.'
        });
      }

      if (duration <= 0) {
        return res.status(400).json({
          message: 'duration duhet të jetë më e madhe se 0.'
        });
      }

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: `Statusi nuk është valid. Vlerat e lejuara: ${allowedStatuses.join(', ')}`
        });
      }

      const patient = await Patient.findOne({
        where: {
          patient_id,
          is_deleted: false,
          status: 'Active'
        }
      });

      if (!patient) {
        return res.status(404).json({
          message: 'Pacienti nuk u gjet ose nuk është aktiv.'
        });
      }

      const dentist = await Dentist.findOne({
        where: {
          dentist_id,
          is_deleted: false,
          status: 'Active'
        }
      });

      if (!dentist) {
        return res.status(404).json({
          message: 'Dentisti nuk u gjet ose nuk është aktiv.'
        });
      }

      const conflictingAppointment = await Appointment.findOne({
        where: {
          dentist_id,
          appointment_date,
          appointment_time,
          status: { [Op.ne]: 'Cancelled' }
        }
      });

      if (conflictingAppointment) {
        return res.status(409).json({
          message: 'Dentisti ka tashmë një termin të caktuar në këtë datë dhe orë.'
        });
      }

      const newAppointment = await Appointment.create({
        patient_id,
        dentist_id,
        appointment_date,
        appointment_time,
        duration,
        notes: notes || null,
        status: status || 'Scheduled'
      });

      const createdAppointment = await Appointment.findOne({
        where: { appointment_id: newAppointment.appointment_id },
        include: [
          {
            model: Patient,
            attributes: ['patient_id', 'first_name', 'last_name']
          },
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name']
          }
        ]
      });

      return res.status(201).json({
        message: 'Termini u krijua me sukses.',
        data: createdAppointment
      });
    } catch (error) {
      console.error('CREATE APPOINTMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të terminit.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        patient_id,
        dentist_id,
        appointment_date,
        appointment_time,
        duration,
        notes,
        status
      } = req.body;

      const appointment = await Appointment.findOne({
        where: { appointment_id: id }
      });

      if (!appointment) {
        return res.status(404).json({
          message: 'Termini nuk u gjet.'
        });
      }

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: `Statusi nuk është valid. Vlerat e lejuara: ${allowedStatuses.join(', ')}`
        });
      }

      if (duration !== undefined && duration <= 0) {
        return res.status(400).json({
          message: 'duration duhet të jetë më e madhe se 0.'
        });
      }

      if (patient_id) {
        const patient = await Patient.findOne({
          where: {
            patient_id,
            is_deleted: false,
            status: 'Active'
          }
        });

        if (!patient) {
          return res.status(404).json({
            message: 'Pacienti nuk u gjet ose nuk është aktiv.'
          });
        }
      }

      if (dentist_id) {
        const dentist = await Dentist.findOne({
          where: {
            dentist_id,
            is_deleted: false,
            status: 'Active'
          }
        });

        if (!dentist) {
          return res.status(404).json({
            message: 'Dentisti nuk u gjet ose nuk është aktiv.'
          });
        }
      }

      const effectiveDentistId = dentist_id || appointment.dentist_id;
      const effectiveDate = appointment_date || appointment.appointment_date;
      const effectiveTime = appointment_time || appointment.appointment_time;

      if (dentist_id || appointment_date || appointment_time) {
        const conflictingAppointment = await Appointment.findOne({
          where: {
            dentist_id: effectiveDentistId,
            appointment_date: effectiveDate,
            appointment_time: effectiveTime,
            appointment_id: { [Op.ne]: id },
            status: { [Op.ne]: 'Cancelled' }
          }
        });

        if (conflictingAppointment) {
          return res.status(409).json({
            message: 'Dentisti ka tashmë një termin të caktuar në këtë datë dhe orë.'
          });
        }
      }

      const updateData = {};
      if (patient_id) updateData.patient_id = patient_id;
      if (dentist_id) updateData.dentist_id = dentist_id;
      if (appointment_date) updateData.appointment_date = appointment_date;
      if (appointment_time) updateData.appointment_time = appointment_time;
      if (duration) updateData.duration = duration;
      if (notes !== undefined) updateData.notes = notes;
      if (status) updateData.status = status;

      await appointment.update(updateData);

      const updatedAppointment = await Appointment.findOne({
        where: { appointment_id: id },
        include: [
          {
            model: Patient,
            attributes: ['patient_id', 'first_name', 'last_name']
          },
          {
            model: Dentist,
            attributes: ['dentist_id', 'first_name', 'last_name']
          }
        ]
      });

      return res.status(200).json({
        message: 'Termini u përditësua me sukses.',
        data: updatedAppointment
      });
    } catch (error) {
      console.error('UPDATE APPOINTMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të terminit.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findOne({
        where: {
          appointment_id: id,
          status: { [Op.ne]: 'Cancelled' }
        }
      });

      if (!appointment) {
        return res.status(404).json({
          message: 'Termini nuk u gjet.'
        });
      }

      await appointment.update({ status: 'Cancelled' });

      return res.status(200).json({
        message: 'Termini u anulua me sukses.'
      });
    } catch (error) {
      console.error('DELETE APPOINTMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë anulimit të terminit.'
      });
    }
  }
};

module.exports = appointmentController;
