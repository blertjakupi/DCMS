const {
  DentalRecord,
  Patient,
  Dentist,
  Appointment
} = require('../models');

const checkDentistAccess = async (req, targetDentistId) => {
  const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
  if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST') {
    return true;
  }
  if (userRole === 'DENTIST') {
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
  const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
      if (userRole === 'ADMIN' || userRole === 'RECEPTIONIST' || userRole === 'DENTIST') {
        return true;
      }
      if (userRole === 'PATIENT') {
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
    model: Patient,
    attributes: ['patient_id', 'first_name', 'last_name']
  },
  {
    model: Dentist,
    attributes: ['dentist_id', 'first_name', 'last_name']
  },
  {
    model: Appointment,
    attributes: ['appointment_id', 'appointment_date']
  }
];

const dentalRecordController = {
  getAll: async (req, res) => {
    try {
      const records = await DentalRecord.findAll({
        include: getIncludeOptions(),
        order: [['record_date', 'DESC'], ['record_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Regjistrat dentare u morën me sukses.',
        data: records
      });
    } catch (error) {
      console.error('GET ALL DENTAL RECORDS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së regjistrave dentare.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const record = await DentalRecord.findOne({
        where: { record_id: id },
        include: getIncludeOptions()
      });

      if (!record) {
        return res.status(404).json({ message: 'Regjistri dentar nuk u gjet.' });
      }

      
      const userRole = req.user.role ? req.user.role.normalized_name.toUpperCase() : '';
      if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST') {
        if (userRole === 'DENTIST') {
          const hasAccess = await checkDentistAccess(req, record.dentist_id);
          if (!hasAccess) return res.status(403).json({ message: 'Nuk keni akses për të parë këtë regjistër.' });
        } else if (userRole === 'PATIENT') {
          const hasAccess = await checkPatientAccess(req, record.patient_id);
          if (!hasAccess) return res.status(403).json({ message: 'Nuk keni akses për të parë këtë regjistër.' });
        }
      }

      return res.status(200).json({
        message: 'Regjistri dentar u mor me sukses.',
        data: record
      });
    } catch (error) {
      console.error('GET DENTAL RECORD BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së regjistrit dentar.'
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

      const records = await DentalRecord.findAll({
        where: { patient_id: patientId },
        include: getIncludeOptions(),
        order: [['record_date', 'DESC'], ['record_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Regjistrat dentare u morën me sukses.',
        data: records
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

      const records = await DentalRecord.findAll({
        where: { dentist_id: dentistId },
        include: getIncludeOptions(),
        order: [['record_date', 'DESC'], ['record_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Regjistrat dentare u morën me sukses.',
        data: records
      });
    } catch (error) {
      console.error('GET BY DENTIST ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
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
        if (userRole === 'DENTIST') {
          const hasAccess = await checkDentistAccess(req, appointment.dentist_id);
          if (!hasAccess) return res.status(403).json({ message: 'Nuk keni akses për të parë këtë regjistër.' });
        } else if (userRole === 'PATIENT') {
          const hasAccess = await checkPatientAccess(req, appointment.patient_id);
          if (!hasAccess) return res.status(403).json({ message: 'Nuk keni akses për të parë këtë regjistër.' });
        }
      }

      const records = await DentalRecord.findAll({
        where: { appointment_id: appointmentId },
        include: getIncludeOptions(),
        order: [['record_date', 'DESC'], ['record_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Regjistrat dentare u morën me sukses.',
        data: records
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
      const { tooth, condition, notes, record_date, dentist_id, patient_id, appointment_id } = req.body;

      if (!patient_id || !dentist_id || !record_date) {
        return res.status(400).json({
          message: 'Fushat e detyrueshme mungojnë: patient_id, dentist_id, record_date.'
        });
      }

      const hasAccess = await checkDentistAccess(req, dentist_id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses për të shtuar regjistër për këtë dentist.' });
      }

      const patient = await Patient.findByPk(patient_id);
      if (!patient || patient.is_deleted) {
        return res.status(404).json({ message: 'Pacienti nuk ekziston ose është fshirë.' });
      }

      const dentist = await Dentist.findByPk(dentist_id);
      if (!dentist || dentist.is_deleted) {
        return res.status(404).json({ message: 'Dentisti nuk ekziston ose është fshirë.' });
      }

      if (appointment_id) {
        const appointment = await Appointment.findByPk(appointment_id);
        if (!appointment) {
          return res.status(404).json({ message: 'Termini nuk ekziston.' });
        }
      }

      const newRecord = await DentalRecord.create({
        tooth: tooth || null,
        condition: condition || null,
        notes: notes || null,
        record_date,
        dentist_id,
        patient_id,
        appointment_id: appointment_id || null
      });

      const result = await DentalRecord.findOne({
        where: { record_id: newRecord.record_id },
        include: getIncludeOptions()
      });

      return res.status(201).json({
        message: 'Regjistri dentar u krijua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('CREATE DENTAL RECORD ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të regjistrit dentar.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { tooth, condition, notes, record_date, dentist_id, patient_id, appointment_id } = req.body;

      const record = await DentalRecord.findByPk(id);
      if (!record) {
        return res.status(404).json({ message: 'Regjistri dentar nuk u gjet.' });
      }

      const targetDentistId = dentist_id || record.dentist_id;
      const hasAccess = await checkDentistAccess(req, targetDentistId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses.' });
      }

      if (patient_id) {
        const patient = await Patient.findByPk(patient_id);
        if (!patient || patient.is_deleted) {
          return res.status(404).json({ message: 'Pacienti nuk ekziston ose është fshirë.' });
        }
      }

      if (dentist_id) {
        const dentist = await Dentist.findByPk(dentist_id);
        if (!dentist || dentist.is_deleted) {
          return res.status(404).json({ message: 'Dentisti nuk ekziston ose është fshirë.' });
        }
      }

      if (appointment_id) {
        const appointment = await Appointment.findByPk(appointment_id);
        if (!appointment) {
          return res.status(404).json({ message: 'Termini nuk ekziston.' });
        }
      }

      const updateData = {};
      if (tooth !== undefined) updateData.tooth = tooth;
      if (condition !== undefined) updateData.condition = condition;
      if (notes !== undefined) updateData.notes = notes;
      if (record_date) updateData.record_date = record_date;
      if (dentist_id) updateData.dentist_id = dentist_id;
      if (patient_id) updateData.patient_id = patient_id;
      if (appointment_id !== undefined) updateData.appointment_id = appointment_id;

      await record.update(updateData);

      const result = await DentalRecord.findOne({
        where: { record_id: id },
        include: getIncludeOptions()
      });

      return res.status(200).json({
        message: 'Regjistri dentar u përditësua me sukses.',
        data: result
      });
    } catch (error) {
      console.error('UPDATE DENTAL RECORD ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const record = await DentalRecord.findByPk(id);
      if (!record) {
        return res.status(404).json({ message: 'Regjistri dentar nuk u gjet.' });
      }

      const hasAccess = await checkDentistAccess(req, record.dentist_id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nuk keni akses për fshirje.' });
      }

      await record.destroy();

      return res.status(200).json({
        message: 'Regjistri dentar u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE DENTAL RECORD ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm.'
      });
    }
  }
};

module.exports = dentalRecordController;
