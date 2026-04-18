const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  RefreshToken,
  UserRole
} = require('../models');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be defined in .env');
}


const DEFAULT_ROLE_NORMALIZED_NAME = 'PATIENT';

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

const authController = {
  register: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { first_name, last_name, email, password, phone_number } = req.body;

      
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

      
      const defaultRole = await Role.findOne({
        where: { normalized_name: DEFAULT_ROLE_NORMALIZED_NAME },
        transaction
      });

      if (!defaultRole) {
        await transaction.rollback();
        return res.status(500).json({
          message: `Roli default '${DEFAULT_ROLE_NORMALIZED_NAME}' nuk u gjet në databazë.`
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
          status: 'Active',
          is_deleted: false,
          access_failed_count: 0,
          lockout_enabled: false
        },
        { transaction }
      );

      
      await UserRole.create(
        {
          user_id: newUser.user_id,
          role_id: defaultRole.role_id
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        message: 'Përdoruesi u regjistrua me sukses.',
        user: {
          user_id: newUser.user_id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('REGISTER ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë regjistrimit.'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: 'Email dhe password janë të detyrueshme.'
        });
      }

      const user = await User.findOne({
        where: {
          email,
          is_deleted: false,
          status: 'Active'
        },
        include: [
          {
            model: Role,
            through: { attributes: [] },
            attributes: ['role_id', 'role_name', 'normalized_name']
          }
        ]
      });

      
      if (!user) {
        return res.status(401).json({
          message: 'Email ose password i pavlefshëm.'
        });
      }

      if (user.lockout_enabled) {
        return res.status(403).json({
          message: 'Llogaria është e bllokuar. Kontakto administratorin.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        const failedCount = user.access_failed_count + 1;
        const lockout = failedCount >= 5;

        await user.update({
          access_failed_count: failedCount,
          lockout_enabled: lockout
        });

        return res.status(401).json({
          message: 'Email ose password i pavlefshëm.'
        });
      }

      
      await user.update({
        access_failed_count: 0,
        lockout_enabled: false
      });

      
      await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: {
            user_id: user.user_id,
            revoked_at: null
          }
        }
      );

      const accessToken = createAccessToken(user);
      const rawRefreshToken = createRefreshToken(user);
      const hashedRefreshToken = hashToken(rawRefreshToken);

      await RefreshToken.create({
        user_id: user.user_id,
        token: hashedRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        revoked_at: null
      });

      return res.status(200).json({
        message: 'Login i suksesshëm.',
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          user_id: user.user_id,
          full_name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          roles: user.roles ? user.roles.map((role) => role.normalized_name) : []
        }
      });
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë login.'
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(401).json({
          message: 'Refresh token është i detyrueshëm.'
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
      } catch (error) {
        return res.status(403).json({
          message: 'Refresh token i pavlefshëm.'
        });
      }

      const hashed = hashToken(token);

      const storedToken = await RefreshToken.findOne({
        where: {
          token: hashed,
          user_id: decoded.user_id,
          revoked_at: null,
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!storedToken) {
        return res.status(403).json({
          message: 'Refresh token i pavlefshëm ose i skaduar.'
        });
      }

      const user = await User.findOne({
        where: {
          user_id: decoded.user_id,
          is_deleted: false,
          status: 'Active',
          lockout_enabled: false
        }
      });

      if (!user) {
        return res.status(403).json({
          message: 'Llogaria e përdoruesit nuk është valide.'
        });
      }

      
      storedToken.revoked_at = new Date();
      await storedToken.save();

      const newAccessToken = createAccessToken(user);
      const newRawRefreshToken = createRefreshToken(user);
      const newHashedRefreshToken = hashToken(newRawRefreshToken);

      await RefreshToken.create({
        user_id: user.user_id,
        token: newHashedRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        revoked_at: null
      });

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken
      });
    } catch (error) {
      console.error('REFRESH TOKEN ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë rifreskimit të token-it.'
      });
    }
  },

  logout: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: 'Refresh token është i detyrueshëm.'
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
      } catch (error) {
        
        return res.status(200).json({
          message: 'Logout u krye me sukses.'
        });
      }

      const hashed = hashToken(token);

      await RefreshToken.update(
        { revoked_at: new Date() },
        {
          where: {
            token: hashed,
            user_id: decoded.user_id,
            revoked_at: null
          }
        }
      );

      return res.status(200).json({
        message: 'Logout u krye me sukses.'
      });
    } catch (error) {
      console.error('LOGOUT ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë logout.'
      });
    }
  }
};

module.exports = authController;
