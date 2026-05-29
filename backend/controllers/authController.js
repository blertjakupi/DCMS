const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  RefreshToken,
  UserToken,
  Patient,
  Dentist
} = require('../models');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be defined in .env');
}


const DEFAULT_ROLE_NORMALIZED_NAME = 'PATIENT';
const RESET_PASSWORD_PROVIDER = 'LOCAL';
const RESET_PASSWORD_TOKEN_NAME = 'PASSWORD_RESET';
const RESET_PASSWORD_TOKEN_MINUTES = 30;

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const phonesMatch = (...values) => {
  const [inputPhone, ...storedPhones] = values.map(normalizePhone);
  if (!inputPhone) return false;

  return storedPhones.some((storedPhone) => {
    if (!storedPhone) return false;
    return storedPhone === inputPhone ||
      storedPhone.endsWith(inputPhone) ||
      inputPhone.endsWith(storedPhone);
  });
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '8h' }
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

const createPasswordResetToken = async (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_PASSWORD_TOKEN_MINUTES * 60 * 1000);
  const tokenValue = JSON.stringify({
    tokenHash,
    expiresAt: expiresAt.toISOString()
  });

  const existingToken = await UserToken.findOne({
    where: {
      user_id: user.user_id,
      login_provider: RESET_PASSWORD_PROVIDER,
      token_name: RESET_PASSWORD_TOKEN_NAME
    }
  });

  if (existingToken) {
    await existingToken.update({ token_value: tokenValue });
  } else {
    await UserToken.create({
      user_id: user.user_id,
      login_provider: RESET_PASSWORD_PROVIDER,
      token_name: RESET_PASSWORD_TOKEN_NAME,
      token_value: tokenValue
    });
  }

  return { rawToken, expiresAt };
};

const parsePasswordResetToken = (tokenRecord) => {
  try {
    return JSON.parse(tokenRecord.token_value);
  } catch (error) {
    return null;
  }
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
          lockout_enabled: false,
          role_id: defaultRole.role_id
        },
        { transaction }
      );

      
      await newUser.update(
        { role_id: defaultRole.role_id },
        { transaction }
      );

      if (defaultRole.normalized_name === 'PATIENT') {
        await Patient.create(
          {
            user_id: newUser.user_id,
            first_name,
            last_name,
            email,
            phone: phone_number || null,
            birth_date: null,
            address: null,
            allergies: null,
            status: 'Active',
            is_deleted: false
          },
          { transaction }
        );
      }

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
	  
	  const dentistRecord = await Dentist.findOne({
	  where: { user_id: user.user_id, is_deleted: false }
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
          roles: user.Role ? [user.Role.normalized_name] : [],
		  dentist_id: dentistRecord ? dentistRecord.dentist_id : null
        }
      });
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshëm gjatë login.'
      });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email, phone_number, phone } = req.body;
      const verificationPhone = phone_number || phone;

      if (!email || !verificationPhone) {
        return res.status(400).json({
          message: 'Email dhe numri i telefonit jane te detyrueshem.'
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
            model: Patient,
            required: false,
            attributes: ['phone']
          }
        ]
      });

      if (!user) {
        return res.status(200).json({
          message: 'Nese te dhenat perputhen, do te krijohen udhezimet per reset password.'
        });
      }

      const phoneIsVerified = phonesMatch(
        verificationPhone,
        user.phone_number,
        user.Patient?.phone
      );

      if (!phoneIsVerified) {
        return res.status(200).json({
          message: 'Nese te dhenat perputhen, do te krijohen udhezimet per reset password.'
        });
      }

      const reset = await createPasswordResetToken(user);
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${reset.rawToken}`;

      return res.status(200).json({
        message: 'Te dhenat u verifikuan. Mund te vazhdoni me reset password.',
        ...(process.env.NODE_ENV !== 'production'
          ? {
              resetToken: reset.rawToken,
              resetUrl,
              expiresAt: reset.expiresAt
            }
          : {})
      });
    } catch (error) {
      console.error('FORGOT PASSWORD ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshem gjate procesit te forgot password.'
      });
    }
  },

  resetPassword: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { token, new_password, newPassword, confirm_password, confirmPassword } = req.body;
      const nextPassword = new_password || newPassword;
      const confirmPasswordValue = confirm_password || confirmPassword;

      if (!token || !nextPassword || !confirmPasswordValue) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Token, new_password dhe confirm_password jane te detyrueshme.'
        });
      }

      if (nextPassword.length < 8) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Password i ri duhet te kete te pakten 8 karaktere.'
        });
      }

      if (nextPassword !== confirmPasswordValue) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Password i ri dhe konfirmimi nuk perputhen.'
        });
      }

      const tokenHash = hashToken(token);
      const resetTokens = await UserToken.findAll({
        where: {
          login_provider: RESET_PASSWORD_PROVIDER,
          token_name: RESET_PASSWORD_TOKEN_NAME
        },
        transaction
      });

      let matchedToken = null;
      let parsedToken = null;

      for (const tokenRecord of resetTokens) {
        const parsed = parsePasswordResetToken(tokenRecord);
        if (parsed?.tokenHash === tokenHash) {
          matchedToken = tokenRecord;
          parsedToken = parsed;
          break;
        }
      }

      if (!matchedToken || !parsedToken) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Token i reset password nuk eshte valid.' });
      }

      if (new Date(parsedToken.expiresAt) < new Date()) {
        await matchedToken.destroy({ transaction });
        await transaction.commit();
        return res.status(400).json({ message: 'Token i reset password ka skaduar.' });
      }

      const user = await User.findOne({
        where: {
          user_id: matchedToken.user_id,
          is_deleted: false,
          status: 'Active'
        },
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Perdoruesi nuk u gjet ose nuk eshte aktiv.' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(nextPassword, salt);

      await user.update({
        password_hash,
        access_failed_count: 0,
        lockout_enabled: false
      }, { transaction });

      await matchedToken.destroy({ transaction });

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
        message: 'Password-i u resetua me sukses. Tani mund te kyqeni me password-in e ri.'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('RESET PASSWORD ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshem gjate resetimit te password-it.'
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
  },

  changePassword: async (req, res) => {
    try {
      const { current_password, currentPassword, new_password, newPassword, confirm_password, confirmPassword } = req.body;
      const oldPassword = current_password || currentPassword;
      const nextPassword = new_password || newPassword;
      const confirmPasswordValue = confirm_password || confirmPassword;

      if (!oldPassword || !nextPassword || !confirmPasswordValue) {
        return res.status(400).json({
          message: 'Fushat current_password, new_password dhe confirm_password jane te detyrueshme.'
        });
      }

      if (nextPassword.length < 8) {
        return res.status(400).json({
          message: 'Password i ri duhet te kete te pakten 8 karaktere.'
        });
      }

      if (nextPassword !== confirmPasswordValue) {
        return res.status(400).json({
          message: 'Password i ri dhe konfirmimi nuk perputhen.'
        });
      }

      if (oldPassword === nextPassword) {
        return res.status(400).json({
          message: 'Password i ri duhet te jete ndryshe nga password-i aktual.'
        });
      }

      const user = await User.findOne({
        where: {
          user_id: req.user.user_id,
          is_deleted: false,
          status: 'Active'
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'Perdoruesi nuk u gjet.' });
      }

      const isCurrentPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          message: 'Password-i aktual nuk eshte i sakte.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(nextPassword, salt);

      await user.update({
        password_hash,
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

      return res.status(200).json({
        message: 'Password-i u ndryshua me sukses. Ju lutemi kyquni perseri.'
      });
    } catch (error) {
      console.error('CHANGE PASSWORD ERROR:', error);
      return res.status(500).json({
        message: 'Gabim i brendshem gjate ndryshimit te password-it.'
      });
    }
  }
};

module.exports = authController;
