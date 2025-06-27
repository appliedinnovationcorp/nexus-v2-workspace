"""
Enhanced Saga Orchestrator Service - Production Ready
Enterprise-grade distributed transaction management using the Saga pattern
"""

import asyncio
import logging
import os
import signal
import sys
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from core.config import Settings, get_settings
from core.logging import setup_logging
from core.metrics import setup_metrics
from core.tracing import setup_tracing
from core.security import SecurityManager
from core.cluster import ClusterManager
from api.v1.router import api_router
from services.orchestrator import SagaOrchestrator
from services.event_store import EventStore
from services.state_manager import StateManager
from middleware.auth import AuthMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.request_id import RequestIDMiddleware

# Global instances
orchestrator: SagaOrchestrator = None
cluster_manager: ClusterManager = None
settings: Settings = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global orchestrator, cluster_manager, settings
    
    # Startup
    settings = get_settings()
    setup_logging(settings.log_level)
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("🚀 Starting Enhanced Saga Orchestrator Service")
        
        # Setup monitoring
        setup_metrics()
        setup_tracing(settings.jaeger_endpoint)
        
        # Initialize core services
        event_store = EventStore(settings.event_store_url)
        state_manager = StateManager(settings.database_url, settings.redis_url)
        
        # Initialize orchestrator
        orchestrator = SagaOrchestrator(
            event_store=event_store,
            state_manager=state_manager,
            settings=settings
        )
        
        # Initialize cluster if enabled
        if settings.cluster_enabled:
            cluster_manager = ClusterManager(
                node_id=settings.node_id,
                cluster_nodes=settings.cluster_nodes,
                redis_url=settings.redis_url
            )
            await cluster_manager.start()
            
            # Only start orchestrator on leader node
            if await cluster_manager.is_leader():
                await orchestrator.start()
        else:
            await orchestrator.start()
        
        logger.info("✅ Saga Orchestrator Service started successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to start service: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🛑 Shutting down Saga Orchestrator Service")
        
        if orchestrator:
            await orchestrator.stop()
        
        if cluster_manager:
            await cluster_manager.stop()
        
        logger.info("✅ Saga Orchestrator Service stopped")

# Create FastAPI application
app = FastAPI(
    title="Enhanced Saga Orchestrator Service",
    description="Enterprise-grade distributed transaction management",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Enhanced Saga Orchestrator",
        "version": "2.0.0",
        "status": "running",
        "cluster_enabled": settings.cluster_enabled if settings else False
    }

@app.get("/health")
async def health_check():
    """Basic health check"""
    try:
        # Check orchestrator health
        if orchestrator:
            orchestrator_health = await orchestrator.health_check()
        else:
            orchestrator_health = {"status": "not_initialized"}
        
        # Check cluster health
        cluster_health = {"status": "disabled"}
        if cluster_manager:
            cluster_health = await cluster_manager.health_check()
        
        return {
            "status": "healthy",
            "timestamp": asyncio.get_event_loop().time(),
            "orchestrator": orchestrator_health,
            "cluster": cluster_health
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")

@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not initialized")
    
    if not await orchestrator.is_ready():
        raise HTTPException(status_code=503, detail="Orchestrator not ready")
    
    return {"status": "ready"}

@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive", "timestamp": asyncio.get_event_loop().time()}

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from fastapi.responses import Response
    
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "request_id": getattr(request.state, "request_id", None)
        }
    )

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger = logging.getLogger(__name__)
    logger.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)

if __name__ == "__main__":
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Get settings
    settings = get_settings()
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        workers=1,  # Use 1 worker for proper lifespan management
        log_level=settings.log_level.lower(),
        access_log=True,
        reload=settings.debug
    )
