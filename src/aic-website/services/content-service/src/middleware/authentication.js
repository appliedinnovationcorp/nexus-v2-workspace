const jwt = require('jsonwebtoken');
const { UnauthenticatedError, ForbiddenError } = require('../utils/errors');

// Validate JWT_SECRET exists and is strong enough
const validateJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Check for common weak secrets
  const weakSecrets = [
    'your-secret-key-change-in-production',
    'aic-jwt-secret-development-key',
    'dev-only-jwt-secret-CHANGE-IN-PRODUCTION',
    'secret',
    'password',
    '123456'
  ];
  
  if (weakSecrets.includes(secret)) {
    throw new Error('JWT_SECRET is using a weak/default value. Please generate a strong secret.');
  }
  
  return secret;
};

// Initialize and validate secret on module load
const JWT_SECRET = validateJWTSecret();

const authenticateUser = async (req, res, next) => {
  // Check for token in headers
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
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
