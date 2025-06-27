"""
User Service
Handles user profile management, preferences, and user-related operations
"""

import os
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import asyncpg
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, generate_latest
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
import httpx
import logging

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

# Initialize FastAPI app
app = FastAPI(
    title="User Service",
    description="Handles user profile management and preferences",
    version="1.0.0"
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

# Prometheus metrics
REQUEST_COUNT = Counter('user_requests_total', 'Total user service requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('user_request_duration_seconds', 'Request duration')
PROFILE_UPDATES = Counter('user_profile_updates_total', 'Total profile updates')
PREFERENCE_UPDATES = Counter('user_preference_updates_total', 'Total preference updates')

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/user_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")

# Database connection pool
db_pool = None
redis_client = None
http_client = None

# Pydantic models
class UserProfile(BaseModel):
    id: str
    email: str
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
    created_at: datetime
    updated_at: datetime

class UserProfileUpdate(BaseModel):
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

class UserPreferences(BaseModel):
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

class UserPreferencesUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    newsletter: Optional[bool] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    privacy_level: Optional[str] = None
    two_factor_enabled: Optional[bool] = None

class UserActivity(BaseModel):
    id: str
    user_id: str
    activity_type: str
    description: str
    metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int

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
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_activities (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    activity_type VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    metadata JSONB,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create indexes
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);")
            
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = redis.from_url(REDIS_URL)
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise

async def init_http_client():
    """Initialize HTTP client"""
    global http_client
    http_client = httpx.AsyncClient()

# Authentication dependency
async def verify_token(authorization: str):
    """Verify JWT token with auth service"""
    try:
        headers = {"Authorization": authorization}
        response = await http_client.post(
            f"{AUTH_SERVICE_URL}/verify-token",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )

async def get_current_user(authorization: str = Depends(lambda: None)):
    """Get current user from token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    token_data = await verify_token(authorization)
    return token_data

# Utility functions
async def log_user_activity(user_id: str, activity_type: str, description: str, 
                          metadata: Optional[Dict] = None, ip_address: Optional[str] = None,
                          user_agent: Optional[str] = None):
    """Log user activity"""
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO user_activities (user_id, activity_type, description, metadata, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, user_id, activity_type, description, metadata, ip_address, user_agent)
    except Exception as e:
        logger.error(f"Failed to log user activity: {e}")

# API Routes
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    await init_db()
    await init_redis()
    await init_http_client()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()
    if http_client:
        await http_client.aclose()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        # Check Redis connection
        await redis_client.ping()
        
        return {"status": "healthy", "service": "user-service"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    with tracer.start_as_current_span("get_user_profile"):
        REQUEST_COUNT.labels(method="GET", endpoint="/profile").inc()
        
        try:
            user_id = current_user["user_id"]
            
            # Try to get from cache first
            cached_profile = await redis_client.get(f"profile:{user_id}")
            if cached_profile:
                import json
                return UserProfile(**json.loads(cached_profile))
            
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
                
                profile_data = UserProfile(**dict(profile))
                
                # Cache the profile
                await redis_client.setex(
                    f"profile:{user_id}",
                    300,  # 5 minutes
                    profile_data.json()
                )
                
                return profile_data
                
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve profile"
            )

@app.put("/profile", response_model=UserProfile)
async def update_user_profile(profile_update: UserProfileUpdate,
                            current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    with tracer.start_as_current_span("update_user_profile"):
        REQUEST_COUNT.labels(method="PUT", endpoint="/profile").inc()
        PROFILE_UPDATES.inc()
        
        try:
            user_id = current_user["user_id"]
            
            # Build update query dynamically
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
                
                # Clear cache
                await redis_client.delete(f"profile:{user_id}")
                
                # Log activity
                await log_user_activity(
                    user_id, "profile_update", "Profile updated",
                    {"updated_fields": list(profile_update.dict(exclude_unset=True).keys())}
                )
                
                return UserProfile(**dict(updated_profile))
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )

@app.get("/preferences", response_model=UserPreferences)
async def get_user_preferences(current_user: dict = Depends(get_current_user)):
    """Get user preferences"""
    with tracer.start_as_current_span("get_user_preferences"):
        REQUEST_COUNT.labels(method="GET", endpoint="/preferences").inc()
        
        try:
            user_id = current_user["user_id"]
            
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
                
                return UserPreferences(**dict(preferences))
                
        except Exception as e:
            logger.error(f"Failed to get user preferences: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve preferences"
            )

@app.put("/preferences", response_model=UserPreferences)
async def update_user_preferences(preferences_update: UserPreferencesUpdate,
                                current_user: dict = Depends(get_current_user)):
    """Update user preferences"""
    with tracer.start_as_current_span("update_user_preferences"):
        REQUEST_COUNT.labels(method="PUT", endpoint="/preferences").inc()
        PREFERENCE_UPDATES.inc()
        
        try:
            user_id = current_user["user_id"]
            
            # Build update query dynamically
            update_fields = []
            values = []
            param_count = 1
            
            for field, value in preferences_update.dict(exclude_unset=True).items():
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
                UPDATE user_preferences 
                SET {', '.join(update_fields)}
                WHERE user_id = ${param_count + 1}
                RETURNING *
            """
            
            async with db_pool.acquire() as conn:
                updated_preferences = await conn.fetchrow(query, *values)
                
                if not updated_preferences:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Preferences not found"
                    )
                
                # Log activity
                await log_user_activity(
                    user_id, "preferences_update", "Preferences updated",
                    {"updated_fields": list(preferences_update.dict(exclude_unset=True).keys())}
                )
                
                return UserPreferences(**dict(updated_preferences))
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update user preferences: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update preferences"
            )

@app.get("/activity", response_model=List[UserActivity])
async def get_user_activity(current_user: dict = Depends(get_current_user),
                          limit: int = Query(50, le=100),
                          offset: int = Query(0, ge=0)):
    """Get user activity history"""
    with tracer.start_as_current_span("get_user_activity"):
        REQUEST_COUNT.labels(method="GET", endpoint="/activity").inc()
        
        try:
            user_id = current_user["user_id"]
            
            async with db_pool.acquire() as conn:
                activities = await conn.fetch("""
                    SELECT * FROM user_activities 
                    WHERE user_id = $1 
                    ORDER BY created_at DESC 
                    LIMIT $2 OFFSET $3
                """, user_id, limit, offset)
                
                return [UserActivity(**dict(activity)) for activity in activities]
                
        except Exception as e:
            logger.error(f"Failed to get user activity: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve activity"
            )

@app.get("/stats", response_model=UserStats)
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics (admin only)"""
    with tracer.start_as_current_span("get_user_stats"):
        REQUEST_COUNT.labels(method="GET", endpoint="/stats").inc()
        
        # Check if user is admin
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        try:
            async with db_pool.acquire() as conn:
                # Get total users
                total_users = await conn.fetchval(
                    "SELECT COUNT(*) FROM user_profiles"
                )
                
                # Get active users (users with activity in last 30 days)
                active_users = await conn.fetchval("""
                    SELECT COUNT(DISTINCT user_id) FROM user_activities 
                    WHERE created_at > NOW() - INTERVAL '30 days'
                """)
                
                # Get new users today
                new_users_today = await conn.fetchval("""
                    SELECT COUNT(*) FROM user_profiles 
                    WHERE created_at::date = CURRENT_DATE
                """)
                
                # Get new users this week
                new_users_this_week = await conn.fetchval("""
                    SELECT COUNT(*) FROM user_profiles 
                    WHERE created_at > NOW() - INTERVAL '7 days'
                """)
                
                # Get new users this month
                new_users_this_month = await conn.fetchval("""
                    SELECT COUNT(*) FROM user_profiles 
                    WHERE created_at > NOW() - INTERVAL '30 days'
                """)
                
                return UserStats(
                    total_users=total_users or 0,
                    active_users=active_users or 0,
                    new_users_today=new_users_today or 0,
                    new_users_this_week=new_users_this_week or 0,
                    new_users_this_month=new_users_this_month or 0
                )
                
        except Exception as e:
            logger.error(f"Failed to get user stats: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve statistics"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
