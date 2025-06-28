"""
Enhanced User Service
Demonstrates fixed backend service patterns:
1. Consistent Redis usage patterns
2. Comprehensive input validation
3. Proper API versioning strategy
"""

import os
import asyncio
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
import asyncpg
from prometheus_client import Counter, Histogram, generate_latest
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
import httpx
import logging

# Import our enhanced shared services
from shared.redis_service import RedisService, CacheConfig, cache_result
from shared.validation_middleware import (
    InputValidator, ValidationMiddleware, ValidationConfig,
    BaseValidationModel, PaginationParams, SortParams
)
from shared.api_versioning import (
    VersionedFastAPI, VersionManager, VersionConfig, VersioningStrategy,
    APIVersion, VersionStatus, get_api_version, VersionedSerializer
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name=os.getenv("JAEGER_AGENT_HOST", "jaeger-agent"),
    agent_port=int(os.getenv("JAEGER_AGENT_PORT", "6831")),
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/user_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")

# Initialize enhanced services
redis_config = CacheConfig(
    default_ttl=300,  # 5 minutes
    long_ttl=3600,    # 1 hour
    short_ttl=60      # 1 minute
)
redis_service = RedisService(REDIS_URL, redis_config)

validation_config = ValidationConfig(
    max_string_length=500,
    max_text_length=5000,
    sanitize_html=True
)
input_validator = InputValidator(validation_config)

# API Versioning setup
version_config = VersionConfig(
    default_version="v1",
    latest_version="v2",
    supported_versions=["v1", "v2"],
    strategy=VersioningStrategy.HEADER,
    header_name="API-Version"
)
version_manager = VersionManager(version_config)

# Add version metadata
v1_info = APIVersion(
    version="v1",
    status=VersionStatus.STABLE,
    release_date=date(2024, 1, 1),
    description="Initial user service API"
)
version_manager.add_version_metadata("v1", v1_info)

v2_info = APIVersion(
    version="v2",
    status=VersionStatus.BETA,
    release_date=date(2024, 6, 1),
    description="Enhanced user service with improved validation and caching",
    breaking_changes=[
        "Enhanced response format with metadata",
        "Stricter input validation",
        "Improved error handling"
    ]
)
version_manager.add_version_metadata("v2", v2_info)

# Initialize FastAPI app with versioning
app = VersionedFastAPI(
    version_manager=version_manager,
    title="Enhanced User Service",
    description="User service with consistent Redis, validation, and versioning",
    version="2.0.0"
)

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add validation middleware
app.add_middleware(ValidationMiddleware, config=validation_config)

# Prometheus metrics
REQUEST_COUNT = Counter('user_service_requests_total', 'Total requests', ['method', 'endpoint', 'version'])
PROFILE_UPDATES = Counter('user_profile_updates_total', 'Profile updates', ['version'])
CACHE_HITS = Counter('user_service_cache_hits_total', 'Cache hits', ['operation'])
CACHE_MISSES = Counter('user_service_cache_misses_total', 'Cache misses', ['operation'])

# Database connection pool
db_pool = None
http_client = None

# Enhanced Pydantic models with validation
class UserProfileBase(BaseValidationModel):
    """Base user profile model with validation"""
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return input_validator.validate_phone(v, 'phone')
        return v
    
    @validator('website', 'linkedin_url', 'github_url')
    def validate_urls(cls, v, field):
        if v:
            return input_validator.validate_url(v, field.name)
        return v
    
    @validator('bio')
    def validate_bio(cls, v):
        if v:
            return input_validator.validate_string(v, 'bio', max_length=1000)
        return v

class UserProfile(UserProfileBase):
    """Complete user profile model"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class UserProfileUpdate(BaseModel):
    """User profile update model"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return input_validator.validate_phone(v, 'phone')
        return v
    
    @validator('website', 'linkedin_url', 'github_url')
    def validate_urls(cls, v, field):
        if v:
            return input_validator.validate_url(v, field.name)
        return v

class UserPreferences(BaseValidationModel):
    """User preferences model"""
    user_id: str
    email_notifications: bool = True
    push_notifications: bool = True
    marketing_emails: bool = False
    newsletter: bool = True
    theme: str = "light"
    language: str = "en"
    timezone: str = "UTC"
    privacy_level: str = "public"
    two_factor_enabled: bool = False
    created_at: datetime
    updated_at: datetime
    
    @validator('theme')
    def validate_theme(cls, v):
        allowed_themes = ['light', 'dark', 'auto']
        if v not in allowed_themes:
            raise ValueError(f'Theme must be one of: {", ".join(allowed_themes)}')
        return v
    
    @validator('privacy_level')
    def validate_privacy_level(cls, v):
        allowed_levels = ['public', 'private', 'friends']
        if v not in allowed_levels:
            raise ValueError(f'Privacy level must be one of: {", ".join(allowed_levels)}')
        return v

class UserPreferencesUpdate(BaseModel):
    """User preferences update model"""
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    newsletter: Optional[bool] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    privacy_level: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    
    @validator('theme')
    def validate_theme(cls, v):
        if v is not None:
            allowed_themes = ['light', 'dark', 'auto']
            if v not in allowed_themes:
                raise ValueError(f'Theme must be one of: {", ".join(allowed_themes)}')
        return v

class UserListResponse(BaseModel):
    """User list response with pagination"""
    users: List[UserProfile]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

# Database initialization
async def init_db():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        
        # Create tables if they don't exist
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID UNIQUE NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    bio TEXT,
                    avatar_url TEXT,
                    company VARCHAR(200),
                    job_title VARCHAR(200),
                    location VARCHAR(200),
                    website TEXT,
                    linkedin_url TEXT,
                    github_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_preferences (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID UNIQUE NOT NULL,
                    email_notifications BOOLEAN DEFAULT true,
                    push_notifications BOOLEAN DEFAULT true,
                    marketing_emails BOOLEAN DEFAULT false,
                    newsletter BOOLEAN DEFAULT true,
                    theme VARCHAR(20) DEFAULT 'light',
                    language VARCHAR(10) DEFAULT 'en',
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    privacy_level VARCHAR(20) DEFAULT 'public',
                    two_factor_enabled BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

async def init_http_client():
    """Initialize HTTP client"""
    global http_client
    try:
        http_client = httpx.AsyncClient(timeout=30.0)
        logger.info("HTTP client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize HTTP client: {e}")
        raise

# Enhanced cache operations using consistent Redis patterns
class UserCacheService:
    """Centralized user caching service"""
    
    def __init__(self, redis_service: RedisService):
        self.redis = redis_service
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile from cache"""
        cache_key = f"user:profile:{user_id}"
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            CACHE_HITS.labels(operation="get_profile").inc()
            return cached_data
        
        CACHE_MISSES.labels(operation="get_profile").inc()
        return None
    
    async def set_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Cache user profile"""
        cache_key = f"user:profile:{user_id}"
        return await self.redis.set(cache_key, profile_data, ttl=self.redis.config.default_ttl)
    
    async def invalidate_user_profile(self, user_id: str) -> int:
        """Invalidate user profile cache"""
        cache_key = f"user:profile:{user_id}"
        return await self.redis.delete(cache_key)
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences from cache"""
        cache_key = f"user:preferences:{user_id}"
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            CACHE_HITS.labels(operation="get_preferences").inc()
            return cached_data
        
        CACHE_MISSES.labels(operation="get_preferences").inc()
        return None
    
    async def set_user_preferences(self, user_id: str, preferences_data: Dict[str, Any]) -> bool:
        """Cache user preferences"""
        cache_key = f"user:preferences:{user_id}"
        return await self.redis.set(cache_key, preferences_data, ttl=self.redis.config.default_ttl)
    
    async def invalidate_user_preferences(self, user_id: str) -> int:
        """Invalidate user preferences cache"""
        cache_key = f"user:preferences:{user_id}"
        return await self.redis.delete(cache_key)
    
    async def cache_user_list(self, cache_key: str, users_data: List[Dict[str, Any]]) -> bool:
        """Cache user list with shorter TTL"""
        return await self.redis.set(cache_key, users_data, ttl=self.redis.config.short_ttl)
    
    async def get_user_list(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached user list"""
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            CACHE_HITS.labels(operation="get_user_list").inc()
            return cached_data
        
        CACHE_MISSES.labels(operation="get_user_list").inc()
        return None

# Initialize cache service
user_cache = UserCacheService(redis_service)

# Authentication dependency (mock for example)
async def get_current_user() -> dict:
    """Mock authentication dependency"""
    return {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    await init_db()
    await redis_service.connect()
    await init_http_client()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    if db_pool:
        await db_pool.close()
    await redis_service.disconnect()
    if http_client:
        await http_client.aclose()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check with Redis validation"""
    try:
        # Check database connection
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        # Check Redis connection using consistent pattern
        redis_healthy = await redis_service.health_check()
        if not redis_healthy:
            raise Exception("Redis health check failed")
        
        return {"status": "healthy", "service": "user-service", "redis": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

# Versioned API endpoints
@app.versioned_route("/profile", versions=["v1", "v2"], methods=["GET"])
async def get_user_profile(
    current_user: dict = Depends(get_current_user),
    api_version: str = Depends(get_api_version)
):
    """Get user profile with version-specific response format"""
    with tracer.start_as_current_span("get_user_profile"):
        REQUEST_COUNT.labels(method="GET", endpoint="/profile", version=api_version).inc()
        
        try:
            user_id = input_validator.validate_uuid(current_user["user_id"], "user_id")
            
            # Try cache first using consistent pattern
            cached_profile = await user_cache.get_user_profile(user_id)
            if cached_profile:
                return VersionedSerializer.serialize_for_version(cached_profile, api_version)
            
            # Fetch from database
            async with db_pool.acquire() as conn:
                profile = await conn.fetchrow(
                    "SELECT * FROM user_profiles WHERE user_id = $1",
                    user_id
                )
                
                if not profile:
                    # Create default profile
                    profile = await conn.fetchrow("""
                        INSERT INTO user_profiles (user_id, email, first_name, last_name)
                        VALUES ($1, $2, $3, $4)
                        RETURNING *
                    """, user_id, current_user["email"], 
                        current_user.get("first_name", ""), 
                        current_user.get("last_name", ""))
                
                profile_data = dict(profile)
                
                # Cache using consistent pattern
                await user_cache.set_user_profile(user_id, profile_data)
                
                return VersionedSerializer.serialize_for_version(profile_data, api_version)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve profile"
            )

@app.versioned_route("/profile", versions=["v1", "v2"], methods=["PUT"])
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    api_version: str = Depends(get_api_version)
):
    """Update user profile with enhanced validation"""
    with tracer.start_as_current_span("update_user_profile"):
        REQUEST_COUNT.labels(method="PUT", endpoint="/profile", version=api_version).inc()
        PROFILE_UPDATES.labels(version=api_version).inc()
        
        try:
            user_id = input_validator.validate_uuid(current_user["user_id"], "user_id")
            
            # Build update query dynamically with validation
            update_fields = []
            values = []
            param_count = 1
            
            for field, value in profile_update.dict(exclude_unset=True).items():
                if value is not None:
                    update_fields.append(f"{field} = ${param_count}")
                    values.append(value)
                    param_count += 1
            
            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            update_fields.append(f"updated_at = ${param_count}")
            values.append(datetime.utcnow())
            values.append(user_id)
            
            query = f"""
                UPDATE user_profiles 
                SET {', '.join(update_fields)}
                WHERE user_id = ${param_count + 1}
                RETURNING *
            """
            
            async with db_pool.acquire() as conn:
                updated_profile = await conn.fetchrow(query, *values)
                
                if not updated_profile:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Profile not found"
                    )
                
                # Invalidate cache using consistent pattern
                await user_cache.invalidate_user_profile(user_id)
                
                profile_data = dict(updated_profile)
                return VersionedSerializer.serialize_for_version(profile_data, api_version)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )

@app.versioned_route("/preferences", versions=["v1", "v2"], methods=["GET"])
async def get_user_preferences(
    current_user: dict = Depends(get_current_user),
    api_version: str = Depends(get_api_version)
):
    """Get user preferences with caching"""
    with tracer.start_as_current_span("get_user_preferences"):
        REQUEST_COUNT.labels(method="GET", endpoint="/preferences", version=api_version).inc()
        
        try:
            user_id = input_validator.validate_uuid(current_user["user_id"], "user_id")
            
            # Try cache first
            cached_preferences = await user_cache.get_user_preferences(user_id)
            if cached_preferences:
                return VersionedSerializer.serialize_for_version(cached_preferences, api_version)
            
            async with db_pool.acquire() as conn:
                preferences = await conn.fetchrow(
                    "SELECT * FROM user_preferences WHERE user_id = $1",
                    user_id
                )
                
                if not preferences:
                    # Create default preferences
                    preferences = await conn.fetchrow("""
                        INSERT INTO user_preferences (user_id)
                        VALUES ($1)
                        RETURNING *
                    """, user_id)
                
                preferences_data = dict(preferences)
                
                # Cache preferences
                await user_cache.set_user_preferences(user_id, preferences_data)
                
                return VersionedSerializer.serialize_for_version(preferences_data, api_version)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user preferences: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve preferences"
            )

@app.versioned_route("/users", versions=["v2"], methods=["GET"])
async def list_users(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    api_version: str = Depends(get_api_version)
):
    """List users with pagination (v2 only)"""
    with tracer.start_as_current_span("list_users"):
        REQUEST_COUNT.labels(method="GET", endpoint="/users", version=api_version).inc()
        
        try:
            # Generate cache key
            cache_key = f"users:list:{pagination.page}:{pagination.limit}:{sort.sort_by}:{sort.sort_order}"
            
            # Try cache first
            cached_users = await user_cache.get_user_list(cache_key)
            if cached_users:
                return VersionedSerializer.serialize_for_version(cached_users, api_version)
            
            # Build query with validation
            offset = (pagination.page - 1) * pagination.limit
            
            # Validate sort field
            allowed_sort_fields = ['created_at', 'updated_at', 'first_name', 'last_name', 'email']
            sort_field = sort.sort_by if sort.sort_by in allowed_sort_fields else 'created_at'
            sort_order = 'ASC' if sort.sort_order == 'asc' else 'DESC'
            
            async with db_pool.acquire() as conn:
                # Get total count
                total = await conn.fetchval("SELECT COUNT(*) FROM user_profiles")
                
                # Get users
                query = f"""
                    SELECT * FROM user_profiles 
                    ORDER BY {sort_field} {sort_order}
                    LIMIT $1 OFFSET $2
                """
                
                users = await conn.fetch(query, pagination.limit, offset)
                
                users_data = [dict(user) for user in users]
                
                response_data = {
                    "users": users_data,
                    "total": total,
                    "page": pagination.page,
                    "limit": pagination.limit,
                    "has_next": offset + pagination.limit < total,
                    "has_prev": pagination.page > 1
                }
                
                # Cache the result
                await user_cache.cache_user_list(cache_key, response_data)
                
                return VersionedSerializer.serialize_for_version(response_data, api_version)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to list users: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve users"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
