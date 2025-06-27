"""
Authentication Service
Handles user authentication, authorization, and JWT token management
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import bcrypt
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
    title="Authentication Service",
    description="Handles user authentication and authorization",
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
REQUEST_COUNT = Counter('auth_requests_total', 'Total authentication requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('auth_request_duration_seconds', 'Request duration')
LOGIN_ATTEMPTS = Counter('auth_login_attempts_total', 'Total login attempts', ['status'])
TOKEN_VALIDATIONS = Counter('auth_token_validations_total', 'Total token validations', ['status'])

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/auth_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Security
security = HTTPBearer()

# Database connection pool
db_pool = None
redis_client = None

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_id: str
    email: str
    role: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime
    is_active: bool

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Database initialization
async def init_db():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        
        # Create tables if they don't exist
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    role VARCHAR(50) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    token_hash VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    token_hash VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
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

# Utility functions
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: Dict[str, Any]) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Check if token is blacklisted in Redis
    is_blacklisted = await redis_client.get(f"blacklist:{token}")
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    
    # Get user from database
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1 AND is_active = true",
            user_id
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
    
    TOKEN_VALIDATIONS.labels(status="success").inc()
    return dict(user)

# API Routes
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    await init_db()
    await init_redis()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        # Check Redis connection
        await redis_client.ping()
        
        return {"status": "healthy", "service": "auth-service"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    with tracer.start_as_current_span("register_user"):
        REQUEST_COUNT.labels(method="POST", endpoint="/register").inc()
        
        try:
            # Check if user already exists
            async with db_pool.acquire() as conn:
                existing_user = await conn.fetchrow(
                    "SELECT id FROM users WHERE email = $1",
                    user_data.email
                )
                
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="User with this email already exists"
                    )
                
                # Hash password and create user
                password_hash = hash_password(user_data.password)
                
                user = await conn.fetchrow("""
                    INSERT INTO users (email, password_hash, first_name, last_name, role)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                """, user_data.email, password_hash, user_data.first_name, 
                    user_data.last_name, user_data.role)
                
                logger.info(f"User registered: {user_data.email}")
                return UserResponse(**dict(user))
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )

@app.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin):
    """Authenticate user and return JWT token"""
    with tracer.start_as_current_span("login_user"):
        REQUEST_COUNT.labels(method="POST", endpoint="/login").inc()
        
        try:
            async with db_pool.acquire() as conn:
                user = await conn.fetchrow(
                    "SELECT * FROM users WHERE email = $1 AND is_active = true",
                    login_data.email
                )
                
                if not user or not verify_password(login_data.password, user['password_hash']):
                    LOGIN_ATTEMPTS.labels(status="failed").inc()
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )
                
                # Create JWT token
                token_data = {
                    "sub": str(user['id']),
                    "email": user['email'],
                    "role": user['role']
                }
                access_token = create_access_token(token_data)
                
                # Store session in database
                await conn.execute("""
                    INSERT INTO user_sessions (user_id, token_hash, expires_at)
                    VALUES ($1, $2, $3)
                """, user['id'], hash_password(access_token), 
                    datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS))
                
                LOGIN_ATTEMPTS.labels(status="success").inc()
                logger.info(f"User logged in: {login_data.email}")
                
                return TokenResponse(
                    access_token=access_token,
                    token_type="bearer",
                    expires_in=JWT_EXPIRATION_HOURS * 3600,
                    user_id=str(user['id']),
                    email=user['email'],
                    role=user['role']
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )

@app.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user),
                     credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user and blacklist token"""
    with tracer.start_as_current_span("logout_user"):
        REQUEST_COUNT.labels(method="POST", endpoint="/logout").inc()
        
        try:
            token = credentials.credentials
            
            # Add token to blacklist in Redis
            await redis_client.setex(
                f"blacklist:{token}",
                JWT_EXPIRATION_HOURS * 3600,
                "true"
            )
            
            # Remove session from database
            async with db_pool.acquire() as conn:
                await conn.execute(
                    "DELETE FROM user_sessions WHERE user_id = $1",
                    current_user['id']
                )
            
            logger.info(f"User logged out: {current_user['email']}")
            return {"message": "Successfully logged out"}
            
        except Exception as e:
            logger.error(f"Logout failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Logout failed"
            )

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    with tracer.start_as_current_span("get_current_user_info"):
        REQUEST_COUNT.labels(method="GET", endpoint="/me").inc()
        return UserResponse(**current_user)

@app.post("/verify-token")
async def verify_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token validity"""
    with tracer.start_as_current_span("verify_token"):
        REQUEST_COUNT.labels(method="POST", endpoint="/verify-token").inc()
        
        try:
            token = credentials.credentials
            payload = verify_token(token)
            
            # Check if token is blacklisted
            is_blacklisted = await redis_client.get(f"blacklist:{token}")
            if is_blacklisted:
                TOKEN_VALIDATIONS.labels(status="blacklisted").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
            
            TOKEN_VALIDATIONS.labels(status="valid").inc()
            return {
                "valid": True,
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role"),
                "expires_at": payload.get("exp")
            }
            
        except HTTPException:
            TOKEN_VALIDATIONS.labels(status="invalid").inc()
            raise
        except Exception as e:
            TOKEN_VALIDATIONS.labels(status="error").inc()
            logger.error(f"Token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token verification failed"
            )

@app.post("/password-reset")
async def request_password_reset(reset_data: PasswordReset):
    """Request password reset"""
    with tracer.start_as_current_span("request_password_reset"):
        REQUEST_COUNT.labels(method="POST", endpoint="/password-reset").inc()
        
        try:
            async with db_pool.acquire() as conn:
                user = await conn.fetchrow(
                    "SELECT id FROM users WHERE email = $1 AND is_active = true",
                    reset_data.email
                )
                
                if user:
                    # Generate reset token
                    reset_token = create_access_token({
                        "sub": str(user['id']),
                        "type": "password_reset"
                    })
                    
                    # Store reset token
                    await conn.execute("""
                        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                        VALUES ($1, $2, $3)
                    """, user['id'], hash_password(reset_token),
                        datetime.utcnow() + timedelta(hours=1))
                    
                    # In a real implementation, send email here
                    logger.info(f"Password reset requested for: {reset_data.email}")
                
                # Always return success to prevent email enumeration
                return {"message": "If the email exists, a reset link has been sent"}
                
        except Exception as e:
            logger.error(f"Password reset request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password reset request failed"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
