const {
  sequelize,
  User,
  Role,
  UserRole
} = require('../models');

const userRoleController = {
  getAll: async (req, res) => {
    try {
      const userRoles = await UserRole.findAll({
        include: [
          {
            model: User,
            attributes: ['user_id', 'first_name', 'last_name', 'email']
          },
          {
            model: Role,
            attributes: ['role_id', 'role_name', 'normalized_name']
          }
        ],
        order: [['user_role_id', 'ASC']]
      });

      return res.status(200).json({
        message: 'User-Roles u morën me sukses.',
        data: userRoles
      });
    } catch (error) {
      console.error('GET ALL USER-ROLES ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së user-roles.'
      });
    }
  },

  getRolesByUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findOne({
        where: {
          user_id: userId,
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
        message: 'Rolet e përdoruesit u morën me sukses.',
        data: {
          user_id: user.user_id,
          full_name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          roles: user.Roles || []
        }
      });
    } catch (error) {
      console.error('GET ROLES BY USER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë marrjes së roleve të përdoruesit.'
      });
    }
  },

  assign: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { user_id, role_id } = req.body;

      if (!user_id || !role_id) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'user_id dhe role_id janë të detyrueshme.'
        });
      }

      const user = await User.findOne({
        where: {
          user_id,
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

      const role = await Role.findByPk(role_id, { transaction });

      if (!role) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Roli nuk u gjet.'
        });
      }

      const existingAssignment = await UserRole.findOne({
        where: { user_id, role_id },
        transaction
      });

      if (existingAssignment) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Përdoruesi e ka tashmë këtë rol.'
        });
      }

      const userRole = await UserRole.create(
        { user_id, role_id },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        message: 'Roli u caktua me sukses.',
        data: {
          user_role_id: userRole.user_role_id,
          user_id: userRole.user_id,
          role_id: userRole.role_id,
          user: {
            full_name: `${user.first_name} ${user.last_name}`,
            email: user.email
          },
          role: {
            role_name: role.role_name,
            normalized_name: role.normalized_name
          }
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('ASSIGN ROLE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë caktimit të rolit.'
      });
    }
  },

  remove: async (req, res) => {
    try {
      const { user_id, role_id } = req.body;

      if (!user_id || !role_id) {
        return res.status(400).json({
          message: 'user_id dhe role_id janë të detyrueshme.'
        });
      }

      const userRole = await UserRole.findOne({
        where: { user_id, role_id }
      });

      if (!userRole) {
        return res.status(404).json({
          message: 'Caktimi i rolit nuk u gjet.'
        });
      }

      const roleCount = await UserRole.count({
        where: { user_id }
      });

      if (roleCount <= 1) {
        return res.status(400).json({
          message: 'Përdoruesi duhet të ketë të paktën një rol. Nuk mund të hiqet roli i fundit.'
        });
      }

      await userRole.destroy();

      return res.status(200).json({
        message: 'Roli u hoq me sukses nga përdoruesi.'
      });
    } catch (error) {
      console.error('REMOVE ROLE ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë heqjes së rolit.'
      });
    }
  },

  updateUserRoles: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { userId } = req.params;
      const { role_ids } = req.body;

      if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'role_ids duhet të jetë një listë jo e zbrazët.'
        });
      }

      const user = await User.findOne({
        where: {
          user_id: userId,
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

      const roles = await Role.findAll({
        where: { role_id: { [require('sequelize').Op.in]: role_ids } },
        transaction
      });

      if (roles.length !== role_ids.length) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Një ose më shumë role nuk u gjetën.'
        });
      }

      await UserRole.destroy({
        where: { user_id: userId },
        transaction
      });

      const userRoles = role_ids.map((role_id) => ({
        user_id: parseInt(userId),
        role_id
      }));

      await UserRole.bulkCreate(userRoles, { transaction });

      await transaction.commit();

      const updatedUser = await User.findOne({
        where: { user_id: userId },
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
        message: 'Rolet e përdoruesit u përditësuan me sukses.',
        data: updatedUser
      });
    } catch (error) {
      await transaction.rollback();
      console.error('UPDATE USER ROLES ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë përditësimit të roleve.'
      });
    }
  }
};

module.exports = userRoleController;
