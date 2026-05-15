const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  Dentist
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
          lockout_enabled: false
        },
        { transaction }
      );

     await newUser.update(
        { role_id: dentistRole.role_id },
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
  }
};

module.exports = dentistController;
