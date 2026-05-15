const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  Patient
} = require('../models');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = ['Active', 'Inactive'];
const PATIENT_ROLE_NORMALIZED_NAME = 'PATIENT';

const patientController = {
  getAll: async (req, res) => {
    try {
      const patients = await Patient.findAll({
        where: { is_deleted: false },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ],
        order: [['patient_id', 'DESC']]
      });

      return res.status(200).json({
        message: 'Pacientët u morën me sukses.',
        data: patients
      });
    } catch (error) {
      console.error('GET ALL PATIENTS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së pacientëve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const patient = await Patient.findOne({
        where: {
          patient_id: id,
          is_deleted: false
        },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ]
      });

      if (!patient) {
        return res.status(404).json({
          message: 'Pacienti nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Pacienti u mor me sukses.',
        data: patient
      });
    } catch (error) {
      console.error('GET PATIENT BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së pacientit.'
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
        address,
        allergies,
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

      const patientRole = await Role.findOne({
        where: { normalized_name: PATIENT_ROLE_NORMALIZED_NAME },
        transaction
      });

      if (!patientRole) {
        await transaction.rollback();
        return res.status(500).json({
          message: `Roli '${PATIENT_ROLE_NORMALIZED_NAME}' nuk u gjet në databazë.`
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
          lockout_enabled: false
        },
        { transaction }
      );

        await newUser.update(
        { role_id: patientRole.role_id },
        { transaction }
      );

      const newPatient = await Patient.create(
        {
          user_id: newUser.user_id,
          first_name,
          last_name,
          birth_date: birth_date || null,
          phone: phone || phone_number || null,
          email,
          address: address || null,
          allergies: allergies || null,
          status: status || 'Active',
          is_deleted: false
        },
        { transaction }
      );

      await transaction.commit();

      const createdPatient = await Patient.findOne({
        where: { patient_id: newPatient.patient_id },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ]
      });

      return res.status(201).json({
        message: 'Pacienti u krijua me sukses.',
        data: createdPatient
      });
    } catch (error) {
      await transaction.rollback();
      console.error('CREATE PATIENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të pacientit.'
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
        address,
        allergies,
        status
      } = req.body;

      const patient = await Patient.findOne({
        where: {
          patient_id: id,
          is_deleted: false
        },
        transaction
      });

      if (!patient) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Pacienti nuk u gjet.'
        });
      }

      if (email) {
        if (!emailRegex.test(email)) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Email nuk është në format valid.'
          });
        }

        if (email !== patient.email) {
          const existingUser = await User.findOne({
            where: {
              email,
              user_id: { [Op.ne]: patient.user_id }
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

      const patientUpdateData = {};
      if (first_name) patientUpdateData.first_name = first_name;
      if (last_name) patientUpdateData.last_name = last_name;
      if (birth_date !== undefined) patientUpdateData.birth_date = birth_date;
      if (phone !== undefined) patientUpdateData.phone = phone;
      if (email) patientUpdateData.email = email;
      if (address !== undefined) patientUpdateData.address = address;
      if (allergies !== undefined) patientUpdateData.allergies = allergies;
      if (status) patientUpdateData.status = status;

      await patient.update(patientUpdateData, { transaction });

      const userUpdateData = {};
      if (first_name) userUpdateData.first_name = first_name;
      if (last_name) userUpdateData.last_name = last_name;
      if (email) userUpdateData.email = email;
      if (status) userUpdateData.status = status;

      if (Object.keys(userUpdateData).length > 0) {
        await User.update(userUpdateData, {
          where: { user_id: patient.user_id },
          transaction
        });
      }

      await transaction.commit();

      const updatedPatient = await Patient.findOne({
        where: { patient_id: id },
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'status']
          }
        ]
      });

      return res.status(200).json({
        message: 'Pacienti u përditësua me sukses.',
        data: updatedPatient
      });
    } catch (error) {
      await transaction.rollback();
      console.error('UPDATE PATIENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të pacientit.'
      });
    }
  },

  delete: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const patient = await Patient.findOne({
        where: {
          patient_id: id,
          is_deleted: false
        },
        transaction
      });

      if (!patient) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Pacienti nuk u gjet.'
        });
      }

      await patient.update(
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
          where: { user_id: patient.user_id },
          transaction
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: 'Pacienti u fshi me sukses.'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('DELETE PATIENT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë fshirjes së pacientit.'
      });
    }
  },
   getMe: async (req, res) => {
      try {
        const patient = await Patient.findOne({
          where: { user_id: req.user.user_id, is_deleted: false },
          include: [
            {
              model: User,
              attributes: ['first_name', 'last_name', 'email', 'phone_number']
            }
          ]
        });
        if (!patient) {
          return res.status(404).json({ message: 'Patient record not found' });
        }
        res.json(patient);
      } catch (error) {
        console.error('GET ME PATIENT ERROR:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
};
   

module.exports = patientController;
