"""
Configuration management for AIC AI Services
"""

import os
from functools import lru_cache
from typing import Optional, List
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "AIC AI Services"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    workers: int = Field(default=1, env="WORKERS")
    
    # Security
    secret_key: str = Field(env="SECRET_KEY")
    api_key_header: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    allowed_hosts: List[str] = Field(default=["*"], env="ALLOWED_HOSTS")
    
    # Database URLs
    postgres_url: str = Field(env="DATABASE_URL")
    mongodb_url: str = Field(env="MONGODB_URL")
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # AI/ML Service Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_org_id: Optional[str] = Field(default=None, env="OPENAI_ORG_ID")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    ollama_host: str = Field(default="http://localhost:11434", env="OLLAMA_HOST")
    
    # Vector Database
    pinecone_api_key: Optional[str] = Field(default=None, env="PINECONE_API_KEY")
    pinecone_environment: Optional[str] = Field(default=None, env="PINECONE_ENVIRONMENT")
    pinecone_index_name: str = Field(default="aic-embeddings", env="PINECONE_INDEX_NAME")
    
    # Search Service
    meilisearch_host: str = Field(default="http://localhost:7700", env="MEILISEARCH_HOST")
    meilisearch_api_key: str = Field(default="masterKey", env="MEILISEARCH_API_KEY")
    
    # Model Configuration
    default_llm_model: str = Field(default="gpt-4-turbo-preview", env="DEFAULT_LLM_MODEL")
    default_embedding_model: str = Field(default="text-embedding-3-small", env="DEFAULT_EMBEDDING_MODEL")
    max_tokens: int = Field(default=2000, env="MAX_TOKENS")
    temperature: float = Field(default=0.7, env="TEMPERATURE")
    
    # Performance
    max_concurrent_requests: int = Field(default=100, env="MAX_CONCURRENT_REQUESTS")
    request_timeout: int = Field(default=300, env="REQUEST_TIMEOUT")  # 5 minutes
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # 1 hour
    
    # Monitoring
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Feature Flags
    enable_content_generation: bool = Field(default=True, env="ENABLE_CONTENT_GENERATION")
    enable_lead_scoring: bool = Field(default=True, env="ENABLE_LEAD_SCORING")
    enable_personalization: bool = Field(default=True, env="ENABLE_PERSONALIZATION")
    enable_search_enhancement: bool = Field(default=True, env="ENABLE_SEARCH_ENHANCEMENT")
    
    # Rate Limiting
    rate_limit_requests: int = Field(default=1000, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # 1 hour
    
    # Content Generation Settings
    content_max_length: int = Field(default=5000, env="CONTENT_MAX_LENGTH")
    content_cache_enabled: bool = Field(default=True, env="CONTENT_CACHE_ENABLED")
    
    # Lead Scoring Settings
    lead_score_threshold: float = Field(default=0.7, env="LEAD_SCORE_THRESHOLD")
    lead_score_cache_ttl: int = Field(default=1800, env="LEAD_SCORE_CACHE_TTL")  # 30 minutes
    
    # Personalization Settings
    personalization_cache_ttl: int = Field(default=900, env="PERSONALIZATION_CACHE_TTL")  # 15 minutes
    max_recommendations: int = Field(default=10, env="MAX_RECOMMENDATIONS")
    
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
    workers: int = 1


class ProductionSettings(Settings):
    """Production environment settings"""
    debug: bool = False
    log_level: str = "INFO"
    workers: int = 4
    

class TestingSettings(Settings):
    """Testing environment settings"""
    debug: bool = True
    log_level: str = "DEBUG"
    postgres_url: str = "postgresql://test:test@localhost:5432/aic_test"
    mongodb_url: str = "mongodb://test:test@localhost:27017/aic_test"
    redis_url: str = "redis://localhost:6379/1"


def get_environment_settings() -> Settings:
    """Get settings based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()
