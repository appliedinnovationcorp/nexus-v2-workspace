const jwt = require('jsonwebtoken');
const { UnauthenticatedError, ForbiddenError } = require('../utils/errors');

const authenticateUser = async (req, res, next) => {
  // Check for token in headers
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request object
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Not authorized to access this route');
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
