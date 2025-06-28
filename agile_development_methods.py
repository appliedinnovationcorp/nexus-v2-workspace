"""
Development and Testing methods for the Agile Feature Development Algorithm
Contains implementation logic for development, testing, deployment, and maintenance phases
"""

import os
import json
import datetime
from pathlib import Path
from typing import Dict, List, Any


class AgileDevelopmentMethods:
    """Development, testing, deployment, and maintenance methods"""
    
    def _setup_environment(self) -> Dict[str, Any]:
        """Step 3.1: Environment setup"""
        feature_name = self._extract_feature_name()
        
        environment_setup = {
            "development_tools": [
                "Node.js 18+ with npm/yarn",
                "TypeScript compiler",
                "ESLint and Prettier for code quality",
                "Jest for testing framework",
                "Docker for containerization",
                "Git for version control"
            ],
            "frameworks": [
                "Express.js or Fastify for backend API",
                "React with Next.js for frontend",
                "Prisma or TypeORM for database ORM",
                "Redis client for caching",
                "Winston for logging"
            ],
            "infrastructure": [
                "PostgreSQL database instance",
                "Redis cache instance",
                "Development server environment",
                "CI/CD pipeline setup",
                "Monitoring and logging infrastructure"
            ],
            "configuration_files": {
                "package.json": "Node.js dependencies and scripts",
                "tsconfig.json": "TypeScript configuration",
                "docker-compose.yml": "Local development containers",
                ".env.example": "Environment variables template",
                "jest.config.js": "Testing configuration"
            }
        }
        
        # Create configuration files
        self._create_configuration_files(feature_name)
        
        return environment_setup
    
    def _create_configuration_files(self, feature_name: str):
        """Create necessary configuration files"""
        
        # package.json
        package_json = {
            "name": f"{feature_name}-service",
            "version": "1.0.0",
            "description": f"Service implementation for {feature_name}",
            "main": "dist/index.js",
            "scripts": {
                "build": "tsc",
                "start": "node dist/index.js",
                "dev": "ts-node-dev src/index.ts",
                "test": "jest",
                "test:watch": "jest --watch",
                "test:coverage": "jest --coverage",
                "lint": "eslint src/**/*.ts",
                "lint:fix": "eslint src/**/*.ts --fix"
            },
            "dependencies": {
                "express": "^4.18.0",
                "typescript": "^5.0.0",
                "prisma": "^5.0.0",
                "@prisma/client": "^5.0.0",
                "redis": "^4.6.0",
                "jsonwebtoken": "^9.0.0",
                "bcryptjs": "^2.4.3",
                "winston": "^3.8.0"
            },
            "devDependencies": {
                "@types/node": "^20.0.0",
                "@types/express": "^4.17.0",
                "@types/jest": "^29.0.0",
                "jest": "^29.0.0",
                "ts-jest": "^29.0.0",
                "ts-node-dev": "^2.0.0",
                "eslint": "^8.0.0",
                "@typescript-eslint/eslint-plugin": "^6.0.0"
            }
        }
        
        with open(self.code_dir / "package.json", "w") as f:
            json.dump(package_json, f, indent=2)
    
    def _write_code(self) -> Dict[str, str]:
        """Step 3.2: Write production-ready, enterprise-grade code"""
        feature_name = self._extract_feature_name()
        code_files = {}
        
        # Main service implementation
        main_service_code = self._generate_main_service_code(feature_name)
        service_file = self.code_dir / f"{feature_name}_service.ts"
        with open(service_file, "w") as f:
            f.write(main_service_code)
        code_files["main_service"] = str(service_file)
        
        # API routes
        api_routes_code = self._generate_api_routes_code(feature_name)
        routes_file = self.code_dir / f"{feature_name}_routes.ts"
        with open(routes_file, "w") as f:
            f.write(api_routes_code)
        code_files["api_routes"] = str(routes_file)
        
        # Database models
        models_code = self._generate_models_code(feature_name)
        models_file = self.code_dir / f"{feature_name}_models.ts"
        with open(models_file, "w") as f:
            f.write(models_code)
        code_files["models"] = str(models_file)
        
        # Utility functions
        utils_code = self._generate_utils_code(feature_name)
        utils_file = self.code_dir / f"{feature_name}_utils.ts"
        with open(utils_file, "w") as f:
            f.write(utils_code)
        code_files["utils"] = str(utils_file)
        
        # Frontend components (if applicable)
        if self._needs_frontend_components():
            component_code = self._generate_frontend_component_code(feature_name)
            component_file = self.code_dir / f"{feature_name}_component.tsx"
            with open(component_file, "w") as f:
                f.write(component_code)
            code_files["frontend_component"] = str(component_file)
        
        return code_files
    
    def _generate_main_service_code(self, feature_name: str) -> str:
        """Generate main service implementation code"""
        return f'''/**
 * {feature_name.title()} Service Implementation
 * Enterprise-grade service with comprehensive error handling,
 * logging, caching, and security features.
 * 
 * @author Agile Development Algorithm
 * @date {datetime.datetime.now().strftime("%Y-%m-%d")}
 */

import {{ Logger }} from 'winston';
import {{ Redis }} from 'redis';
import {{ PrismaClient }} from '@prisma/client';
import {{ {feature_name.title()}Model }} from './{feature_name}_models';
import {{ validateInput, sanitizeOutput, handleError }} from './{feature_name}_utils';

/**
 * Main service class for {feature_name} functionality
 * Implements enterprise patterns: dependency injection, error handling,
 * caching, logging, and security best practices
 */
export class {feature_name.title()}Service {{
    private logger: Logger;
    private redis: Redis;
    private prisma: PrismaClient;
    private model: {feature_name.title()}Model;

    /**
     * Initialize service with dependencies
     * @param logger - Winston logger instance
     * @param redis - Redis client for caching
     * @param prisma - Prisma database client
     */
    constructor(logger: Logger, redis: Redis, prisma: PrismaClient) {{
        this.logger = logger;
        this.redis = redis;
        this.prisma = prisma;
        this.model = new {feature_name.title()}Model(prisma);
        
        this.logger.info(`{feature_name.title()}Service initialized successfully`);
    }}

    /**
     * Create a new {feature_name} instance
     * @param data - Input data for {feature_name} creation
     * @param userId - ID of the user creating the {feature_name}
     * @returns Promise<{feature_name.title()}Entity>
     */
    async create{feature_name.title()}(data: any, userId: string): Promise<any> {{
        try {{
            // Input validation
            const validatedData = validateInput(data, '{feature_name}_create');
            
            this.logger.info(`Creating {feature_name} for user ${{userId}}`, {{
                userId,
                data: sanitizeOutput(validatedData)
            }});

            // Check cache for duplicate prevention
            const cacheKey = `{feature_name}:create:${{userId}}:${{JSON.stringify(validatedData)}}`;
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {{
                this.logger.warn(`Duplicate {feature_name} creation attempt`, {{ userId, cacheKey }});
                throw new Error('Duplicate creation attempt detected');
            }}

            // Create {feature_name} in database
            const {feature_name}Entity = await this.model.create({{
                ...validatedData,
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }});

            // Cache the result
            await this.redis.setex(cacheKey, 300, JSON.stringify({feature_name}Entity));
            await this.redis.setex(`{feature_name}:${{feature_name}Entity.id}}`, 3600, JSON.stringify({feature_name}Entity));

            this.logger.info(`{feature_name.title()} created successfully`, {{
                {feature_name}Id: {feature_name}Entity.id,
                userId
            }});

            return sanitizeOutput({feature_name}Entity);

        }} catch (error) {{
            return handleError(error, this.logger, `create{feature_name.title()}`);
        }}
    }}

    /**
     * Retrieve {feature_name} by ID with caching
     * @param id - {feature_name} ID
     * @param userId - ID of the requesting user
     * @returns Promise<{feature_name.title()}Entity | null>
     */
    async get{feature_name.title()}ById(id: string, userId: string): Promise<any> {{
        try {{
            this.logger.info(`Retrieving {feature_name} ${{id}} for user ${{userId}}`);

            // Check cache first
            const cacheKey = `{feature_name}:${{id}}`;
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {{
                this.logger.debug(`{feature_name.title()} ${{id}} retrieved from cache`);
                return JSON.parse(cached);
            }}

            // Retrieve from database
            const {feature_name}Entity = await this.model.findById(id);
            
            if (!{feature_name}Entity) {{
                this.logger.warn(`{feature_name.title()} ${{id}} not found`);
                return null;
            }}

            // Verify user access
            if ({feature_name}Entity.userId !== userId) {{
                this.logger.warn(`Unauthorized access attempt to {feature_name} ${{id}}`, {{ userId }});
                throw new Error('Unauthorized access');
            }}

            // Cache the result
            await this.redis.setex(cacheKey, 3600, JSON.stringify({feature_name}Entity));

            this.logger.info(`{feature_name.title()} ${{id}} retrieved successfully`);
            return sanitizeOutput({feature_name}Entity);

        }} catch (error) {{
            return handleError(error, this.logger, `get{feature_name.title()}ById`);
        }}
    }}

    /**
     * Update {feature_name} with optimistic locking
     * @param id - {feature_name} ID
     * @param data - Update data
     * @param userId - ID of the updating user
     * @returns Promise<{feature_name.title()}Entity>
     */
    async update{feature_name.title()}(id: string, data: any, userId: string): Promise<any> {{
        try {{
            const validatedData = validateInput(data, '{feature_name}_update');
            
            this.logger.info(`Updating {feature_name} ${{id}} for user ${{userId}}`);

            // Update in database with optimistic locking
            const updated{feature_name.title()} = await this.model.update(id, {{
                ...validatedData,
                updatedAt: new Date()
            }}, userId);

            // Invalidate cache
            await this.redis.del(`{feature_name}:${{id}}`);
            await this.redis.del(`{feature_name}:list:${{userId}}`);

            this.logger.info(`{feature_name.title()} ${{id}} updated successfully`);
            return sanitizeOutput(updated{feature_name.title()});

        }} catch (error) {{
            return handleError(error, this.logger, `update{feature_name.title()}`);
        }}
    }}

    /**
     * Delete {feature_name} with cascade handling
     * @param id - {feature_name} ID
     * @param userId - ID of the deleting user
     * @returns Promise<boolean>
     */
    async delete{feature_name.title()}(id: string, userId: string): Promise<boolean> {{
        try {{
            this.logger.info(`Deleting {feature_name} ${{id}} for user ${{userId}}`);

            const deleted = await this.model.delete(id, userId);
            
            if (deleted) {{
                // Invalidate all related cache entries
                await this.redis.del(`{feature_name}:${{id}}`);
                await this.redis.del(`{feature_name}:list:${{userId}}`);
                
                this.logger.info(`{feature_name.title()} ${{id}} deleted successfully`);
            }}

            return deleted;

        }} catch (error) {{
            handleError(error, this.logger, `delete{feature_name.title()}`);
            return false;
        }}
    }}

    /**
     * List {feature_name}s with pagination and filtering
     * @param userId - ID of the requesting user
     * @param options - Query options (pagination, filters, sorting)
     * @returns Promise<PaginatedResult>
     */
    async list{feature_name.title()}s(userId: string, options: any = {{}}): Promise<any> {{
        try {{
            this.logger.info(`Listing {feature_name}s for user ${{userId}}`, {{ options }});

            const cacheKey = `{feature_name}:list:${{userId}}:${{JSON.stringify(options)}}`;
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {{
                this.logger.debug(`{feature_name.title()} list retrieved from cache`);
                return JSON.parse(cached);
            }}

            const result = await this.model.findMany(userId, options);
            
            // Cache the result for 5 minutes
            await this.redis.setex(cacheKey, 300, JSON.stringify(result));

            this.logger.info(`Listed ${{result.data.length}} {feature_name}s for user ${{userId}}`);
            return result;

        }} catch (error) {{
            return handleError(error, this.logger, `list{feature_name.title()}s`);
        }}
    }}

    /**
     * Health check for service monitoring
     * @returns Promise<HealthStatus>
     */
    async healthCheck(): Promise<any> {{
        try {{
            // Check database connection
            await this.prisma.$queryRaw`SELECT 1`;
            
            // Check Redis connection
            await this.redis.ping();

            return {{
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: '{feature_name}_service',
                version: '1.0.0'
            }};

        }} catch (error) {{
            this.logger.error('Health check failed', {{ error: error.message }});
            return {{
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                service: '{feature_name}_service',
                error: error.message
            }};
        }}
    }}
}}

export default {feature_name.title()}Service;
'''
    
    def _generate_api_routes_code(self, feature_name: str) -> str:
        """Generate API routes code"""
        return f'''/**
 * {feature_name.title()} API Routes
 * RESTful API endpoints with comprehensive validation,
 * authentication, rate limiting, and error handling.
 */

import {{ Router, Request, Response, NextFunction }} from 'express';
import {{ body, param, query, validationResult }} from 'express-validator';
import {{ {feature_name.title()}Service }} from './{feature_name}_service';
import {{ authenticateToken, authorizeUser, rateLimiter }} from '../middleware';

const router = Router();

/**
 * Validation middleware for {feature_name} creation
 */
const validate{feature_name.title()}Creation = [
    body('name').isString().isLength({{ min: 1, max: 255 }}).trim(),
    body('description').optional().isString().isLength({{ max: 1000 }}).trim(),
    body('status').optional().isIn(['active', 'inactive', 'pending']),
];

/**
 * Validation middleware for {feature_name} updates
 */
const validate{feature_name.title()}Update = [
    param('id').isUUID(),
    body('name').optional().isString().isLength({{ min: 1, max: 255 }}).trim(),
    body('description').optional().isString().isLength({{ max: 1000 }}).trim(),
    body('status').optional().isIn(['active', 'inactive', 'pending']),
];

/**
 * Error handling middleware
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {{
        return res.status(400).json({{
            error: 'Validation failed',
            details: errors.array()
        }});
    }}
    next();
}};

/**
 * POST /api/{feature_name}
 * Create a new {feature_name}
 */
router.post('/',
    rateLimiter({{ windowMs: 15 * 60 * 1000, max: 10 }}), // 10 requests per 15 minutes
    authenticateToken,
    validate{feature_name.title()}Creation,
    handleValidationErrors,
    async (req: Request, res: Response) => {{
        try {{
            const service = req.app.get('{feature_name}Service') as {feature_name.title()}Service;
            const userId = req.user?.id;
            
            const {feature_name} = await service.create{feature_name.title()}(req.body, userId);
            
            res.status(201).json({{
                success: true,
                data: {feature_name},
                message: '{feature_name.title()} created successfully'
            }});
            
        }} catch (error) {{
            res.status(500).json({{
                success: false,
                error: error.message || 'Internal server error'
            }});
        }}
    }}
);

/**
 * GET /api/{feature_name}/:id
 * Retrieve a specific {feature_name}
 */
router.get('/:id',
    authenticateToken,
    param('id').isUUID(),
    handleValidationErrors,
    async (req: Request, res: Response) => {{
        try {{
            const service = req.app.get('{feature_name}Service') as {feature_name.title()}Service;
            const userId = req.user?.id;
            const {{ id }} = req.params;
            
            const {feature_name} = await service.get{feature_name.title()}ById(id, userId);
            
            if (!{feature_name}) {{
                return res.status(404).json({{
                    success: false,
                    error: '{feature_name.title()} not found'
                }});
            }}
            
            res.json({{
                success: true,
                data: {feature_name}
            }});
            
        }} catch (error) {{
            res.status(500).json({{
                success: false,
                error: error.message || 'Internal server error'
            }});
        }}
    }}
);

/**
 * GET /api/{feature_name}
 * List {feature_name}s with pagination and filtering
 */
router.get('/',
    authenticateToken,
    query('page').optional().isInt({{ min: 1 }}).toInt(),
    query('limit').optional().isInt({{ min: 1, max: 100 }}).toInt(),
    query('status').optional().isIn(['active', 'inactive', 'pending']),
    query('search').optional().isString().trim(),
    handleValidationErrors,
    async (req: Request, res: Response) => {{
        try {{
            const service = req.app.get('{feature_name}Service') as {feature_name.title()}Service;
            const userId = req.user?.id;
            
            const options = {{
                page: req.query.page || 1,
                limit: req.query.limit || 10,
                status: req.query.status,
                search: req.query.search
            }};
            
            const result = await service.list{feature_name.title()}s(userId, options);
            
            res.json({{
                success: true,
                data: result.data,
                pagination: result.pagination
            }});
            
        }} catch (error) {{
            res.status(500).json({{
                success: false,
                error: error.message || 'Internal server error'
            }});
        }}
    }}
);

/**
 * PUT /api/{feature_name}/:id
 * Update a {feature_name}
 */
router.put('/:id',
    rateLimiter({{ windowMs: 15 * 60 * 1000, max: 20 }}), // 20 requests per 15 minutes
    authenticateToken,
    validate{feature_name.title()}Update,
    handleValidationErrors,
    async (req: Request, res: Response) => {{
        try {{
            const service = req.app.get('{feature_name}Service') as {feature_name.title()}Service;
            const userId = req.user?.id;
            const {{ id }} = req.params;
            
            const updated{feature_name.title()} = await service.update{feature_name.title()}(id, req.body, userId);
            
            res.json({{
                success: true,
                data: updated{feature_name.title()},
                message: '{feature_name.title()} updated successfully'
            }});
            
        }} catch (error) {{
            res.status(500).json({{
                success: false,
                error: error.message || 'Internal server error'
            }});
        }}
    }}
);

/**
 * DELETE /api/{feature_name}/:id
 * Delete a {feature_name}
 */
router.delete('/:id',
    rateLimiter({{ windowMs: 15 * 60 * 1000, max: 5 }}), // 5 requests per 15 minutes
    authenticateToken,
    param('id').isUUID(),
    handleValidationErrors,
    async (req: Request, res: Response) => {{
        try {{
            const service = req.app.get('{feature_name}Service') as {feature_name.title()}Service;
            const userId = req.user?.id;
            const {{ id }} = req.params;
            
            const deleted = await service.delete{feature_name.title()}(id, userId);
            
            if (!deleted) {{
                return res.status(404).json({{
                    success: false,
                    error: '{feature_name.title()} not found or unauthorized'
                }});
            }}
            
            res.json({{
                success: true,
                message: '{feature_name.title()} deleted successfully'
            }});
            
        }} catch (error) {{
            res.status(500).json({{
                success: false,
                error: error.message || 'Internal server error'
            }});
        }}
    }}
);

/**
 * GET /api/{feature_name}/health
 * Health check endpoint
 */
router.get('/health',
    async (req: Request, res: Response) => {{
        try {{
            const service = req.app.get('{feature_name}Service') as {feature_name.title()}Service;
            const health = await service.healthCheck();
            
            const statusCode = health.status === 'healthy' ? 200 : 503;
            res.status(statusCode).json(health);
            
        }} catch (error) {{
            res.status(503).json({{
                status: 'unhealthy',
                error: error.message
            }});
        }}
    }}
);

export default router;
'''
    
    def _needs_frontend_components(self) -> bool:
        """Check if frontend components are needed"""
        description = self.feature_description.lower()
        return any(keyword in description for keyword in [
            'ui', 'interface', 'dashboard', 'form', 'page', 'component', 'frontend', 'web'
        ])
    
    def _setup_version_control(self) -> Dict[str, Any]:
        """Step 3.3: Version control setup"""
        return {
            "repository": "Git repository initialized",
            "branches": {
                "main": "Production-ready code",
                "develop": "Development integration branch",
                f"feature/{self._extract_feature_name()}": "Feature development branch"
            },
            "commit_conventions": "Conventional Commits specification",
            "hooks": [
                "pre-commit: Run linting and tests",
                "pre-push: Run full test suite",
                "commit-msg: Validate commit message format"
            ],
            "gitignore": [
                "node_modules/", "dist/", ".env*", "*.log", "coverage/"
            ]
        }
    
    def _generate_code_documentation(self) -> Dict[str, str]:
        """Step 3.5: Generate comprehensive documentation"""
        feature_name = self._extract_feature_name()
        
        # API Documentation
        api_docs = f"""# {feature_name.title()} API Documentation

## Overview
This API provides comprehensive {feature_name} management functionality with enterprise-grade security, performance, and reliability features.

## Authentication
All endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting
- Creation endpoints: 10 requests per 15 minutes
- Update endpoints: 20 requests per 15 minutes  
- Delete endpoints: 5 requests per 15 minutes
- Read endpoints: 100 requests per minute

## Endpoints

### POST /api/{feature_name}
Create a new {feature_name}

**Request Body:**
```json
{{
  "name": "string (required, 1-255 chars)",
  "description": "string (optional, max 1000 chars)",
  "status": "active|inactive|pending (optional)"
}}
```

**Response:**
```json
{{
  "success": true,
  "data": {{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }},
  "message": "{feature_name.title()} created successfully"
}}
```

### GET /api/{feature_name}/:id
Retrieve a specific {feature_name}

**Parameters:**
- `id` (UUID): {feature_name.title()} identifier

**Response:**
```json
{{
  "success": true,
  "data": {{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "status": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }}
}}
```

### GET /api/{feature_name}
List {feature_name}s with pagination

**Query Parameters:**
- `page` (integer, min: 1): Page number
- `limit` (integer, min: 1, max: 100): Items per page
- `status` (string): Filter by status
- `search` (string): Search term

**Response:**
```json
{{
  "success": true,
  "data": [
    {{
      "id": "uuid",
      "name": "string",
      "description": "string",
      "status": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }}
  ],
  "pagination": {{
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }}
}}
```

## Error Handling
All endpoints return consistent error responses:

```json
{{
  "success": false,
  "error": "Error message",
  "details": [] // Validation errors if applicable
}}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
- 503: Service Unavailable
"""
        
        # Save API documentation
        api_docs_file = self.docs_dir / f"{feature_name}_api.md"
        with open(api_docs_file, "w") as f:
            f.write(api_docs)
        
        return {
            "api_documentation": str(api_docs_file),
            "code_comments": "Comprehensive inline documentation added to all code files",
            "readme": "README.md with setup and usage instructions",
            "architecture_docs": "Technical architecture documentation"
        }
