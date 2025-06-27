"""
Event Bus Service - Real-time Event Streaming and Pub/Sub
Handles event publishing, subscription, and real-time message delivery
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Set
import asyncio
import logging
import json
import uuid
from datetime import datetime, timezone
from enum import Enum
import redis.asyncio as redis
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import websockets
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Histogram, generate_latest
import os
import threading
from concurrent.futures import ThreadPoolExecutor

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
WEBSOCKET_MAX_CONNECTIONS = int(os.getenv("WEBSOCKET_MAX_CONNECTIONS", "1000"))

# Initialize FastAPI
app = FastAPI(
    title="Event Bus Service",
    description="Real-time event streaming and pub/sub service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis setup
redis_client = None

# Kafka setup
kafka_producer = None
kafka_consumers = {}

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # topic -> set of connection_ids
        self.connection_topics: Dict[str, Set[str]] = {}  # connection_id -> set of topics
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        self.connection_topics[connection_id] = set()
        logging.info(f"WebSocket connection established: {connection_id}")
    
    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            # Remove from all topic subscriptions
            if connection_id in self.connection_topics:
                for topic in self.connection_topics[connection_id]:
                    if topic in self.subscriptions:
                        self.subscriptions[topic].discard(connection_id)
                del self.connection_topics[connection_id]
            
            del self.active_connections[connection_id]
            logging.info(f"WebSocket connection closed: {connection_id}")
    
    def subscribe_to_topic(self, connection_id: str, topic: str):
        if topic not in self.subscriptions:
            self.subscriptions[topic] = set()
        self.subscriptions[topic].add(connection_id)
        
        if connection_id not in self.connection_topics:
            self.connection_topics[connection_id] = set()
        self.connection_topics[connection_id].add(topic)
        
        logging.info(f"Connection {connection_id} subscribed to topic {topic}")
    
    def unsubscribe_from_topic(self, connection_id: str, topic: str):
        if topic in self.subscriptions:
            self.subscriptions[topic].discard(connection_id)
        
        if connection_id in self.connection_topics:
            self.connection_topics[connection_id].discard(topic)
        
        logging.info(f"Connection {connection_id} unsubscribed from topic {topic}")
    
    async def broadcast_to_topic(self, topic: str, message: dict):
        if topic in self.subscriptions:
            disconnected_connections = []
            
            for connection_id in self.subscriptions[topic]:
                if connection_id in self.active_connections:
                    try:
                        websocket = self.active_connections[connection_id]
                        await websocket.send_text(json.dumps(message))
                    except Exception as e:
                        logging.error(f"Failed to send message to {connection_id}: {str(e)}")
                        disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for connection_id in disconnected_connections:
                self.disconnect(connection_id)

manager = ConnectionManager()

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
events_published_counter = Counter('events_published_total', 'Total events published', ['topic', 'channel'])
events_consumed_counter = Counter('events_consumed_total', 'Total events consumed', ['topic', 'channel'])
websocket_connections_gauge = Counter('websocket_connections_total', 'Total WebSocket connections')
event_processing_duration = Histogram('event_processing_duration_seconds', 'Event processing duration', ['operation'])

# Pydantic Models
class EventMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    event_type: str
    payload: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: Optional[str] = None
    source_service: Optional[str] = None

class SubscriptionRequest(BaseModel):
    topics: List[str]
    filters: Optional[Dict[str, Any]] = {}

class WebSocketMessage(BaseModel):
    action: str  # subscribe, unsubscribe, publish
    topic: Optional[str] = None
    topics: Optional[List[str]] = None
    event: Optional[EventMessage] = None

# Event Bus Implementation
class EventBus:
    def __init__(self):
        self.redis_client = None
        self.kafka_producer = None
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=10)
    
    async def initialize(self):
        """Initialize Redis and Kafka connections"""
        try:
            # Initialize Redis
            self.redis_client = redis.from_url(REDIS_URL)
            await self.redis_client.ping()
            logging.info("Redis connection established")
            
            # Initialize Kafka Producer
            self.kafka_producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS.split(','),
                value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
                max_in_flight_requests_per_connection=1
            )
            logging.info("Kafka producer initialized")
            
            self.running = True
            
            # Start Kafka consumers for popular topics
            await self._start_kafka_consumers()
            
        except Exception as e:
            logging.error(f"Failed to initialize Event Bus: {str(e)}")
            raise
    
    async def _start_kafka_consumers(self):
        """Start Kafka consumers for different topics"""
        topics = [
            'user_events',
            'content_events',
            'notification_events',
            'saga_events',
            'system_events'
        ]
        
        for topic in topics:
            consumer_thread = threading.Thread(
                target=self._kafka_consumer_worker,
                args=(topic,),
                daemon=True
            )
            consumer_thread.start()
            logging.info(f"Started Kafka consumer for topic: {topic}")
    
    def _kafka_consumer_worker(self, topic: str):
        """Kafka consumer worker thread"""
        try:
            consumer = KafkaConsumer(
                topic,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS.split(','),
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                group_id=f'event-bus-{topic}',
                auto_offset_reset='latest',
                enable_auto_commit=True
            )
            
            for message in consumer:
                try:
                    event_data = message.value
                    
                    # Broadcast to WebSocket subscribers
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast_to_topic(topic, event_data),
                        asyncio.get_event_loop()
                    )
                    
                    # Store in Redis for replay
                    asyncio.run_coroutine_threadsafe(
                        self._store_event_in_redis(topic, event_data),
                        asyncio.get_event_loop()
                    )
                    
                    events_consumed_counter.labels(topic=topic, channel='kafka').inc()
                    
                except Exception as e:
                    logging.error(f"Error processing Kafka message: {str(e)}")
        
        except Exception as e:
            logging.error(f"Kafka consumer error for topic {topic}: {str(e)}")
    
    async def _store_event_in_redis(self, topic: str, event_data: dict):
        """Store event in Redis for replay and persistence"""
        try:
            if self.redis_client:
                # Store in topic-specific list (for replay)
                await self.redis_client.lpush(f"events:{topic}", json.dumps(event_data, default=str))
                
                # Keep only last 1000 events per topic
                await self.redis_client.ltrim(f"events:{topic}", 0, 999)
                
                # Store in global event stream
                await self.redis_client.lpush("events:all", json.dumps(event_data, default=str))
                await self.redis_client.ltrim("events:all", 0, 9999)
        
        except Exception as e:
            logging.error(f"Failed to store event in Redis: {str(e)}")
    
    async def publish_event(self, event: EventMessage, channels: List[str] = None):
        """Publish event to multiple channels"""
        with tracer.start_as_current_span("publish_event") as span:
            span.set_attribute("topic", event.topic)
            span.set_attribute("event_type", event.event_type)
            
            if channels is None:
                channels = ['kafka', 'redis', 'websocket']
            
            event_dict = event.dict()
            
            # Publish to Kafka
            if 'kafka' in channels and self.kafka_producer:
                try:
                    future = self.kafka_producer.send(
                        event.topic,
                        key=event.correlation_id,
                        value=event_dict
                    )
                    future.get(timeout=10)  # Wait for confirmation
                    events_published_counter.labels(topic=event.topic, channel='kafka').inc()
                except KafkaError as e:
                    logging.error(f"Failed to publish to Kafka: {str(e)}")
            
            # Publish to Redis
            if 'redis' in channels and self.redis_client:
                try:
                    await self.redis_client.publish(f"topic:{event.topic}", json.dumps(event_dict, default=str))
                    events_published_counter.labels(topic=event.topic, channel='redis').inc()
                except Exception as e:
                    logging.error(f"Failed to publish to Redis: {str(e)}")
            
            # Publish to WebSocket subscribers
            if 'websocket' in channels:
                try:
                    await manager.broadcast_to_topic(event.topic, event_dict)
                    events_published_counter.labels(topic=event.topic, channel='websocket').inc()
                except Exception as e:
                    logging.error(f"Failed to publish to WebSocket: {str(e)}")
    
    async def get_recent_events(self, topic: str, limit: int = 100) -> List[dict]:
        """Get recent events from a topic"""
        try:
            if self.redis_client:
                events = await self.redis_client.lrange(f"events:{topic}", 0, limit - 1)
                return [json.loads(event) for event in events]
            return []
        except Exception as e:
            logging.error(f"Failed to get recent events: {str(e)}")
            return []

# Global event bus instance
event_bus = EventBus()

# Startup event
@app.on_event("startup")
async def startup_event():
    await event_bus.initialize()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "event-bus",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "connections": len(manager.active_connections),
        "subscriptions": len(manager.subscriptions)
    }

@app.post("/events/publish")
async def publish_event(event: EventMessage, channels: Optional[List[str]] = None):
    """Publish an event to the event bus"""
    with tracer.start_as_current_span("api_publish_event"):
        await event_bus.publish_event(event, channels)
        return {"message": "Event published successfully", "event_id": event.id}

@app.get("/events/{topic}")
async def get_topic_events(topic: str, limit: int = 100):
    """Get recent events from a specific topic"""
    events = await event_bus.get_recent_events(topic, limit)
    return {"topic": topic, "events": events, "count": len(events)}

@app.get("/topics")
async def list_topics():
    """List all active topics"""
    try:
        if event_bus.redis_client:
            keys = await event_bus.redis_client.keys("events:*")
            topics = [key.decode('utf-8').replace('events:', '') for key in keys if key != b'events:all']
            return {"topics": topics, "count": len(topics)}
        return {"topics": [], "count": 0}
    except Exception as e:
        logging.error(f"Failed to list topics: {str(e)}")
        return {"topics": [], "count": 0}

@app.get("/subscriptions")
async def get_subscriptions():
    """Get current WebSocket subscriptions"""
    return {
        "active_connections": len(manager.active_connections),
        "subscriptions": {
            topic: len(connections) 
            for topic, connections in manager.subscriptions.items()
        }
    }

# WebSocket endpoint
@app.websocket("/ws/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, connection_id: str):
    """WebSocket endpoint for real-time event streaming"""
    await manager.connect(websocket, connection_id)
    websocket_connections_gauge.inc()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe":
                topics = message.get("topics", [])
                for topic in topics:
                    manager.subscribe_to_topic(connection_id, topic)
                
                await websocket.send_text(json.dumps({
                    "type": "subscription_confirmed",
                    "topics": topics
                }))
            
            elif message.get("action") == "unsubscribe":
                topics = message.get("topics", [])
                for topic in topics:
                    manager.unsubscribe_from_topic(connection_id, topic)
                
                await websocket.send_text(json.dumps({
                    "type": "unsubscription_confirmed",
                    "topics": topics
                }))
            
            elif message.get("action") == "publish":
                event_data = message.get("event")
                if event_data:
                    event = EventMessage(**event_data)
                    await event_bus.publish_event(event)
                    
                    await websocket.send_text(json.dumps({
                        "type": "publish_confirmed",
                        "event_id": event.id
                    }))
            
            elif message.get("action") == "get_recent":
                topic = message.get("topic")
                limit = message.get("limit", 10)
                if topic:
                    events = await event_bus.get_recent_events(topic, limit)
                    await websocket.send_text(json.dumps({
                        "type": "recent_events",
                        "topic": topic,
                        "events": events
                    }))
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id)
        websocket_connections_gauge.dec()
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}")
        manager.disconnect(connection_id)
        websocket_connections_gauge.dec()

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

# Event replay endpoint
@app.post("/events/replay/{topic}")
async def replay_events(topic: str, from_timestamp: Optional[str] = None, to_timestamp: Optional[str] = None):
    """Replay events from a topic within a time range"""
    try:
        events = await event_bus.get_recent_events(topic, 1000)
        
        # Filter by timestamp if provided
        if from_timestamp or to_timestamp:
            filtered_events = []
            for event in events:
                event_time = datetime.fromisoformat(event.get('timestamp', ''))
                
                if from_timestamp:
                    from_time = datetime.fromisoformat(from_timestamp)
                    if event_time < from_time:
                        continue
                
                if to_timestamp:
                    to_time = datetime.fromisoformat(to_timestamp)
                    if event_time > to_time:
                        continue
                
                filtered_events.append(event)
            
            events = filtered_events
        
        # Republish events
        for event_data in events:
            event = EventMessage(**event_data)
            await event_bus.publish_event(event, channels=['websocket'])
        
        return {
            "message": f"Replayed {len(events)} events from topic {topic}",
            "count": len(events)
        }
    
    except Exception as e:
        logging.error(f"Failed to replay events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
