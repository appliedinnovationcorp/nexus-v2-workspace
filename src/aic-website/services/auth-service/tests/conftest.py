import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import jwt
from datetime import datetime, timedelta, timezone

# Add parent directory to path to import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import after path setup
from main import app, get_db, Base, User, RefreshToken

# Test database
TEST_DATABASE_URL = "sqlite:///./test.db"

# Test JWT settings
TEST_JWT_SECRET_KEY = "test-secret-key"
TEST_JWT_ALGORITHM = "HS256"
TEST_JWT_EXPIRE_MINUTES = 30

# Override environment variables for testing
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["JWT_SECRET_KEY"] = TEST_JWT_SECRET_KEY
os.environ["JWT_ALGORITHM"] = TEST_JWT_ALGORITHM
os.environ["JWT_EXPIRE_MINUTES"] = str(TEST_JWT_EXPIRE_MINUTES)
os.environ["ENVIRONMENT"] = "test"

# Create test database engine
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new session for each test
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Drop tables after test
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Create test client
    with TestClient(app) as client:
        yield client
    
    # Reset dependency override
    app.dependency_overrides = {}

@pytest.fixture(scope="function")
def test_user(db):
    # Create a test user
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="$2b$12$CwjpBV0GZRjCAUU7dp.RpuoYKnKxNOhQI4OGAEABtYH8XCDx5OBpS",  # "password"
        full_name="Test User",
        is_active=True,
        is_verified=True,
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def access_token(test_user):
    # Create a test access token
    payload = {
        "sub": test_user.id,
        "email": test_user.email,
        "role": test_user.role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TEST_JWT_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, TEST_JWT_SECRET_KEY, algorithm=TEST_JWT_ALGORITHM)

@pytest.fixture(scope="function")
def refresh_token(test_user, db):
    # Create a test refresh token
    payload = {
        "user_id": test_user.id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    token = jwt.encode(payload, TEST_JWT_SECRET_KEY, algorithm=TEST_JWT_ALGORITHM)
    
    # Add to database
    db_refresh_token = RefreshToken(
        user_id=test_user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    db.add(db_refresh_token)
    db.commit()
    
    return token

# Mock Redis for testing
@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    class MockRedis:
        def __init__(self):
            self.data = {}
        
        def setex(self, key, exp, value):
            self.data[key] = value
            return True
        
        def get(self, key):
            return self.data.get(key)
        
        def delete(self, key):
            if key in self.data:
                del self.data[key]
            return True
        
        def ping(self):
            return True
    
    mock_redis_client = MockRedis()
    
    # Patch the redis client
    import main
    monkeypatch.setattr(main, "redis_client", mock_redis_client)
    
    return mock_redis_client
