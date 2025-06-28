"""
Authentication Service - JWT-based authentication and authorization
Handles user registration, login, token management, and session handling
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import jwt
import bcrypt
import redis
import asyncio
import logging
import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, generate_latest
import os
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("auth-service")

# Environment validation
def validate_environment():
    """Validate required environment variables"""
    required_vars = {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "REDIS_URL": os.getenv("REDIS_URL"),
        "JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY")
    }
    
    missing_vars = [var for var, value in required_vars.items() if not value]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        if os.getenv("ENVIRONMENT", "development") == "production":
            sys.exit(1)
    
    # Check for default secrets in production
    if (os.getenv("ENVIRONMENT") == "production" and 
        (not os.getenv("JWT_SECRET_KEY") or 
         os.getenv("JWT_SECRET_KEY") == "your-secret-key-change-in-production")):
        logger.error("JWT_SECRET_KEY must be set to a secure value in production")
        sys.exit(1)

# Run environment validation
validate_environment()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/auth_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Initialize FastAPI
app = FastAPI(
    title="Authentication Service",
    description="JWT-based authentication and authorization service",
    version="1.0.0"
)

# Configure CORS based on environment
if ENVIRONMENT == "production":
    # Stricter CORS for production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://aicorp.com",
            "https://api.aicorp.com",
            "https://admin.aicorp.com"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
else:
    # More permissive for development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Database setup
try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logger.info("Database connection established")
except Exception as e:
    logger.error(f"Failed to connect to database: {e}")
    if ENVIRONMENT == "production":
        sys.exit(1)

# Redis setup
try:
    import redis as redis_sync
    redis_client = redis_sync.from_url(REDIS_URL)
    redis_client.ping()  # Test connection
    logger.info("Redis connection established")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    if ENVIRONMENT == "production":
        sys.exit(1)

# Security
security = HTTPBearer()

# OpenTelemetry setup
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
jaeger_exporter = JaegerExporter(
    agent_host_name=os.getenv("JAEGER_HOST", "jaeger-agent"),
    agent_port=int(os.getenv("JAEGER_PORT", "6831")),
)
span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Metrics
auth_requests_counter = Counter('auth_requests_total', 'Total authentication requests', ['endpoint', 'status'])
auth_duration = Histogram('auth_request_duration_seconds', 'Authentication request duration', ['endpoint'])

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    token = Column(Text, nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_revoked = Column(Boolean, default=False)

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created or verified")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    if ENVIRONMENT == "production":
        sys.exit(1)

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    last_login: Optional[datetime]

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenRefresh(BaseModel):
    refresh_token: str

# Password utilities
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Create a refresh token"""
    data = {
        "user_id": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(data, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
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

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    return user

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "auth-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    with tracer.start_as_current_span("register_user") as span:
        span.set_attribute("email", user_data.email)
        
        with auth_duration.labels(endpoint="register").time():
            # Check if user already exists
            existing_user = db.query(User).filter(
                (User.email == user_data.email) | (User.username == user_data.username)
            ).first()
            
            if existing_user:
                auth_requests_counter.labels(endpoint="register", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email or username already exists"
                )
            
            # Create new user
            hashed_password = hash_password(user_data.password)
            db_user = User(
                email=user_data.email,
                username=user_data.username,
                hashed_password=hashed_password,
                full_name=user_data.full_name
            )
            
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
            auth_requests_counter.labels(endpoint="register", status="success").inc()
            
            return UserResponse(
                id=db_user.id,
                email=db_user.email,
                username=db_user.username,
                full_name=db_user.full_name,
                is_active=db_user.is_active,
                is_verified=db_user.is_verified,
                role=db_user.role,
                created_at=db_user.created_at,
                last_login=db_user.last_login
            )

@app.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return tokens"""
    with tracer.start_as_current_span("login_user") as span:
        span.set_attribute("email", user_credentials.email)
        
        with auth_duration.labels(endpoint="login").time():
            # Find user
            user = db.query(User).filter(User.email == user_credentials.email).first()
            
            if not user or not verify_password(user_credentials.password, user.hashed_password):
                auth_requests_counter.labels(endpoint="login", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            if not user.is_active:
                auth_requests_counter.labels(endpoint="login", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is disabled"
                )
            
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            db.commit()
            
            # Create tokens
            access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
            refresh_token = create_refresh_token(user.id)
            
            # Store refresh token
            db_refresh_token = RefreshToken(
                user_id=user.id,
                token=refresh_token,
                expires_at=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.add(db_refresh_token)
            db.commit()
            
            # Cache user session in Redis
            redis_client.setex(
                f"user_session:{user.id}",
                JWT_EXPIRE_MINUTES * 60,
                f"{user.email}:{user.role}"
            )
            
            auth_requests_counter.labels(endpoint="login", status="success").inc()
            
            return Token(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=JWT_EXPIRE_MINUTES * 60
            )

@app.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    with tracer.start_as_current_span("refresh_token"):
        with auth_duration.labels(endpoint="refresh").time():
            # Verify refresh token
            payload = verify_token(token_data.refresh_token)
            
            if payload.get("type") != "refresh":
                auth_requests_counter.labels(endpoint="refresh", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            user_id = payload.get("user_id")
            if not user_id:
                auth_requests_counter.labels(endpoint="refresh", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Check if refresh token exists and is not revoked
            db_refresh_token = db.query(RefreshToken).filter(
                RefreshToken.token == token_data.refresh_token,
                RefreshToken.is_revoked == False
            ).first()
            
            if not db_refresh_token:
                auth_requests_counter.labels(endpoint="refresh", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or revoked refresh token"
                )
            
            # Get user
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                auth_requests_counter.labels(endpoint="refresh", status="error").inc()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or disabled"
                )
            
            # Create new tokens
            access_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
            new_refresh_token = create_refresh_token(user.id)
            
            # Revoke old refresh token and create new one
            db_refresh_token.is_revoked = True
            new_db_refresh_token = RefreshToken(
                user_id=user.id,
                token=new_refresh_token,
                expires_at=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.add(new_db_refresh_token)
            db.commit()
            
            auth_requests_counter.labels(endpoint="refresh", status="success").inc()
            
            return Token(
                access_token=access_token,
                refresh_token=new_refresh_token,
                expires_in=JWT_EXPIRE_MINUTES * 60
            )

@app.post("/logout")
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout user and revoke tokens"""
    with tracer.start_as_current_span("logout_user"):
        token = credentials.credentials
        payload = verify_token(token)
        user_id = payload.get("sub")
        
        if user_id:
            # Revoke all refresh tokens for the user
            db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False
            ).update({"is_revoked": True})
            db.commit()
            
            # Remove user session from Redis
            redis_client.delete(f"user_session:{user_id}")
        
        auth_requests_counter.labels(endpoint="logout", status="success").inc()
        return {"message": "Successfully logged out"}

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    with tracer.start_as_current_span("get_current_user_info"):
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            role=current_user.role,
            created_at=current_user.created_at,
            last_login=current_user.last_login
        )

@app.get("/verify-token")
async def verify_user_token(current_user: User = Depends(get_current_user)):
    """Verify if token is valid"""
    with tracer.start_as_current_span("verify_token"):
        return {
            "valid": True,
            "user_id": current_user.id,
            "email": current_user.email,
            "role": current_user.role
        }

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
