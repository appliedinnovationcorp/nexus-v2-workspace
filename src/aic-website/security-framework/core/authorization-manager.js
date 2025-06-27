/**
 * Authorization Manager - Advanced Security Framework
 * Implements RBAC, ABAC, and fine-grained permission management
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class AuthorizationManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableRBAC: config.enableRBAC !== false,
      enableABAC: config.enableABAC || false,
      enableResourcePermissions: config.enableResourcePermissions !== false,
      enableTemporaryAccess: config.enableTemporaryAccess || false,
      defaultDenyAll: config.defaultDenyAll !== false,
      cachePermissions: config.cachePermissions !== false,
      cacheTTL: config.cacheTTL || 300000, // 5 minutes
      ...config
    };
    
    // Role definitions
    this.roles = new Map();
    this.permissions = new Map();
    this.roleHierarchy = new Map();
    this.resourcePermissions = new Map();
    this.temporaryAccess = new Map();
    this.permissionCache = new Map();
    this.policies = new Map();
    
    this.initializeDefaultRoles();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default roles and permissions
   */
  initializeDefaultRoles() {
    // Define default permissions
    const defaultPermissions = [
      // User management
      'user:create', 'user:read', 'user:update', 'user:delete',
      'user:list', 'user:profile:read', 'user:profile:update',
      
      // Content management
      'content:create', 'content:read', 'content:update', 'content:delete',
      'content:publish', 'content:unpublish', 'content:moderate',
      
      // System administration
      'system:admin', 'system:config', 'system:logs', 'system:metrics',
      'system:backup', 'system:restore',
      
      // API access
      'api:read', 'api:write', 'api:admin',
      
      // Security management
      'security:audit', 'security:config', 'security:monitor',
      
      // File management
      'file:upload', 'file:download', 'file:delete', 'file:manage'
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission, {
        id: permission,
        name: permission,
        description: `Permission for ${permission}`,
        createdAt: new Date()
      });
    });

    // Define default roles
    const defaultRoles = [
      {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access',
        permissions: defaultPermissions,
        isSystemRole: true
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Administrative access',
        permissions: [
          'user:create', 'user:read', 'user:update', 'user:list',
          'content:create', 'content:read', 'content:update', 'content:delete',
          'content:publish', 'content:unpublish', 'content:moderate',
          'api:read', 'api:write',
          'file:upload', 'file:download', 'file:delete', 'file:manage',
          'system:logs', 'system:metrics'
        ],
        isSystemRole: true
      },
      {
        id: 'editor',
        name: 'Content Editor',
        description: 'Content management access',
        permissions: [
          'content:create', 'content:read', 'content:update',
          'content:publish', 'content:unpublish',
          'file:upload', 'file:download',
          'api:read', 'api:write'
        ],
        isSystemRole: true
      },
      {
        id: 'moderator',
        name: 'Content Moderator',
        description: 'Content moderation access',
        permissions: [
          'content:read', 'content:moderate',
          'user:read', 'user:list',
          'api:read'
        ],
        isSystemRole: true
      },
      {
        id: 'user',
        name: 'Regular User',
        description: 'Basic user access',
        permissions: [
          'content:read',
          'user:profile:read', 'user:profile:update',
          'file:upload', 'file:download',
          'api:read'
        ],
        isSystemRole: true
      },
      {
        id: 'guest',
        name: 'Guest User',
        description: 'Limited read-only access',
        permissions: [
          'content:read',
          'api:read'
        ],
        isSystemRole: true
      }
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, {
        ...role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Set up role hierarchy
    this.roleHierarchy.set('super_admin', ['admin', 'editor', 'moderator', 'user', 'guest']);
    this.roleHierarchy.set('admin', ['editor', 'moderator', 'user', 'guest']);
    this.roleHierarchy.set('editor', ['user', 'guest']);
    this.roleHierarchy.set('moderator', ['user', 'guest']);
    this.roleHierarchy.set('user', ['guest']);
  }

  /**
   * Initialize default ABAC policies
   */
  initializeDefaultPolicies() {
    const defaultPolicies = [
      {
        id: 'owner_access',
        name: 'Owner Access Policy',
        description: 'Users can access their own resources',
        condition: (subject, resource, action, context) => {
          return resource.ownerId === subject.id;
        }
      },
      {
        id: 'time_based_access',
        name: 'Time-based Access Policy',
        description: 'Access restricted to business hours',
        condition: (subject, resource, action, context) => {
          const hour = new Date().getHours();
          return hour >= 9 && hour <= 17; // 9 AM to 5 PM
        }
      },
      {
        id: 'ip_whitelist',
        name: 'IP Whitelist Policy',
        description: 'Access restricted to whitelisted IPs',
        condition: (subject, resource, action, context) => {
          const allowedIPs = ['192.168.1.0/24', '10.0.0.0/8'];
          return this.isIPAllowed(context.clientIP, allowedIPs);
        }
      },
      {
        id: 'department_access',
        name: 'Department Access Policy',
        description: 'Users can only access resources from their department',
        condition: (subject, resource, action, context) => {
          return subject.department === resource.department;
        }
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Initialize the authorization manager
   */
  async initialize() {
    // Setup cache cleanup
    if (this.config.cachePermissions) {
      setInterval(() => {
        this.cleanupPermissionCache();
      }, this.config.cacheTTL);
    }

    // Setup temporary access cleanup
    if (this.config.enableTemporaryAccess) {
      setInterval(() => {
        this.cleanupTemporaryAccess();
      }, 60000); // Every minute
    }

    this.emit('initialized', { timestamp: new Date().toISOString() });
  }

  /**
   * Check if user has permission
   */
  async hasPermission(subject, permission, resource = null, context = {}) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(subject, permission, resource);
      if (this.config.cachePermissions && this.permissionCache.has(cacheKey)) {
        const cached = this.permissionCache.get(cacheKey);
        if (cached.expiresAt > Date.now()) {
          return cached.result;
        }
        this.permissionCache.delete(cacheKey);
      }

      let hasAccess = false;

      // Check RBAC permissions
      if (this.config.enableRBAC) {
        hasAccess = await this.checkRBACPermission(subject, permission);
      }

      // Check resource-specific permissions
      if (!hasAccess && this.config.enableResourcePermissions && resource) {
        hasAccess = await this.checkResourcePermission(subject, permission, resource);
      }

      // Check temporary access
      if (!hasAccess && this.config.enableTemporaryAccess) {
        hasAccess = await this.checkTemporaryAccess(subject, permission, resource);
      }

      // Check ABAC policies
      if (this.config.enableABAC) {
        const abacResult = await this.evaluateABACPolicies(subject, resource, permission, context);
        hasAccess = hasAccess || abacResult;
      }

      // Apply default deny policy
      if (this.config.defaultDenyAll && !hasAccess) {
        hasAccess = false;
      }

      // Cache result
      if (this.config.cachePermissions) {
        this.permissionCache.set(cacheKey, {
          result: hasAccess,
          expiresAt: Date.now() + this.config.cacheTTL
        });
      }

      // Emit authorization event
      this.emit(hasAccess ? 'authzSuccess' : 'authzFailure', {
        subject: subject.id,
        permission,
        resource: resource?.id,
        hasAccess,
        timestamp: new Date().toISOString()
      });

      return hasAccess;

    } catch (error) {
      this.emit('authzError', {
        subject: subject.id,
        permission,
        resource: resource?.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Default to deny on error
      return false;
    }
  }

  /**
   * Check RBAC permission
   */
  async checkRBACPermission(subject, permission) {
    if (!subject.roles || subject.roles.length === 0) {
      return false;
    }

    // Check direct role permissions
    for (const roleId of subject.roles) {
      const role = this.roles.get(roleId);
      if (role && role.permissions.includes(permission)) {
        return true;
      }

      // Check inherited permissions from role hierarchy
      const inheritedRoles = this.roleHierarchy.get(roleId) || [];
      for (const inheritedRoleId of inheritedRoles) {
        const inheritedRole = this.roles.get(inheritedRoleId);
        if (inheritedRole && inheritedRole.permissions.includes(permission)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check resource-specific permission
   */
  async checkResourcePermission(subject, permission, resource) {
    const resourceKey = `${resource.type}:${resource.id}`;
    const resourcePerms = this.resourcePermissions.get(resourceKey);
    
    if (!resourcePerms) {
      return false;
    }

    // Check direct user permissions
    const userPerms = resourcePerms.users?.[subject.id];
    if (userPerms && userPerms.includes(permission)) {
      return true;
    }

    // Check role-based resource permissions
    if (subject.roles) {
      for (const roleId of subject.roles) {
        const rolePerms = resourcePerms.roles?.[roleId];
        if (rolePerms && rolePerms.includes(permission)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check temporary access
   */
  async checkTemporaryAccess(subject, permission, resource) {
    const accessKey = `${subject.id}:${permission}:${resource?.id || '*'}`;
    const tempAccess = this.temporaryAccess.get(accessKey);
    
    if (!tempAccess) {
      return false;
    }

    // Check if access has expired
    if (tempAccess.expiresAt < new Date()) {
      this.temporaryAccess.delete(accessKey);
      return false;
    }

    return true;
  }

  /**
   * Evaluate ABAC policies
   */
  async evaluateABACPolicies(subject, resource, action, context) {
    for (const [policyId, policy] of this.policies) {
      try {
        if (await policy.condition(subject, resource, action, context)) {
          return true;
        }
      } catch (error) {
        console.error(`Error evaluating policy ${policyId}:`, error);
      }
    }
    return false;
  }

  /**
   * Grant temporary access
   */
  async grantTemporaryAccess(subjectId, permission, resourceId, duration, grantedBy) {
    const accessKey = `${subjectId}:${permission}:${resourceId || '*'}`;
    const expiresAt = new Date(Date.now() + duration);
    
    this.temporaryAccess.set(accessKey, {
      subjectId,
      permission,
      resourceId,
      expiresAt,
      grantedBy,
      grantedAt: new Date()
    });

    this.emit('temporaryAccessGranted', {
      subjectId,
      permission,
      resourceId,
      expiresAt,
      grantedBy,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Revoke temporary access
   */
  async revokeTemporaryAccess(subjectId, permission, resourceId) {
    const accessKey = `${subjectId}:${permission}:${resourceId || '*'}`;
    const removed = this.temporaryAccess.delete(accessKey);
    
    if (removed) {
      this.emit('temporaryAccessRevoked', {
        subjectId,
        permission,
        resourceId,
        timestamp: new Date().toISOString()
      });
    }
    
    return removed;
  }

  /**
   * Create custom role
   */
  async createRole(roleData) {
    const role = {
      id: roleData.id || crypto.randomUUID(),
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions || [],
      isSystemRole: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.roles.set(role.id, role);
    
    this.emit('roleCreated', {
      roleId: role.id,
      roleName: role.name,
      timestamp: new Date().toISOString()
    });

    return role;
  }

  /**
   * Update role
   */
  async updateRole(roleId, updates) {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystemRole) {
      throw new Error('Cannot modify system roles');
    }

    const updatedRole = {
      ...role,
      ...updates,
      updatedAt: new Date()
    };

    this.roles.set(roleId, updatedRole);
    
    // Clear permission cache for this role
    this.clearCacheForRole(roleId);

    this.emit('roleUpdated', {
      roleId,
      updates,
      timestamp: new Date().toISOString()
    });

    return updatedRole;
  }

  /**
   * Delete role
   */
  async deleteRole(roleId) {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystemRole) {
      throw new Error('Cannot delete system roles');
    }

    this.roles.delete(roleId);
    this.clearCacheForRole(roleId);

    this.emit('roleDeleted', {
      roleId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Set resource permissions
   */
  async setResourcePermissions(resourceType, resourceId, permissions) {
    const resourceKey = `${resourceType}:${resourceId}`;
    this.resourcePermissions.set(resourceKey, permissions);

    this.emit('resourcePermissionsSet', {
      resourceType,
      resourceId,
      permissions,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add ABAC policy
   */
  async addPolicy(policy) {
    this.policies.set(policy.id, policy);
    
    this.emit('policyAdded', {
      policyId: policy.id,
      policyName: policy.name,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Remove ABAC policy
   */
  async removePolicy(policyId) {
    const removed = this.policies.delete(policyId);
    
    if (removed) {
      this.emit('policyRemoved', {
        policyId,
        timestamp: new Date().toISOString()
      });
    }
    
    return removed;
  }

  /**
   * Get user effective permissions
   */
  async getUserEffectivePermissions(subject) {
    const permissions = new Set();

    // Get permissions from roles
    if (subject.roles) {
      for (const roleId of subject.roles) {
        const role = this.roles.get(roleId);
        if (role) {
          role.permissions.forEach(perm => permissions.add(perm));
          
          // Add inherited permissions
          const inheritedRoles = this.roleHierarchy.get(roleId) || [];
          for (const inheritedRoleId of inheritedRoles) {
            const inheritedRole = this.roles.get(inheritedRoleId);
            if (inheritedRole) {
              inheritedRole.permissions.forEach(perm => permissions.add(perm));
            }
          }
        }
      }
    }

    return Array.from(permissions);
  }

  /**
   * Middleware for Express.js
   */
  middleware(requiredPermission, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const resource = options.getResource ? options.getResource(req) : null;
        const context = {
          clientIP: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
          ...options.context
        };

        const hasPermission = await this.hasPermission(
          req.user,
          requiredPermission,
          resource,
          context
        );

        if (!hasPermission) {
          return res.status(403).json({ 
            error: 'Insufficient permissions',
            required: requiredPermission
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({ error: 'Authorization error' });
      }
    };
  }

  /**
   * Utility methods
   */
  generateCacheKey(subject, permission, resource) {
    return `${subject.id}:${permission}:${resource?.id || '*'}`;
  }

  clearCacheForRole(roleId) {
    for (const [key, value] of this.permissionCache) {
      // This is a simplified cache invalidation
      // In production, you'd want more sophisticated cache management
      this.permissionCache.delete(key);
    }
  }

  cleanupPermissionCache() {
    const now = Date.now();
    for (const [key, value] of this.permissionCache) {
      if (value.expiresAt <= now) {
        this.permissionCache.delete(key);
      }
    }
  }

  cleanupTemporaryAccess() {
    const now = new Date();
    for (const [key, access] of this.temporaryAccess) {
      if (access.expiresAt < now) {
        this.temporaryAccess.delete(key);
      }
    }
  }

  isIPAllowed(clientIP, allowedRanges) {
    // Simplified IP checking - in production, use a proper CIDR library
    return allowedRanges.some(range => {
      if (range.includes('/')) {
        // CIDR notation - simplified check
        const [network, bits] = range.split('/');
        return clientIP.startsWith(network.split('.').slice(0, Math.floor(bits / 8)).join('.'));
      }
      return clientIP === range;
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      roles: this.roles.size,
      permissions: this.permissions.size,
      policies: this.policies.size,
      temporaryAccess: this.temporaryAccess.size,
      cacheSize: this.permissionCache.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { AuthorizationManager };
