"""
Core data models for the Enhanced Saga Orchestrator
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator
from sqlalchemy import Column, String, DateTime, JSON, Text, Integer, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID as PGUUID

Base = declarative_base()

# Enums
class SagaStatus(str, Enum):
    """Saga execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"

class StepStatus(str, Enum):
    """Step execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"
    SKIPPED = "skipped"
    TIMEOUT = "timeout"

class EventType(str, Enum):
    """Event types"""
    SAGA_STARTED = "saga_started"
    SAGA_COMPLETED = "saga_completed"
    SAGA_FAILED = "saga_failed"
    SAGA_COMPENSATED = "saga_compensated"
    SAGA_CANCELLED = "saga_cancelled"
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    STEP_FAILED = "step_failed"
    STEP_COMPENSATED = "step_compensated"
    STEP_TIMEOUT = "step_timeout"

class Priority(str, Enum):
    """Saga priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

# Pydantic Models
class SagaStepDefinition(BaseModel):
    """Saga step definition"""
    id: str = Field(..., description="Unique step identifier")
    name: str = Field(..., description="Human-readable step name")
    service: str = Field(..., description="Target service name")
    action: str = Field(..., description="Action to execute")
    compensation: Optional[str] = Field(None, description="Compensation action")
    timeout: int = Field(default=30000, description="Step timeout in milliseconds")
    retries: int = Field(default=3, description="Maximum retry attempts")
    retry_delay: int = Field(default=1000, description="Retry delay in milliseconds")
    conditions: Optional[Dict[str, Any]] = Field(None, description="Execution conditions")
    parallel_group: Optional[str] = Field(None, description="Parallel execution group")
    depends_on: List[str] = Field(default_factory=list, description="Step dependencies")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class SagaDefinition(BaseModel):
    """Saga definition"""
    id: str = Field(..., description="Unique saga identifier")
    name: str = Field(..., description="Human-readable saga name")
    version: str = Field(default="1.0.0", description="Saga version")
    description: Optional[str] = Field(None, description="Saga description")
    steps: List[SagaStepDefinition] = Field(..., description="Saga steps")
    timeout: int = Field(default=300000, description="Overall saga timeout")
    retry_policy: Dict[str, Any] = Field(default_factory=dict, description="Retry policy")
    compensation_policy: Dict[str, Any] = Field(default_factory=dict, description="Compensation policy")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = Field(None, description="Creator identifier")

class SagaStepInstance(BaseModel):
    """Saga step instance"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    step_id: str = Field(..., description="Step definition ID")
    saga_instance_id: str = Field(..., description="Parent saga instance ID")
    status: StepStatus = Field(default=StepStatus.PENDING)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    retry_count: int = Field(default=0)
    error_message: Optional[str] = None
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Dict[str, Any] = Field(default_factory=dict)
    compensation_data: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SagaInstance(BaseModel):
    """Saga instance"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    saga_id: str = Field(..., description="Saga definition ID")
    saga_version: str = Field(default="1.0.0")
    tenant_id: Optional[str] = Field(None, description="Tenant identifier")
    correlation_id: Optional[str] = Field(None, description="Correlation identifier")
    parent_saga_id: Optional[str] = Field(None, description="Parent saga for nested sagas")
    status: SagaStatus = Field(default=SagaStatus.PENDING)
    priority: Priority = Field(default=Priority.NORMAL)
    current_step: int = Field(default=0)
    total_steps: int = Field(default=0)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    context: Dict[str, Any] = Field(default_factory=dict, description="Saga context data")
    steps: List[SagaStepInstance] = Field(default_factory=list)
    error_message: Optional[str] = None
    compensation_reason: Optional[str] = None
    created_by: Optional[str] = Field(None, description="Creator identifier")
    tags: List[str] = Field(default_factory=list, description="Saga tags")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SagaEvent(BaseModel):
    """Saga event"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    saga_instance_id: str = Field(..., description="Saga instance ID")
    step_instance_id: Optional[str] = Field(None, description="Step instance ID")
    event_type: EventType = Field(..., description="Event type")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data: Dict[str, Any] = Field(default_factory=dict, description="Event data")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Event metadata")

class SagaCommand(BaseModel):
    """Saga command"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    saga_instance_id: str = Field(..., description="Target saga instance")
    command_type: str = Field(..., description="Command type")
    data: Dict[str, Any] = Field(default_factory=dict, description="Command data")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: Optional[str] = Field(None, description="Correlation ID")

# Request/Response Models
class CreateSagaRequest(BaseModel):
    """Request to create a new saga instance"""
    saga_name: str = Field(..., description="Saga definition name")
    saga_version: Optional[str] = Field(None, description="Saga version")
    context: Dict[str, Any] = Field(default_factory=dict, description="Initial context")
    priority: Priority = Field(default=Priority.NORMAL)
    correlation_id: Optional[str] = Field(None, description="Correlation ID")
    tenant_id: Optional[str] = Field(None, description="Tenant ID")
    tags: List[str] = Field(default_factory=list, description="Saga tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata")

class SagaResponse(BaseModel):
    """Saga response"""
    id: str
    saga_id: str
    status: SagaStatus
    created_at: datetime
    progress: float = Field(description="Completion percentage (0-100)")
    current_step_name: Optional[str] = None
    error_message: Optional[str] = None

class SagaListResponse(BaseModel):
    """Saga list response"""
    sagas: List[SagaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool

class SagaStatsResponse(BaseModel):
    """Saga statistics response"""
    total_sagas: int
    active_sagas: int
    completed_sagas: int
    failed_sagas: int
    compensated_sagas: int
    average_duration_ms: float
    success_rate: float
    throughput_per_minute: float

# SQLAlchemy Models
class SagaDefinitionDB(Base):
    """Saga definition database model"""
    __tablename__ = "saga_definitions"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, index=True)
    version = Column(String, nullable=False)
    description = Column(Text)
    definition = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(String)
    is_active = Column(Boolean, default=True)

class SagaInstanceDB(Base):
    """Saga instance database model"""
    __tablename__ = "saga_instances"
    
    id = Column(String, primary_key=True)
    saga_id = Column(String, nullable=False, index=True)
    saga_version = Column(String, nullable=False)
    tenant_id = Column(String, index=True)
    correlation_id = Column(String, index=True)
    parent_saga_id = Column(String, index=True)
    status = Column(SQLEnum(SagaStatus), nullable=False, index=True)
    priority = Column(SQLEnum(Priority), nullable=False, default=Priority.NORMAL)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_ms = Column(Integer)
    context = Column(JSON, default={})
    error_message = Column(Text)
    compensation_reason = Column(Text)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    tags = Column(JSON, default=[])
    metadata = Column(JSON, default={})

class SagaEventDB(Base):
    """Saga event database model"""
    __tablename__ = "saga_events"
    
    id = Column(String, primary_key=True)
    saga_instance_id = Column(String, nullable=False, index=True)
    step_instance_id = Column(String, index=True)
    event_type = Column(SQLEnum(EventType), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    data = Column(JSON, default={})
    metadata = Column(JSON, default={})

class SagaStepInstanceDB(Base):
    """Saga step instance database model"""
    __tablename__ = "saga_step_instances"
    
    id = Column(String, primary_key=True)
    step_id = Column(String, nullable=False)
    saga_instance_id = Column(String, nullable=False, index=True)
    status = Column(SQLEnum(StepStatus), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_ms = Column(Integer)
    retry_count = Column(Integer, default=0)
    error_message = Column(Text)
    input_data = Column(JSON, default={})
    output_data = Column(JSON, default={})
    compensation_data = Column(JSON)
    metadata = Column(JSON, default={})
