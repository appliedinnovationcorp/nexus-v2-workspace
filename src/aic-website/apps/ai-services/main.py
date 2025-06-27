"""
AIC AI Services - FastAPI Application
Core AI/ML microservices for the AIC platform
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from prometheus_client import make_asgi_app, Counter, Histogram, Gauge
import structlog

# Import routers
from routers import (
    content_generation,
    lead_scoring,
    personalization,
    search_enhancement,
    model_inference,
    analytics
)

# Import services
from services.llm_service import LLMService
from services.vector_service import VectorService
from services.personalization_service import PersonalizationService
from core.config import get_settings
from core.monitoring import setup_monitoring
from core.database import init_databases, close_databases

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Metrics
REQUEST_COUNT = Counter('aic_ai_requests_total', 'Total AI service requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('aic_ai_request_duration_seconds', 'AI service request duration')
ACTIVE_CONNECTIONS = Gauge('aic_ai_active_connections', 'Active AI service connections')

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("🚀 Starting AIC AI Services...")
    
    # Initialize databases and services
    await init_databases()
    
    # Initialize AI services
    settings = get_settings()
    app.state.llm_service = LLMService(settings)
    app.state.vector_service = VectorService(settings)
    # app.state.personalization_service = PersonalizationService(settings)  # Will implement later
    
    # Setup monitoring
    setup_monitoring()
    
    logger.info("✅ AIC AI Services started successfully")
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down AIC AI Services...")
    await close_databases()
    logger.info("✅ AIC AI Services shutdown complete")

# Create FastAPI application
app = FastAPI(
    title="AIC AI Services",
    description="Advanced AI/ML microservices for Applied Innovation Corporation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3100",  # Express.js backend
        "https://aicorp.com",
        "https://smb.aicorp.com",
        "https://enterprise.aicorp.com",
        "https://nexus.aicorp.com",
        "https://investors.aicorp.com",
        "https://admin.aicorp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Middleware for request tracking
@app.middleware("http")
async def track_requests(request, call_next):
    """Track request metrics"""
    ACTIVE_CONNECTIONS.inc()
    
    with REQUEST_DURATION.time():
        response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    ACTIVE_CONNECTIONS.dec()
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "aic-ai-services",
        "version": "1.0.0",
        "timestamp": "2025-01-01T00:00:00Z"
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with service status"""
    try:
        # Check AI services
        llm_status = await app.state.llm_service.health_check()
        vector_status = await app.state.vector_service.health_check()
        personalization_status = await app.state.personalization_service.health_check()
        
        return {
            "status": "healthy",
            "services": {
                "llm": llm_status,
                "vector": vector_status,
                "personalization": personalization_status
            },
            "timestamp": "2025-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

# Include routers
app.include_router(
    content_generation.router,
    prefix="/api/v1/content",
    tags=["Content Generation"]
)

app.include_router(
    lead_scoring.router,
    prefix="/api/v1/leads",
    tags=["Lead Scoring"]
)

app.include_router(
    personalization.router,
    prefix="/api/v1/personalization",
    tags=["Personalization"]
)

app.include_router(
    search_enhancement.router,
    prefix="/api/v1/search",
    tags=["Search Enhancement"]
)

app.include_router(
    model_inference.router,
    prefix="/api/v1/inference",
    tags=["Model Inference"]
)

app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["AI Analytics"]
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "request_id": getattr(request.state, "request_id", None)
        }
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "AIC AI Services",
        "description": "Advanced AI/ML microservices for Applied Innovation Corporation",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }

if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )
