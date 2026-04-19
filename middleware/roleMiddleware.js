// authMiddleware duhet me run para roleMiddleware


const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (allowedRoles.length === 0) {
      return res.status(500).json({ message: 'No roles defined for this route.' });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(r => r.toUpperCase())
      : [];

    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    const hasRole = normalizedAllowed.some(role =>
      userRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${normalizedAllowed.join(', ')}`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;