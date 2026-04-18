const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  UserRole
} = require('../models');

const userController = {
  getAll: async (req, res) => {
    try {
      const users = await User.findAll({
        where: { is_deleted: false },
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ['role_id', 'role_name', 'normalized_name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        message: 'Përdoruesit u morën me sukses.',
        data: users
      });
    } catch (error) {
      console.error('GET ALL USERS ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së përdoruesve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findOne({
        where: {
          user_id: id,
          is_deleted: false
        },
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ['role_id', 'role_name', 'normalized_name']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          message: 'Përdoruesi nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Përdoruesi u mor me sukses.',
        data: user
      });
    } catch (error) {
      console.error('GET USER BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së përdoruesit.'
      });
    }
  },

  create: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { first_name, last_name, email, password, phone_number, status, role_ids } = req.body;

      if (!first_name || !last_name || !email || !password) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'first_name, last_name, email dhe password janë të detyrueshme.'
        });
      }

      if (password.length < 8) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Password duhet të ketë të paktën 8 karaktere.'
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

      if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
        const roles = await Role.findAll({
          where: { role_id: { [Op.in]: role_ids } },
          transaction
        });

        if (roles.length !== role_ids.length) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Një ose më shumë role nuk u gjetën.'
          });
        }

        const userRoles = role_ids.map((role_id) => ({
          user_id: newUser.user_id,
          role_id
        }));

        await UserRole.bulkCreate(userRoles, { transaction });
      }

      await transaction.commit();

      const createdUser = await User.findOne({
        where: { user_id: newUser.user_id },
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ['role_id', 'role_name', 'normalized_name']
          }
        ]
      });

      return res.status(201).json({
        message: 'Përdoruesi u krijua me sukses.',
        data: createdUser
      });
    } catch (error) {
      await transaction.rollback();
      console.error('CREATE USER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të përdoruesit.'
      });
    }
  },

  update: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { first_name, last_name, email, phone_number, status, password } = req.body;

      const user = await User.findOne({
        where: {
          user_id: id,
          is_deleted: false
        },
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Përdoruesi nuk u gjet.'
        });
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            user_id: { [Op.ne]: id }
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

      const updateData = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (email) updateData.email = email;
      if (phone_number !== undefined) updateData.phone_number = phone_number;
      if (status) updateData.status = status;

      if (password) {
        if (password.length < 8) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Password duhet të ketë të paktën 8 karaktere.'
          });
        }

        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(password, salt);
      }

      await user.update(updateData, { transaction });

      await transaction.commit();

      const updatedUser = await User.findOne({
        where: { user_id: id },
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ['role_id', 'role_name', 'normalized_name']
          }
        ]
      });

      return res.status(200).json({
        message: 'Përdoruesi u përditësua me sukses.',
        data: updatedUser
      });
    } catch (error) {
      await transaction.rollback();
      console.error('UPDATE USER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të përdoruesit.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findOne({
        where: {
          user_id: id,
          is_deleted: false
        }
      });

      if (!user) {
        return res.status(404).json({
          message: 'Përdoruesi nuk u gjet.'
        });
      }

      await user.update({
        is_deleted: true,
        status: 'Inactive'
      });

      return res.status(200).json({
        message: 'Përdoruesi u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE USER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë fshirjes së përdoruesit.'
      });
    }
  },

  unlock: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findOne({
        where: {
          user_id: id,
          is_deleted: false
        }
      });

      if (!user) {
        return res.status(404).json({
          message: 'Përdoruesi nuk u gjet.'
        });
      }

      await user.update({
        lockout_enabled: false,
        access_failed_count: 0
      });

      return res.status(200).json({
        message: 'Llogaria e përdoruesit u zhbllokua me sukses.'
      });
    } catch (error) {
      console.error('UNLOCK USER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë zhbllokimit të llogarisë.'
      });
    }
  }
};

module.exports = userController;
