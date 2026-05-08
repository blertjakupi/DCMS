const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET must be defined in .env');
}

const authMiddleware = async (req, res, next) => {
  try {
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token i mungon ose është i pasaktë.' });
    }

    const token = authHeader.split(' ')[1];

    
    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token ka skaduar.' });
      }
      return res.status(403).json({ message: 'Access token i pavlefshëm.' });
    }

    
    const user = await User.findOne({
      where: {
        user_id: decoded.user_id,
        is_deleted: false,
        status: 'Active',
        lockout_enabled: false
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
      return res.status(403).json({ message: 'Përdoruesi nuk ekziston ose llogaria është e bllokuar/fshirë.' });
    }

    
    req.user = {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: user.Roles ? user.Roles.map(role => role.normalized_name) : []
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Gabim i brendshëm gjatë autentikimit.' });
  }
};

module.exports = authMiddleware;