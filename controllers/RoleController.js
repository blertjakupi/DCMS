const { Op } = require('sequelize');
const {
  sequelize,
  Role,
  User,
  UserRole
} = require('../models');

const roleController = {
  getAll: async (req, res) => {
    try {
      const roles = await Role.findAll({
        order: [['role_id', 'ASC']]
      });

      return res.status(200).json({
        message: 'Rolet u morën me sukses.',
        data: roles
      });
    } catch (error) {
      console.error('GET ALL ROLES ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së roleve.'
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id);

      if (!role) {
        return res.status(404).json({
          message: 'Roli nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Roli u mor me sukses.',
        data: role
      });
    } catch (error) {
      console.error('GET ROLE BY ID ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së rolit.'
      });
    }
  },

  create: async (req, res) => {
    try {
      const { role_name, description } = req.body;

      if (!role_name || !role_name.trim()) {
        return res.status(400).json({
          message: 'role_name është e detyrueshme.'
        });
      }

      const cleanedRoleName = role_name.trim();
      const normalized_name = cleanedRoleName.toUpperCase();

      const existingRole = await Role.findOne({
        where: { normalized_name }
      });

      if (existingRole) {
        return res.status(400).json({
          message: 'Roli me këtë emër ekziston tashmë.'
        });
      }

      const newRole = await Role.create({
        role_name: cleanedRoleName,
        normalized_name,
        description: description ? description.trim() : null
      });

      return res.status(201).json({
        message: 'Roli u krijua me sukses.',
        data: newRole
      });
    } catch (error) {
      console.error('CREATE ROLE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë krijimit të rolit.'
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { role_name, description } = req.body;

      const role = await Role.findByPk(id);

      if (!role) {
        return res.status(404).json({
          message: 'Roli nuk u gjet.'
        });
      }

      const updateData = {};

      if (role_name !== undefined) {
        if(!role_name.trim()) {
          return res.status(400).json({
            message: 'role_name nuk mund të jetë bosh.'
          });
        }

        const cleanedRoleName = role_name.trim();
        const normalized_name = cleanedRoleName.toUpperCase();

        const existingRole = await Role.findOne({
          where: {
            normalized_name,
            role_id: { [Op.ne]: id }
          }
        });

        if (existingRole) {
          return res.status(400).json({
            message: 'Roli me këtë emër ekziston tashmë.'
          });
        }

        updateData.role_name = cleanedRoleName;
        updateData.normalized_name = normalized_name;
      }

      if (description !== undefined) {
        updateData.description = description ? description.trim() : null;
      }

      await role.update(updateData);

      return res.status(200).json({
        message: 'Roli u përditësua me sukses.',
        data: role
      });
    } catch (error) {
      console.error('UPDATE ROLE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të rolit.'
      });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id);

      if (!role) {
        return res.status(404).json({
          message: 'Roli nuk u gjet.'
        });
      }

      const assignedUsers = await UserRole.count({
        where: { role_id: id }
      });

      if (assignedUsers > 0) {
        return res.status(400).json({
          message: `Roli nuk mund të fshihet sepse ${assignedUsers} përdorues e kanë këtë rol.`
        });
      }

      await role.destroy();

      return res.status(200).json({
        message: 'Roli u fshi me sukses.'
      });
    } catch (error) {
      console.error('DELETE ROLE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë fshirjes së rolit.'
      });
    }
  },

  getUsersByRole: async (req, res) => {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id, {
        include: [
          {
            model: User,
            through: { attributes: [] },
            attributes: { exclude: ['password_hash'] },
            where: { is_deleted: false },
            required: false
          }
        ]
      });

      if (!role) {
        return res.status(404).json({
          message: 'Roli nuk u gjet.'
        });
      }

      return res.status(200).json({
        message: 'Përdoruesit e rolit u morën me sukses.',
        data: {
          role_id: role.role_id,
          role_name: role.role_name,
          users: role.Users || []
        }
      });
    } catch (error) {
      console.error('GET USERS BY ROLE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së përdoruesve të rolit.'
      });
    }
  }
};

module.exports = roleController;
