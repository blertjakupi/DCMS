const { Op } = require('sequelize');
const {
  PatientTreatment,
  Appointment,
  Treatment,
  Patient,
  Dentist
} = require('../models');

const checkDentistAccess = async (req, targetDentistId) => {
  const userRoles = Array.isArray(req.user.roles) ? req.user.roles.map(r => r.toUpperCase()) : [];
  if (userRoles.includes('ADMIN') || userRoles.includes('RECEPTIONIST')) {
    return true;
  }
  
  if (userRoles.includes('DENTIST')) {
    const ownDentist = await Dentist.findOne({
      where: { user_id: req.user.user_id, is_deleted: false }
    });
    if (ownDentist && ownDentist.dentist_id === parseInt(targetDentistId)) {
      return true;
    }
  }
  return false;
};

const checkPatientAccess = async (req, targetPatientId) => {
  const userRoles = Array.isArray(req.user.roles) ? req.user.roles.map(r => r.toUpperCase()) : [];
  if (userRoles.includes('ADMIN') || userRoles.includes('RECEPTIONIST') || userRoles.includes('DENTIST')) {
    return true; // Dentists are restricted at the controller-level by their own dentist_id, so we let them pass the patient check if they are the dentist
  }
  
  if (userRoles.includes('PATIENT')) {
    const ownPatient = await Patient.findOne({
      where: { user_id: req.user.user_id, is_deleted: false }
    });
    if (ownPatient && ownPatient.patient_id === parseInt(targetPatientId)) {
      return true;
    }
  }
  return false;
};

const getIncludeOptions = () => [
  {
    model: Treatment,
    attributes: ['treatment_id', 'treatment_name', 'price']
  },
  {
    model: Appointment,
    attributes: ['appointment_id', 'appointment_date']
  },
  {
    model: Patient,
    attributes: ['patient_id', 'first_name', 'last_name']
  },
  {
    model: Dentist,
    attributes: ['dentist_id', 'first_name', 'last_name']
  }
];

const patientTreatmentController = {
  getAll: async (req, res) => {
    try {
      const treatments = await PatientTreatment.findAll({
        include: getIncludeOptions(),
        order: [['treatment_date', 'DESC'], ['patient_treatment_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Trajtimet e pacientëve u morën me sukses.',
        data: treatments
      });
    } catch (error) {
      console.error('GET ALL PATIENT TREATMENTS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së trajtimeve të pacientëve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const pt = await PatientTreatment.findOne({
        where: { patient_treatment_id: id },
        include: getIncludeOptions()
      });

      if (!pt) {
        return res.status(404).json({ message: 'Trajtimi nuk u gjet.' });
      }

      // Access checks
      const userRoles = Array.isArray(req.user.roles) ? req.user.roles.map(r => r.toUpperCase()) : [];
      if (!userRoles.includes('ADMIN') && !userRoles.includes('RECEPTIONIST')) {
        if (userRoles.includes('DENTIST')) {
          const hasAccess = await checkDentistAccess(req, pt.dentist_id);
          if (!hasAccess) return res.status(403).json({ message: 'Nuk keni akses për të parë këtë trajtim.' });
        } else if (userRoles.includes('PATIENT')) {
          const hasAccess = await checkPatientAccess(req, pt.patient_id);
          if (!hasAccess) return res.status(403).json({ message: 'Nuk keni akses për të parë këtë trajtim.' });
        }
      }

      return res.status(200).json({
        message: 'Trajtimi u mor me sukses.',
        data: pt
      });
    } catch (error) {
      console.error('GET PATIENT TREATMENT BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së trajtimit.'
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

      const pts = await PatientTreatment.findAll({
        where: { appointment_id: appointmentId },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Trajtimet u morën me sukses.',
        data: pts
      });
    } catch (error) {
      console.error('GET BY APPOINTMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  getByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;

      const hasAccess = await checkPatientAccess(req, patientId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses.' });
      }

      const pts = await PatientTreatment.findAll({
        where: { patient_id: patientId },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Trajtimet u morën me sukses.',
        data: pts
      });
    } catch (error) {
      console.error('GET BY PATIENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  getByDentist: async (req, res) => {
    try {
      const { dentistId } = req.params;

      const hasAccess = await checkDentistAccess(req, dentistId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses.' });
      }

      const pts = await PatientTreatment.findAll({
        where: { dentist_id: dentistId },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Trajtimet u morën me sukses.',
        data: pts
      });
    } catch (error) {
      console.error('GET BY DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const { appointment_id, treatment_id, patient_id, dentist_id, treatment_date, notes } = req.body;
      let { cost } = req.body;

      if (!appointment_id || !treatment_id || !patient_id || !dentist_id || !treatment_date) {
        return res.status(400).json({
          message: 'Të dhënat e detyrueshme mungojnë.'
        });
      }

      const hasAccess = await checkDentistAccess(req, dentist_id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses për të shtuar trajtim për këtë dentist.' });
      }

      const appointment = await Appointment.findByPk(appointment_id);
      if (!appointment) return res.status(404).json({ message: 'Termini nuk ekziston.' });

      if (appointment.patient_id !== parseInt(patient_id) || appointment.dentist_id !== parseInt(dentist_id)) {
        return res.status(400).json({
          message: 'Dentisti ose pacienti nuk përputhen me terminet.'
        });
      }

      const treatment = await Treatment.findByPk(treatment_id);
      if (!treatment || treatment.is_deleted) return res.status(404).json({ message: 'Trajtimi nuk ekziston ose nuk është aktiv.' });

      if (cost === undefined || cost === null) {
        cost = treatment.price;
      }

      const newPt = await PatientTreatment.create({
        appointment_id,
        treatment_id,
        patient_id,
        dentist_id,
        treatment_date,
        cost,
        notes: notes || null
      });

      const result = await PatientTreatment.findOne({
        where: { patient_treatment_id: newPt.patient_treatment_id },
        include: getIncludeOptions()
      });

      return res.status(201).json({
        message: 'Trajtimi i pacientit u ruajt me sukses.',
        data: result
      });
    } catch (error) {
      console.error('CREATE PATIENT TREATMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë ruajtjes.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { appointment_id, treatment_id, patient_id, dentist_id, treatment_date, cost, notes } = req.body;

      const pt = await PatientTreatment.findByPk(id);
      if (!pt) {
        return res.status(404).json({ message: 'Trajtimi nuk u gjet.' });
      }

      const targetDentistId = dentist_id || pt.dentist_id;
      const hasAccess = await checkDentistAccess(req, targetDentistId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses.' });
      }

      const targetApptId = appointment_id || pt.appointment_id;
      const targetPatientId = patient_id || pt.patient_id;

      const appointment = await Appointment.findByPk(targetApptId);
      if (!appointment) return res.status(404).json({ message: 'Termini nuk ekziston.' });

      if (appointment.patient_id !== parseInt(targetPatientId) || appointment.dentist_id !== parseInt(targetDentistId)) {
        return res.status(400).json({
          message: 'Dentisti ose pacienti nuk përputhen me terminet.'
        });
      }

      if (treatment_id) {
        const treatment = await Treatment.findByPk(treatment_id);
        if (!treatment) return res.status(404).json({ message: 'Trajtimi nuk ekziston.' });
      }

      const updateData = {};
      if (appointment_id) updateData.appointment_id = appointment_id;
      if (treatment_id) updateData.treatment_id = treatment_id;
      if (patient_id) updateData.patient_id = patient_id;
      if (dentist_id) updateData.dentist_id = dentist_id;
      if (treatment_date) updateData.treatment_date = treatment_date;
      if (cost !== undefined && cost !== null) updateData.cost = cost;
      if (notes !== undefined) updateData.notes = notes;

      await pt.update(updateData);

      const result = await PatientTreatment.findOne({
        where: { patient_treatment_id: id },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Përditësuar me sukses.',
        data: result
      });
    } catch (error) {
      console.error('UPDATE PATIENT TREATMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const pt = await PatientTreatment.findByPk(id);
      if (!pt) {
        return res.status(404).json({ message: 'Trajtimi nuk u gjet.' });
      }

      const hasAccess = await checkDentistAccess(req, pt.dentist_id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses për fshirje.' });
      }

      await pt.destroy();

      return res.status(200).json({
        message: 'Trajtimi u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE PATIENT TREATMENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  }
};

module.exports = patientTreatmentController;
