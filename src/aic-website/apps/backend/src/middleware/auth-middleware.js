// Authentication middleware for Express

const { verifyToken } = require('../auth/keycloak-config');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    
    // Extract token
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }
    
    const token = parts[1];
    
    // Verify token
    const tokenInfo = await verifyToken(token);
    
    if (!tokenInfo || !tokenInfo.active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Add user info to request
    req.user = {
      id: tokenInfo.sub,
      username: tokenInfo.preferred_username,
      email: tokenInfo.email,
      roles: tokenInfo.realm_access?.roles || [],
      isAdmin: tokenInfo.realm_access?.roles?.includes('admin') || false,
      isEditor: tokenInfo.realm_access?.roles?.includes('editor') || false,
      scope: tokenInfo.scope,
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      req.user.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Resource-based authorization middleware
const authorizeResource = (resource, scope) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
      // In a real implementation, this would check permissions against Keycloak's Authorization Services
      // For simplicity, we're using role-based checks here
      
      // Admin can do anything
      if (req.user.isAdmin) {
        return next();
      }
      
      // Editor can read and write content
      if (req.user.isEditor && resource === 'content' && ['read', 'write'].includes(scope)) {
        return next();
      }
      
      // Regular users can read content and manage their own user data
      if (req.user.roles.includes('user')) {
        if (resource === 'content' && scope === 'read') {
          return next();
        }
        
        if (resource === 'user' && req.params.userId === req.user.id) {
          return next();
        }
      }
      
      // Permission denied
      return res.status(403).json({ error: 'Insufficient permissions for this resource' });
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeResource,
};
