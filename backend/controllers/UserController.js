const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  RefreshToken
} = require('../models');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedStatuses = ['Active', 'Inactive'];

const userController = {
  getAll: async (req, res) => {
    try {
      const users = await User.findAll({
        where: { is_deleted: false },
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
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
      const { first_name, last_name, email, password, phone_number, status, role_id } = req.body;

      
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

      
      if (!role_id) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'role_id është i detyrueshëm.'
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

      
      const role = await Role.findByPk(role_id, { transaction });
      if (!role) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Roli i specifikuar nuk ekziston.'
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
          role_id: role_id          
        },
        { transaction }
      );

      
      await transaction.commit();

      const createdUser = await User.findOne({
        where: { user_id: newUser.user_id },
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Role,
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
      const { first_name, last_name, email, phone_number, status, password, role_id } = req.body;

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

      if (email) {
        if (!emailRegex.test(email)) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Email nuk është në format valid.'
          });
        }

        if (email !== user.email) {
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
      }

      if (status && !allowedStatuses.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Statusi nuk është valid.'
        });
      }

      
      if (role_id) {
        const role = await Role.findByPk(role_id, { transaction });
        if (!role) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Roli i specifikuar nuk ekziston.'
          });
        }
      }

      const updateData = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (email) updateData.email = email;
      if (phone_number !== undefined) updateData.phone_number = phone_number;
      if (status) updateData.status = status;
      if (role_id) updateData.role_id = role_id;   
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
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

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

      await user.update(
        {
          is_deleted: true,
          status: 'Inactive'
        },
        { transaction }
      );

      await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: {
            user_id: user.user_id,
            revoked_at: null
          },
          transaction
        }
      );

      await transaction.commit();

      return res.status(200).json({
        message: 'Përdoruesi u fshi me sukses.'
      });
    } catch (error) {
      await transaction.rollback();
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

      if (!user.lockout_enabled && user.access_failed_count === 0) {
        return res.status(400).json({
          message: 'Përdoruesi nuk është i bllokuar.'
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