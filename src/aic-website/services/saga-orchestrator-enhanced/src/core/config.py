"""
Configuration management for the Enhanced Saga Orchestrator
"""

import os
from functools import lru_cache
from typing import List, Optional
from pydantic import BaseSettings, Field, validator
import uuid

class Settings(BaseSettings):
    """Application settings"""
    
    # Basic settings
    app_name: str = "Enhanced Saga Orchestrator"
    version: str = "2.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8080, env="PORT")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Node identification
    node_id: str = Field(default_factory=lambda: str(uuid.uuid4()), env="NODE_ID")
    
    # Database settings
    database_url: str = Field(
        default="postgresql://saga:saga@localhost:5432/saga_orchestrator",
        env="DATABASE_URL"
    )
    
    # Redis settings
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    
    # Event Store settings
    event_store_url: str = Field(
        default="postgresql://saga:saga@localhost:5432/saga_events",
        env="EVENT_STORE_URL"
    )
    
    # Cluster settings
    cluster_enabled: bool = Field(default=False, env="CLUSTER_ENABLED")
    cluster_nodes: List[str] = Field(
        default_factory=list,
        env="CLUSTER_NODES"
    )
    election_timeout: int = Field(default=5000, env="ELECTION_TIMEOUT")
    heartbeat_interval: int = Field(default=1000, env="HEARTBEAT_INTERVAL")
    
    # Security settings
    jwt_secret: str = Field(default="your-secret-key", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration: int = Field(default=3600, env="JWT_EXPIRATION")
    
    # Authentication
    auth_enabled: bool = Field(default=True, env="AUTH_ENABLED")
    rbac_enabled: bool = Field(default=True, env="RBAC_ENABLED")
    
    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_requests: int = Field(default=1000, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")
    
    # Monitoring settings
    metrics_enabled: bool = Field(default=True, env="METRICS_ENABLED")
    tracing_enabled: bool = Field(default=True, env="TRACING_ENABLED")
    jaeger_endpoint: str = Field(
        default="http://localhost:14268/api/traces",
        env="JAEGER_ENDPOINT"
    )
    
    # Saga execution settings
    default_timeout: int = Field(default=300000, env="DEFAULT_TIMEOUT")  # 5 minutes
    max_retries: int = Field(default=3, env="MAX_RETRIES")
    retry_delay: int = Field(default=1000, env="RETRY_DELAY")  # 1 second
    compensation_timeout: int = Field(default=60000, env="COMPENSATION_TIMEOUT")  # 1 minute
    
    # Performance settings
    max_concurrent_sagas: int = Field(default=1000, env="MAX_CONCURRENT_SAGAS")
    batch_size: int = Field(default=100, env="BATCH_SIZE")
    worker_threads: int = Field(default=10, env="WORKER_THREADS")
    
    # Storage settings
    event_retention_days: int = Field(default=90, env="EVENT_RETENTION_DAYS")
    saga_retention_days: int = Field(default=30, env="SAGA_RETENTION_DAYS")
    
    # External service settings
    service_discovery_url: Optional[str] = Field(default=None, env="SERVICE_DISCOVERY_URL")
    consul_url: Optional[str] = Field(default=None, env="CONSUL_URL")
    
    # Notification settings
    webhook_enabled: bool = Field(default=False, env="WEBHOOK_ENABLED")
    webhook_url: Optional[str] = Field(default=None, env="WEBHOOK_URL")
    slack_webhook_url: Optional[str] = Field(default=None, env="SLACK_WEBHOOK_URL")
    
    # Feature flags
    saga_versioning_enabled: bool = Field(default=True, env="SAGA_VERSIONING_ENABLED")
    parallel_execution_enabled: bool = Field(default=True, env="PARALLEL_EXECUTION_ENABLED")
    dynamic_routing_enabled: bool = Field(default=True, env="DYNAMIC_ROUTING_ENABLED")
    saga_composition_enabled: bool = Field(default=True, env="SAGA_COMPOSITION_ENABLED")
    
    @validator("cluster_nodes", pre=True)
    def parse_cluster_nodes(cls, v):
        """Parse cluster nodes from string or list"""
        if isinstance(v, str):
            return [node.strip() for node in v.split(",") if node.strip()]
        return v
    
    @validator("log_level")
    def validate_log_level(cls, v):
        """Validate log level"""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level: {v}")
        return v.upper()
    
    @validator("jwt_secret")
    def validate_jwt_secret(cls, v):
        """Validate JWT secret"""
        if len(v) < 32:
            raise ValueError("JWT secret must be at least 32 characters long")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings"""
    debug: bool = True
    log_level: str = "DEBUG"
    auth_enabled: bool = False
    rate_limit_enabled: bool = False

class ProductionSettings(Settings):
    """Production environment settings"""
    debug: bool = False
    log_level: str = "INFO"
    auth_enabled: bool = True
    rate_limit_enabled: bool = True
    cluster_enabled: bool = True

class TestingSettings(Settings):
    """Testing environment settings"""
    debug: bool = True
    log_level: str = "DEBUG"
    database_url: str = "sqlite:///./test.db"
    redis_url: str = "redis://localhost:6379/1"
    auth_enabled: bool = False
    metrics_enabled: bool = False
    tracing_enabled: bool = False

def get_environment_settings() -> Settings:
    """Get settings based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()
