"""
Event Store Service - Event Sourcing and CQRS Implementation
Handles event storage, replay, projections, and event-driven architecture
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import asyncio
import logging
import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, DateTime, JSON, Text, Integer, BigInteger, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import redis
from kafka import KafkaProducer, KafkaConsumer
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, generate_latest
import os
import hashlib
import asyncpg
from contextlib import asynccontextmanager

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/event_store_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# Initialize FastAPI
app = FastAPI(
    title="Event Store Service",
    description="Event sourcing and CQRS implementation service",
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

# Kafka setup
kafka_producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS.split(','),
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8') if k else None
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
events_stored_counter = Counter('events_stored_total', 'Total events stored', ['aggregate_type', 'event_type'])
events_replayed_counter = Counter('events_replayed_total', 'Total events replayed', ['aggregate_type'])
projection_updates_counter = Counter('projection_updates_total', 'Total projection updates', ['projection_name'])
event_store_duration = Histogram('event_store_duration_seconds', 'Event store operation duration', ['operation'])

# Database Models
class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    aggregate_id = Column(String, nullable=False, index=True)
    aggregate_type = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    event_version = Column(Integer, nullable=False)
    sequence_number = Column(BigInteger, nullable=False, autoincrement=True, index=True)
    event_data = Column(JSON, nullable=False)
    metadata = Column(JSON, default={})
    correlation_id = Column(String, index=True)
    causation_id = Column(String, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    checksum = Column(String, nullable=False)
    
    __table_args__ = (
        Index('idx_aggregate_sequence', 'aggregate_id', 'sequence_number'),
        Index('idx_timestamp_type', 'timestamp', 'event_type'),
    )

class Snapshot(Base):
    __tablename__ = "snapshots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    aggregate_id = Column(String, nullable=False, unique=True, index=True)
    aggregate_type = Column(String, nullable=False, index=True)
    version = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class Projection(Base):
    __tablename__ = "projections"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    last_processed_sequence = Column(BigInteger, default=0)
    status = Column(String, default="active")  # active, paused, rebuilding
    data = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class EventSubscription(Base):
    __tablename__ = "event_subscriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    event_types = Column(JSON, nullable=False)  # List of event types to subscribe to
    aggregate_types = Column(JSON, default=[])  # List of aggregate types to filter
    webhook_url = Column(String)
    kafka_topic = Column(String)
    last_processed_sequence = Column(BigInteger, default=0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class EventData(BaseModel):
    aggregate_id: str
    aggregate_type: str
    event_type: str
    event_version: int
    event_data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = {}
    correlation_id: Optional[str] = None
    causation_id: Optional[str] = None

class EventResponse(BaseModel):
    id: str
    aggregate_id: str
    aggregate_type: str
    event_type: str
    event_version: int
    sequence_number: int
    event_data: Dict[str, Any]
    metadata: Dict[str, Any]
    timestamp: datetime

class SnapshotData(BaseModel):
    aggregate_id: str
    aggregate_type: str
    version: int
    data: Dict[str, Any]

class ProjectionRequest(BaseModel):
    name: str
    event_types: List[str]
    aggregate_types: Optional[List[str]] = []

class SubscriptionRequest(BaseModel):
    name: str
    event_types: List[str]
    aggregate_types: Optional[List[str]] = []
    webhook_url: Optional[str] = None
    kafka_topic: Optional[str] = None

# Event Store Implementation
class EventStore:
    def __init__(self, db: Session):
        self.db = db
    
    def _calculate_checksum(self, event_data: Dict[str, Any]) -> str:
        """Calculate checksum for event integrity"""
        event_json = json.dumps(event_data, sort_keys=True)
        return hashlib.sha256(event_json.encode()).hexdigest()
    
    async def store_event(self, event_data: EventData) -> Event:
        """Store a single event"""
        with event_store_duration.labels(operation="store_event").time():
            # Check for duplicate events
            existing = self.db.query(Event).filter(
                Event.aggregate_id == event_data.aggregate_id,
                Event.event_version == event_data.event_version
            ).first()
            
            if existing:
                raise HTTPException(status_code=409, detail="Event version already exists")
            
            # Create event
            checksum = self._calculate_checksum(event_data.event_data)
            
            db_event = Event(
                aggregate_id=event_data.aggregate_id,
                aggregate_type=event_data.aggregate_type,
                event_type=event_data.event_type,
                event_version=event_data.event_version,
                event_data=event_data.event_data,
                metadata=event_data.metadata,
                correlation_id=event_data.correlation_id,
                causation_id=event_data.causation_id,
                checksum=checksum
            )
            
            self.db.add(db_event)
            self.db.commit()
            self.db.refresh(db_event)
            
            # Update metrics
            events_stored_counter.labels(
                aggregate_type=event_data.aggregate_type,
                event_type=event_data.event_type
            ).inc()
            
            # Publish to Kafka
            await self._publish_event(db_event)
            
            # Update projections
            await self._update_projections(db_event)
            
            return db_event
    
    async def store_events(self, events: List[EventData]) -> List[Event]:
        """Store multiple events atomically"""
        with event_store_duration.labels(operation="store_events").time():
            stored_events = []
            
            try:
                for event_data in events:
                    stored_event = await self.store_event(event_data)
                    stored_events.append(stored_event)
                
                return stored_events
            
            except Exception as e:
                self.db.rollback()
                raise
    
    def get_events(
        self,
        aggregate_id: Optional[str] = None,
        aggregate_type: Optional[str] = None,
        event_type: Optional[str] = None,
        from_sequence: Optional[int] = None,
        to_sequence: Optional[int] = None,
        from_timestamp: Optional[datetime] = None,
        to_timestamp: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[Event]:
        """Retrieve events with filtering"""
        with event_store_duration.labels(operation="get_events").time():
            query = self.db.query(Event)
            
            if aggregate_id:
                query = query.filter(Event.aggregate_id == aggregate_id)
            if aggregate_type:
                query = query.filter(Event.aggregate_type == aggregate_type)
            if event_type:
                query = query.filter(Event.event_type == event_type)
            if from_sequence:
                query = query.filter(Event.sequence_number >= from_sequence)
            if to_sequence:
                query = query.filter(Event.sequence_number <= to_sequence)
            if from_timestamp:
                query = query.filter(Event.timestamp >= from_timestamp)
            if to_timestamp:
                query = query.filter(Event.timestamp <= to_timestamp)
            
            return query.order_by(Event.sequence_number).limit(limit).all()
    
    def get_aggregate_events(self, aggregate_id: str, from_version: int = 0) -> List[Event]:
        """Get all events for a specific aggregate"""
        return self.db.query(Event).filter(
            Event.aggregate_id == aggregate_id,
            Event.event_version > from_version
        ).order_by(Event.event_version).all()
    
    async def create_snapshot(self, snapshot_data: SnapshotData) -> Snapshot:
        """Create or update a snapshot"""
        existing = self.db.query(Snapshot).filter(
            Snapshot.aggregate_id == snapshot_data.aggregate_id
        ).first()
        
        if existing:
            existing.version = snapshot_data.version
            existing.data = snapshot_data.data
            existing.timestamp = datetime.now(timezone.utc)
            self.db.commit()
            return existing
        else:
            db_snapshot = Snapshot(
                aggregate_id=snapshot_data.aggregate_id,
                aggregate_type=snapshot_data.aggregate_type,
                version=snapshot_data.version,
                data=snapshot_data.data
            )
            self.db.add(db_snapshot)
            self.db.commit()
            self.db.refresh(db_snapshot)
            return db_snapshot
    
    def get_snapshot(self, aggregate_id: str) -> Optional[Snapshot]:
        """Get the latest snapshot for an aggregate"""
        return self.db.query(Snapshot).filter(
            Snapshot.aggregate_id == aggregate_id
        ).first()
    
    async def _publish_event(self, event: Event):
        """Publish event to Kafka"""
        try:
            event_message = {
                "id": event.id,
                "aggregate_id": event.aggregate_id,
                "aggregate_type": event.aggregate_type,
                "event_type": event.event_type,
                "event_version": event.event_version,
                "sequence_number": event.sequence_number,
                "event_data": event.event_data,
                "metadata": event.metadata,
                "timestamp": event.timestamp.isoformat(),
                "correlation_id": event.correlation_id,
                "causation_id": event.causation_id
            }
            
            kafka_producer.send(
                topic="events",
                key=event.aggregate_id,
                value=event_message
            )
            
        except Exception as e:
            logging.error(f"Failed to publish event to Kafka: {str(e)}")
    
    async def _update_projections(self, event: Event):
        """Update projections based on new event"""
        projections = self.db.query(Projection).filter(
            Projection.status == "active"
        ).all()
        
        for projection in projections:
            try:
                # Simple projection update logic (extend as needed)
                if projection.name == "user_summary":
                    await self._update_user_summary_projection(projection, event)
                elif projection.name == "content_stats":
                    await self._update_content_stats_projection(projection, event)
                
                projection.last_processed_sequence = event.sequence_number
                projection.updated_at = datetime.now(timezone.utc)
                self.db.commit()
                
                projection_updates_counter.labels(projection_name=projection.name).inc()
                
            except Exception as e:
                logging.error(f"Failed to update projection {projection.name}: {str(e)}")
    
    async def _update_user_summary_projection(self, projection: Projection, event: Event):
        """Update user summary projection"""
        if event.aggregate_type == "User":
            user_id = event.aggregate_id
            
            if not projection.data:
                projection.data = {}
            
            if user_id not in projection.data:
                projection.data[user_id] = {
                    "total_events": 0,
                    "last_activity": None,
                    "status": "unknown"
                }
            
            projection.data[user_id]["total_events"] += 1
            projection.data[user_id]["last_activity"] = event.timestamp.isoformat()
            
            if event.event_type == "UserRegistered":
                projection.data[user_id]["status"] = "active"
            elif event.event_type == "UserDeactivated":
                projection.data[user_id]["status"] = "inactive"
    
    async def _update_content_stats_projection(self, projection: Projection, event: Event):
        """Update content statistics projection"""
        if event.aggregate_type == "Content":
            if not projection.data:
                projection.data = {
                    "total_content": 0,
                    "by_type": {},
                    "by_status": {}
                }
            
            if event.event_type == "ContentCreated":
                projection.data["total_content"] += 1
                content_type = event.event_data.get("type", "unknown")
                projection.data["by_type"][content_type] = projection.data["by_type"].get(content_type, 0) + 1
                projection.data["by_status"]["draft"] = projection.data["by_status"].get("draft", 0) + 1
            
            elif event.event_type == "ContentPublished":
                projection.data["by_status"]["published"] = projection.data["by_status"].get("published", 0) + 1
                projection.data["by_status"]["draft"] = max(0, projection.data["by_status"].get("draft", 0) - 1)

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
        "service": "event-store",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/events", response_model=EventResponse)
async def store_event(event_data: EventData, db: Session = Depends(get_db)):
    """Store a single event"""
    with tracer.start_as_current_span("store_event") as span:
        span.set_attribute("aggregate_id", event_data.aggregate_id)
        span.set_attribute("event_type", event_data.event_type)
        
        event_store = EventStore(db)
        stored_event = await event_store.store_event(event_data)
        
        return EventResponse(
            id=stored_event.id,
            aggregate_id=stored_event.aggregate_id,
            aggregate_type=stored_event.aggregate_type,
            event_type=stored_event.event_type,
            event_version=stored_event.event_version,
            sequence_number=stored_event.sequence_number,
            event_data=stored_event.event_data,
            metadata=stored_event.metadata,
            timestamp=stored_event.timestamp
        )

@app.post("/events/batch", response_model=List[EventResponse])
async def store_events(events: List[EventData], db: Session = Depends(get_db)):
    """Store multiple events atomically"""
    with tracer.start_as_current_span("store_events_batch"):
        event_store = EventStore(db)
        stored_events = await event_store.store_events(events)
        
        return [
            EventResponse(
                id=event.id,
                aggregate_id=event.aggregate_id,
                aggregate_type=event.aggregate_type,
                event_type=event.event_type,
                event_version=event.event_version,
                sequence_number=event.sequence_number,
                event_data=event.event_data,
                metadata=event.metadata,
                timestamp=event.timestamp
            )
            for event in stored_events
        ]

@app.get("/events", response_model=List[EventResponse])
async def get_events(
    aggregate_id: Optional[str] = Query(None),
    aggregate_type: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    from_sequence: Optional[int] = Query(None),
    to_sequence: Optional[int] = Query(None),
    limit: int = Query(1000, le=10000),
    db: Session = Depends(get_db)
):
    """Retrieve events with filtering"""
    with tracer.start_as_current_span("get_events"):
        event_store = EventStore(db)
        events = event_store.get_events(
            aggregate_id=aggregate_id,
            aggregate_type=aggregate_type,
            event_type=event_type,
            from_sequence=from_sequence,
            to_sequence=to_sequence,
            limit=limit
        )
        
        return [
            EventResponse(
                id=event.id,
                aggregate_id=event.aggregate_id,
                aggregate_type=event.aggregate_type,
                event_type=event.event_type,
                event_version=event.event_version,
                sequence_number=event.sequence_number,
                event_data=event.event_data,
                metadata=event.metadata,
                timestamp=event.timestamp
            )
            for event in events
        ]

@app.get("/aggregates/{aggregate_id}/events", response_model=List[EventResponse])
async def get_aggregate_events(aggregate_id: str, from_version: int = Query(0), db: Session = Depends(get_db)):
    """Get all events for a specific aggregate"""
    with tracer.start_as_current_span("get_aggregate_events"):
        event_store = EventStore(db)
        events = event_store.get_aggregate_events(aggregate_id, from_version)
        
        events_replayed_counter.labels(aggregate_type=events[0].aggregate_type if events else "unknown").inc()
        
        return [
            EventResponse(
                id=event.id,
                aggregate_id=event.aggregate_id,
                aggregate_type=event.aggregate_type,
                event_type=event.event_type,
                event_version=event.event_version,
                sequence_number=event.sequence_number,
                event_data=event.event_data,
                metadata=event.metadata,
                timestamp=event.timestamp
            )
            for event in events
        ]

@app.post("/snapshots", response_model=Dict[str, str])
async def create_snapshot(snapshot_data: SnapshotData, db: Session = Depends(get_db)):
    """Create or update a snapshot"""
    with tracer.start_as_current_span("create_snapshot"):
        event_store = EventStore(db)
        snapshot = await event_store.create_snapshot(snapshot_data)
        
        return {"snapshot_id": snapshot.id, "status": "created"}

@app.get("/snapshots/{aggregate_id}", response_model=Optional[Dict[str, Any]])
async def get_snapshot(aggregate_id: str, db: Session = Depends(get_db)):
    """Get the latest snapshot for an aggregate"""
    with tracer.start_as_current_span("get_snapshot"):
        event_store = EventStore(db)
        snapshot = event_store.get_snapshot(aggregate_id)
        
        if not snapshot:
            return None
        
        return {
            "id": snapshot.id,
            "aggregate_id": snapshot.aggregate_id,
            "aggregate_type": snapshot.aggregate_type,
            "version": snapshot.version,
            "data": snapshot.data,
            "timestamp": snapshot.timestamp.isoformat()
        }

@app.post("/projections", response_model=Dict[str, str])
async def create_projection(projection_request: ProjectionRequest, db: Session = Depends(get_db)):
    """Create a new projection"""
    existing = db.query(Projection).filter(Projection.name == projection_request.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Projection already exists")
    
    projection = Projection(
        name=projection_request.name,
        data={"event_types": projection_request.event_types, "aggregate_types": projection_request.aggregate_types}
    )
    db.add(projection)
    db.commit()
    
    return {"projection_id": projection.id, "status": "created"}

@app.get("/projections/{name}", response_model=Dict[str, Any])
async def get_projection(name: str, db: Session = Depends(get_db)):
    """Get projection data"""
    projection = db.query(Projection).filter(Projection.name == name).first()
    if not projection:
        raise HTTPException(status_code=404, detail="Projection not found")
    
    return {
        "id": projection.id,
        "name": projection.name,
        "last_processed_sequence": projection.last_processed_sequence,
        "status": projection.status,
        "data": projection.data,
        "updated_at": projection.updated_at.isoformat()
    }

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
