"""
AI Engine Service - Core AI Processing and Model Management
Handles AI model inference, training coordination, and intelligent automation
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import asyncio
import logging
import json
import uuid
from datetime import datetime
import numpy as np
import torch
import transformers
from transformers import AutoTokenizer, AutoModel, pipeline
import openai
import anthropic
from sqlalchemy import create_engine, Column, String, DateTime, JSON, Text, Integer, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import redis
from celery import Celery
import boto3
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, generate_latest
import os

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ai_engine_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Initialize FastAPI
app = FastAPI(
    title="AI Engine Service",
    description="Core AI processing and model management service",
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

# Celery setup for background tasks
celery_app = Celery(
    "ai_engine",
    broker=REDIS_URL,
    backend=REDIS_URL
)

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
inference_counter = Counter('ai_inference_requests_total', 'Total AI inference requests', ['model_type', 'status'])
inference_duration = Histogram('ai_inference_duration_seconds', 'AI inference duration', ['model_type'])

# Database Models
class AIModel(Base):
    __tablename__ = "ai_models"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)  # llm, vision, embedding, etc.
    provider = Column(String, nullable=False)  # openai, anthropic, huggingface, custom
    model_path = Column(String)
    configuration = Column(JSON)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InferenceRequest(Base):
    __tablename__ = "inference_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, nullable=False)
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    processing_time = Column(Float)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, nullable=False)
    dataset_path = Column(String, nullable=False)
    training_config = Column(JSON, nullable=False)
    status = Column(String, default="queued")  # queued, running, completed, failed
    progress = Column(Float, default=0.0)
    metrics = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class InferenceRequestModel(BaseModel):
    model_id: str
    input_data: Dict[str, Any]
    parameters: Optional[Dict[str, Any]] = {}

class InferenceResponse(BaseModel):
    request_id: str
    output: Dict[str, Any]
    processing_time: float
    model_info: Dict[str, str]

class ModelRegistration(BaseModel):
    name: str
    model_type: str
    provider: str
    model_path: Optional[str] = None
    configuration: Dict[str, Any] = {}

class TrainingJobRequest(BaseModel):
    model_name: str
    dataset_path: str
    training_config: Dict[str, Any]

# AI Model Manager
class AIModelManager:
    def __init__(self):
        self.loaded_models = {}
        self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
        self.s3_client = boto3.client('s3', region_name=AWS_REGION)
    
    async def load_model(self, model_info: Dict[str, Any]) -> Any:
        """Load a model based on its configuration"""
        model_id = model_info['id']
        
        if model_id in self.loaded_models:
            return self.loaded_models[model_id]
        
        provider = model_info['provider']
        model_type = model_info['model_type']
        
        try:
            if provider == "huggingface":
                if model_type == "llm":
                    tokenizer = AutoTokenizer.from_pretrained(model_info['model_path'])
                    model = AutoModel.from_pretrained(model_info['model_path'])
                    self.loaded_models[model_id] = {"tokenizer": tokenizer, "model": model}
                elif model_type == "pipeline":
                    pipe = pipeline(
                        model_info['configuration'].get('task', 'text-generation'),
                        model=model_info['model_path']
                    )
                    self.loaded_models[model_id] = pipe
            
            elif provider in ["openai", "anthropic"]:
                # API-based models don't need loading
                self.loaded_models[model_id] = {"client": provider}
            
            return self.loaded_models[model_id]
        
        except Exception as e:
            logging.error(f"Failed to load model {model_id}: {str(e)}")
            raise HTTPException(status_code=500, f"Failed to load model: {str(e)}")
    
    async def run_inference(self, model_info: Dict[str, Any], input_data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Run inference on a model"""
        provider = model_info['provider']
        model_type = model_info['model_type']
        
        try:
            if provider == "openai" and self.openai_client:
                if model_type == "llm":
                    response = self.openai_client.chat.completions.create(
                        model=model_info['model_path'],
                        messages=input_data.get('messages', []),
                        **parameters
                    )
                    return {
                        "response": response.choices[0].message.content,
                        "usage": response.usage.dict() if response.usage else {}
                    }
                elif model_type == "embedding":
                    response = self.openai_client.embeddings.create(
                        model=model_info['model_path'],
                        input=input_data.get('text', ''),
                        **parameters
                    )
                    return {
                        "embeddings": [data.embedding for data in response.data],
                        "usage": response.usage.dict() if response.usage else {}
                    }
            
            elif provider == "anthropic" and self.anthropic_client:
                response = self.anthropic_client.messages.create(
                    model=model_info['model_path'],
                    messages=input_data.get('messages', []),
                    **parameters
                )
                return {
                    "response": response.content[0].text,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens
                    }
                }
            
            elif provider == "huggingface":
                model = await self.load_model(model_info)
                if model_type == "pipeline":
                    result = model(input_data.get('text', ''), **parameters)
                    return {"result": result}
                elif model_type == "llm":
                    tokenizer = model["tokenizer"]
                    model_obj = model["model"]
                    inputs = tokenizer(input_data.get('text', ''), return_tensors="pt")
                    with torch.no_grad():
                        outputs = model_obj(**inputs)
                    return {"embeddings": outputs.last_hidden_state.mean(dim=1).numpy().tolist()}
            
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        except Exception as e:
            logging.error(f"Inference failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

# Initialize model manager
model_manager = AIModelManager()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Background Tasks
@celery_app.task
def train_model_task(job_id: str, model_name: str, dataset_path: str, training_config: Dict[str, Any]):
    """Background task for model training"""
    db = SessionLocal()
    try:
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job:
            return
        
        job.status = "running"
        job.started_at = datetime.utcnow()
        db.commit()
        
        # Simulate training process (replace with actual training logic)
        import time
        for i in range(10):
            time.sleep(5)  # Simulate training step
            job.progress = (i + 1) * 10
            db.commit()
        
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        job.metrics = {"accuracy": 0.95, "loss": 0.05}
        db.commit()
        
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-engine",
        "timestamp": datetime.utcnow().isoformat(),
        "models_loaded": len(model_manager.loaded_models)
    }

@app.post("/models/register", response_model=Dict[str, str])
async def register_model(model: ModelRegistration, db: Session = Depends(get_db)):
    """Register a new AI model"""
    with tracer.start_as_current_span("register_model"):
        db_model = AIModel(
            name=model.name,
            model_type=model.model_type,
            provider=model.provider,
            model_path=model.model_path,
            configuration=model.configuration
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        
        return {"model_id": db_model.id, "status": "registered"}

@app.get("/models", response_model=List[Dict[str, Any]])
async def list_models(db: Session = Depends(get_db)):
    """List all registered models"""
    models = db.query(AIModel).filter(AIModel.status == "active").all()
    return [
        {
            "id": model.id,
            "name": model.name,
            "model_type": model.model_type,
            "provider": model.provider,
            "status": model.status,
            "created_at": model.created_at.isoformat()
        }
        for model in models
    ]

@app.post("/inference", response_model=InferenceResponse)
async def run_inference(request: InferenceRequestModel, db: Session = Depends(get_db)):
    """Run inference on a model"""
    start_time = datetime.utcnow()
    
    with tracer.start_as_current_span("run_inference") as span:
        span.set_attribute("model_id", request.model_id)
        
        # Get model info
        model = db.query(AIModel).filter(AIModel.id == request.model_id).first()
        if not model:
            inference_counter.labels(model_type="unknown", status="error").inc()
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Create inference request record
        db_request = InferenceRequest(
            model_id=request.model_id,
            input_data=request.input_data,
            status="processing"
        )
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        
        try:
            # Run inference
            model_info = {
                "id": model.id,
                "provider": model.provider,
                "model_type": model.model_type,
                "model_path": model.model_path,
                "configuration": model.configuration or {}
            }
            
            with inference_duration.labels(model_type=model.model_type).time():
                output = await model_manager.run_inference(
                    model_info, 
                    request.input_data, 
                    request.parameters
                )
            
            # Update request record
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            db_request.output_data = output
            db_request.status = "completed"
            db_request.processing_time = processing_time
            db_request.completed_at = datetime.utcnow()
            db.commit()
            
            inference_counter.labels(model_type=model.model_type, status="success").inc()
            
            return InferenceResponse(
                request_id=db_request.id,
                output=output,
                processing_time=processing_time,
                model_info={
                    "name": model.name,
                    "type": model.model_type,
                    "provider": model.provider
                }
            )
        
        except Exception as e:
            # Update request record with error
            db_request.status = "failed"
            db_request.error_message = str(e)
            db.commit()
            
            inference_counter.labels(model_type=model.model_type, status="error").inc()
            raise

@app.post("/training/start", response_model=Dict[str, str])
async def start_training(request: TrainingJobRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Start a model training job"""
    with tracer.start_as_current_span("start_training"):
        # Create training job record
        job = TrainingJob(
            model_name=request.model_name,
            dataset_path=request.dataset_path,
            training_config=request.training_config
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Start background training task
        train_model_task.delay(
            job.id,
            request.model_name,
            request.dataset_path,
            request.training_config
        )
        
        return {"job_id": job.id, "status": "queued"}

@app.get("/training/{job_id}", response_model=Dict[str, Any])
async def get_training_status(job_id: str, db: Session = Depends(get_db)):
    """Get training job status"""
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    return {
        "job_id": job.id,
        "model_name": job.model_name,
        "status": job.status,
        "progress": job.progress,
        "metrics": job.metrics,
        "created_at": job.created_at.isoformat(),
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
