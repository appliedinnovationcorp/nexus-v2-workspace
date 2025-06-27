"""
Saga Orchestrator Service - Distributed Transaction Management
Handles complex business workflows across multiple microservices using the Saga pattern
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import asyncio
import logging
import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import create_engine, Column, String, DateTime, JSON, Text, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import redis
import httpx
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, generate_latest
import os

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/saga_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
EVENT_STORE_URL = os.getenv("EVENT_STORE_URL", "http://event-store:8005")

# Initialize FastAPI
app = FastAPI(
    title="Saga Orchestrator Service",
    description="Distributed transaction management using Saga pattern",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
import redis as redis_sync
redis_client = redis_sync.from_url(REDIS_URL)

# OpenTelemetry setup
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger-agent",
    agent_port=6831,
)
span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Metrics
saga_counter = Counter('saga_executions_total', 'Total saga executions', ['saga_type', 'status'])
saga_duration = Histogram('saga_execution_duration_seconds', 'Saga execution duration', ['saga_type'])
step_counter = Counter('saga_steps_total', 'Total saga steps executed', ['saga_type', 'step_name', 'status'])

# Enums
class SagaStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"

class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATED = "compensated"

# Database Models
class Saga(Base):
    __tablename__ = "sagas"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    saga_type = Column(String, nullable=False, index=True)
    status = Column(String, default=SagaStatus.PENDING, index=True)
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, nullable=False)
    error_message = Column(Text)
    correlation_id = Column(String, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

class SagaStep(Base):
    __tablename__ = "saga_steps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    saga_id = Column(String, nullable=False, index=True)
    step_name = Column(String, nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String, default=StepStatus.PENDING)
    service_url = Column(String, nullable=False)
    action_data = Column(JSON, nullable=False)
    compensation_url = Column(String)
    compensation_data = Column(JSON)
    response_data = Column(JSON)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    executed_at = Column(DateTime)
    compensated_at = Column(DateTime)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class SagaStepDefinition(BaseModel):
    step_name: str
    service_url: str
    action_data: Dict[str, Any]
    compensation_url: Optional[str] = None
    compensation_data: Optional[Dict[str, Any]] = None
    max_retries: int = 3

class SagaDefinition(BaseModel):
    saga_type: str
    input_data: Dict[str, Any]
    steps: List[SagaStepDefinition]
    correlation_id: Optional[str] = None

class SagaResponse(BaseModel):
    saga_id: str
    saga_type: str
    status: SagaStatus
    current_step: int
    total_steps: int
    created_at: datetime
    updated_at: datetime

# Saga Orchestrator Implementation
class SagaOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def start_saga(self, saga_def: SagaDefinition) -> Saga:
        """Start a new saga execution"""
        with tracer.start_as_current_span("start_saga") as span:
            span.set_attribute("saga_type", saga_def.saga_type)
            
            # Create saga record
            saga = Saga(
                saga_type=saga_def.saga_type,
                input_data=saga_def.input_data,
                total_steps=len(saga_def.steps),
                correlation_id=saga_def.correlation_id or str(uuid.uuid4()),
                started_at=datetime.now(timezone.utc)
            )
            
            self.db.add(saga)
            self.db.commit()
            self.db.refresh(saga)
            
            # Create saga steps
            for i, step_def in enumerate(saga_def.steps):
                step = SagaStep(
                    saga_id=saga.id,
                    step_name=step_def.step_name,
                    step_order=i,
                    service_url=step_def.service_url,
                    action_data=step_def.action_data,
                    compensation_url=step_def.compensation_url,
                    compensation_data=step_def.compensation_data,
                    max_retries=step_def.max_retries
                )
                self.db.add(step)
            
            self.db.commit()
            
            # Start execution
            saga.status = SagaStatus.RUNNING
            self.db.commit()
            
            # Execute saga asynchronously
            asyncio.create_task(self._execute_saga(saga.id))
            
            saga_counter.labels(saga_type=saga_def.saga_type, status="started").inc()
            
            return saga
    
    async def _execute_saga(self, saga_id: str):
        """Execute saga steps sequentially"""
        with tracer.start_as_current_span("execute_saga") as span:
            span.set_attribute("saga_id", saga_id)
            
            saga = self.db.query(Saga).filter(Saga.id == saga_id).first()
            if not saga:
                return
            
            start_time = datetime.now(timezone.utc)
            
            try:
                steps = self.db.query(SagaStep).filter(
                    SagaStep.saga_id == saga_id
                ).order_by(SagaStep.step_order).all()
                
                for step in steps:
                    success = await self._execute_step(step)
                    if not success:
                        # Step failed, start compensation
                        await self._compensate_saga(saga_id, step.step_order - 1)
                        saga.status = SagaStatus.FAILED
                        self.db.commit()
                        saga_counter.labels(saga_type=saga.saga_type, status="failed").inc()
                        return
                    
                    saga.current_step = step.step_order + 1
                    self.db.commit()
                
                # All steps completed successfully
                saga.status = SagaStatus.COMPLETED
                saga.completed_at = datetime.now(timezone.utc)
                self.db.commit()
                
                # Record metrics
                duration = (datetime.now(timezone.utc) - start_time).total_seconds()
                saga_duration.labels(saga_type=saga.saga_type).observe(duration)
                saga_counter.labels(saga_type=saga.saga_type, status="completed").inc()
                
                # Publish completion event
                await self._publish_saga_event(saga, "saga_completed")
                
            except Exception as e:
                logging.error(f"Saga execution failed: {str(e)}")
                saga.status = SagaStatus.FAILED
                saga.error_message = str(e)
                self.db.commit()
                saga_counter.labels(saga_type=saga.saga_type, status="failed").inc()
    
    async def _execute_step(self, step: SagaStep) -> bool:
        """Execute a single saga step"""
        with tracer.start_as_current_span("execute_step") as span:
            span.set_attribute("step_name", step.step_name)
            span.set_attribute("step_order", step.step_order)
            
            step.status = StepStatus.RUNNING
            step.executed_at = datetime.now(timezone.utc)
            self.db.commit()
            
            for attempt in range(step.max_retries + 1):
                try:
                    # Make HTTP request to service
                    response = await self.http_client.post(
                        step.service_url,
                        json=step.action_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        step.status = StepStatus.COMPLETED
                        step.response_data = response.json()
                        self.db.commit()
                        
                        step_counter.labels(
                            saga_type=self.db.query(Saga).filter(Saga.id == step.saga_id).first().saga_type,
                            step_name=step.step_name,
                            status="completed"
                        ).inc()
                        
                        return True
                    else:
                        raise Exception(f"HTTP {response.status_code}: {response.text}")
                
                except Exception as e:
                    step.retry_count = attempt + 1
                    step.error_message = str(e)
                    self.db.commit()
                    
                    if attempt < step.max_retries:
                        # Wait before retry (exponential backoff)
                        await asyncio.sleep(2 ** attempt)
                    else:
                        step.status = StepStatus.FAILED
                        self.db.commit()
                        
                        step_counter.labels(
                            saga_type=self.db.query(Saga).filter(Saga.id == step.saga_id).first().saga_type,
                            step_name=step.step_name,
                            status="failed"
                        ).inc()
                        
                        return False
            
            return False
    
    async def _compensate_saga(self, saga_id: str, last_completed_step: int):
        """Compensate saga by rolling back completed steps"""
        with tracer.start_as_current_span("compensate_saga") as span:
            span.set_attribute("saga_id", saga_id)
            
            saga = self.db.query(Saga).filter(Saga.id == saga_id).first()
            saga.status = SagaStatus.COMPENSATING
            self.db.commit()
            
            # Get completed steps in reverse order
            steps = self.db.query(SagaStep).filter(
                SagaStep.saga_id == saga_id,
                SagaStep.step_order <= last_completed_step,
                SagaStep.status == StepStatus.COMPLETED
            ).order_by(SagaStep.step_order.desc()).all()
            
            for step in steps:
                if step.compensation_url:
                    await self._compensate_step(step)
            
            saga.status = SagaStatus.COMPENSATED
            self.db.commit()
            
            # Publish compensation event
            await self._publish_saga_event(saga, "saga_compensated")
    
    async def _compensate_step(self, step: SagaStep):
        """Compensate a single step"""
        try:
            if step.compensation_url and step.compensation_data:
                response = await self.http_client.post(
                    step.compensation_url,
                    json=step.compensation_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    step.status = StepStatus.COMPENSATED
                    step.compensated_at = datetime.now(timezone.utc)
                    self.db.commit()
        
        except Exception as e:
            logging.error(f"Step compensation failed: {str(e)}")
            step.error_message = f"Compensation failed: {str(e)}"
            self.db.commit()
    
    async def _publish_saga_event(self, saga: Saga, event_type: str):
        """Publish saga event to event store"""
        try:
            event_data = {
                "saga_id": saga.id,
                "saga_type": saga.saga_type,
                "status": saga.status,
                "correlation_id": saga.correlation_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            await self.http_client.post(
                f"{EVENT_STORE_URL}/events",
                json={
                    "aggregate_id": saga.id,
                    "aggregate_type": "Saga",
                    "event_type": event_type,
                    "event_version": 1,
                    "event_data": event_data,
                    "correlation_id": saga.correlation_id
                }
            )
        except Exception as e:
            logging.error(f"Failed to publish saga event: {str(e)}")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "saga-orchestrator",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/sagas", response_model=SagaResponse)
async def create_saga(saga_def: SagaDefinition, db: Session = Depends(get_db)):
    """Create and start a new saga"""
    with tracer.start_as_current_span("create_saga") as span:
        span.set_attribute("saga_type", saga_def.saga_type)
        
        orchestrator = SagaOrchestrator(db)
        saga = await orchestrator.start_saga(saga_def)
        
        return SagaResponse(
            saga_id=saga.id,
            saga_type=saga.saga_type,
            status=saga.status,
            current_step=saga.current_step,
            total_steps=saga.total_steps,
            created_at=saga.created_at,
            updated_at=saga.updated_at
        )

@app.get("/sagas/{saga_id}", response_model=Dict[str, Any])
async def get_saga_status(saga_id: str, db: Session = Depends(get_db)):
    """Get saga execution status"""
    saga = db.query(Saga).filter(Saga.id == saga_id).first()
    if not saga:
        raise HTTPException(status_code=404, detail="Saga not found")
    
    steps = db.query(SagaStep).filter(SagaStep.saga_id == saga_id).order_by(SagaStep.step_order).all()
    
    return {
        "saga_id": saga.id,
        "saga_type": saga.saga_type,
        "status": saga.status,
        "current_step": saga.current_step,
        "total_steps": saga.total_steps,
        "input_data": saga.input_data,
        "output_data": saga.output_data,
        "error_message": saga.error_message,
        "correlation_id": saga.correlation_id,
        "created_at": saga.created_at.isoformat(),
        "updated_at": saga.updated_at.isoformat(),
        "started_at": saga.started_at.isoformat() if saga.started_at else None,
        "completed_at": saga.completed_at.isoformat() if saga.completed_at else None,
        "steps": [
            {
                "step_name": step.step_name,
                "step_order": step.step_order,
                "status": step.status,
                "response_data": step.response_data,
                "error_message": step.error_message,
                "retry_count": step.retry_count,
                "executed_at": step.executed_at.isoformat() if step.executed_at else None,
                "compensated_at": step.compensated_at.isoformat() if step.compensated_at else None
            }
            for step in steps
        ]
    }

@app.get("/sagas", response_model=List[SagaResponse])
async def list_sagas(
    saga_type: Optional[str] = None,
    status: Optional[SagaStatus] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List sagas with optional filtering"""
    query = db.query(Saga)
    
    if saga_type:
        query = query.filter(Saga.saga_type == saga_type)
    if status:
        query = query.filter(Saga.status == status)
    
    sagas = query.order_by(Saga.created_at.desc()).limit(limit).all()
    
    return [
        SagaResponse(
            saga_id=saga.id,
            saga_type=saga.saga_type,
            status=saga.status,
            current_step=saga.current_step,
            total_steps=saga.total_steps,
            created_at=saga.created_at,
            updated_at=saga.updated_at
        )
        for saga in sagas
    ]

@app.post("/sagas/{saga_id}/compensate")
async def compensate_saga(saga_id: str, db: Session = Depends(get_db)):
    """Manually trigger saga compensation"""
    saga = db.query(Saga).filter(Saga.id == saga_id).first()
    if not saga:
        raise HTTPException(status_code=404, detail="Saga not found")
    
    if saga.status not in [SagaStatus.RUNNING, SagaStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Saga cannot be compensated in current status")
    
    orchestrator = SagaOrchestrator(db)
    await orchestrator._compensate_saga(saga_id, saga.current_step - 1)
    
    return {"message": "Saga compensation initiated"}

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
