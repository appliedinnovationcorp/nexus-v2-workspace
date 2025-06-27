"""
Lead Service - Advanced Lead Management and CRM Integration
Handles lead capture, scoring, nurturing, and conversion tracking with AI-powered insights
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
import asyncio
import logging
import json
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
from sqlalchemy import create_engine, Column, String, DateTime, JSON, Text, Integer, Float, Boolean
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
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/lead_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://ai-engine:8004")
EVENT_BUS_URL = os.getenv("EVENT_BUS_URL", "http://event-bus:8007")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8003")

# Initialize FastAPI
app = FastAPI(
    title="Lead Service",
    description="Advanced lead management and CRM integration service",
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
leads_created_counter = Counter('leads_created_total', 'Total leads created', ['source', 'type'])
leads_converted_counter = Counter('leads_converted_total', 'Total leads converted', ['source'])
lead_scoring_duration = Histogram('lead_scoring_duration_seconds', 'Lead scoring duration')
lead_nurturing_counter = Counter('lead_nurturing_actions_total', 'Total nurturing actions', ['action_type'])

# Enums
class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    NURTURING = "nurturing"

class LeadSource(str, Enum):
    WEBSITE = "website"
    SOCIAL_MEDIA = "social_media"
    EMAIL_CAMPAIGN = "email_campaign"
    REFERRAL = "referral"
    COLD_OUTREACH = "cold_outreach"
    WEBINAR = "webinar"
    CONTENT_DOWNLOAD = "content_download"
    DEMO_REQUEST = "demo_request"

class LeadType(str, Enum):
    INDIVIDUAL = "individual"
    SMB = "smb"
    ENTERPRISE = "enterprise"
    PARTNER = "partner"

class NurturingActionType(str, Enum):
    EMAIL_SENT = "email_sent"
    CONTENT_SHARED = "content_shared"
    CALL_SCHEDULED = "call_scheduled"
    DEMO_BOOKED = "demo_booked"
    PROPOSAL_SENT = "proposal_sent"
    FOLLOW_UP = "follow_up"

# Database Models
class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, index=True)
    first_name = Column(String)
    last_name = Column(String)
    company = Column(String)
    job_title = Column(String)
    phone = Column(String)
    website = Column(String)
    industry = Column(String)
    company_size = Column(String)
    annual_revenue = Column(String)
    lead_source = Column(String, nullable=False, index=True)
    lead_type = Column(String, default=LeadType.INDIVIDUAL)
    status = Column(String, default=LeadStatus.NEW, index=True)
    score = Column(Float, default=0.0, index=True)
    qualification_notes = Column(Text)
    interests = Column(JSON, default=list)
    pain_points = Column(JSON, default=list)
    budget_range = Column(String)
    timeline = Column(String)
    decision_makers = Column(JSON, default=list)
    custom_fields = Column(JSON, default=dict)
    utm_source = Column(String)
    utm_medium = Column(String)
    utm_campaign = Column(String)
    utm_content = Column(String)
    utm_term = Column(String)
    referrer_url = Column(String)
    landing_page = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)
    assigned_to = Column(String)
    last_contacted = Column(DateTime)
    next_follow_up = Column(DateTime)
    conversion_date = Column(DateTime)
    conversion_value = Column(Float)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class LeadActivity(Base):
    __tablename__ = "lead_activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, nullable=False, index=True)
    activity_type = Column(String, nullable=False)
    description = Column(Text)
    metadata = Column(JSON, default=dict)
    performed_by = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LeadScore(Base):
    __tablename__ = "lead_scores"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, nullable=False, index=True)
    score = Column(Float, nullable=False)
    score_breakdown = Column(JSON, nullable=False)
    model_version = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class NurturingCampaign(Base):
    __tablename__ = "nurturing_campaigns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    target_criteria = Column(JSON, nullable=False)
    actions = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class NurturingAction(Base):
    __tablename__ = "nurturing_actions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, nullable=False, index=True)
    campaign_id = Column(String, nullable=False, index=True)
    action_type = Column(String, nullable=False)
    action_data = Column(JSON, nullable=False)
    scheduled_at = Column(DateTime)
    executed_at = Column(DateTime)
    status = Column(String, default="pending")
    result = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class LeadCreate(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[str] = None
    lead_source: LeadSource
    lead_type: Optional[LeadType] = LeadType.INDIVIDUAL
    interests: Optional[List[str]] = []
    pain_points: Optional[List[str]] = []
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    decision_makers: Optional[List[str]] = []
    custom_fields: Optional[Dict[str, Any]] = {}
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None
    referrer_url: Optional[str] = None
    landing_page: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    annual_revenue: Optional[str] = None
    lead_type: Optional[LeadType] = None
    status: Optional[LeadStatus] = None
    qualification_notes: Optional[str] = None
    interests: Optional[List[str]] = None
    pain_points: Optional[List[str]] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    decision_makers: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    assigned_to: Optional[str] = None
    next_follow_up: Optional[datetime] = None

class LeadResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    company: Optional[str]
    job_title: Optional[str]
    phone: Optional[str]
    lead_source: str
    lead_type: str
    status: str
    score: float
    created_at: datetime
    updated_at: datetime

class ActivityCreate(BaseModel):
    activity_type: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    performed_by: Optional[str] = None

# Lead Scoring AI Model
class LeadScoringModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = [
            'company_size_score', 'industry_score', 'job_title_score',
            'budget_score', 'timeline_score', 'engagement_score',
            'source_score', 'completeness_score'
        ]
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize or load the scoring model"""
        try:
            # Try to load existing model
            self.model = joblib.load('lead_scoring_model.pkl')
            self.scaler = joblib.load('lead_scoring_scaler.pkl')
        except:
            # Create and train a new model with sample data
            self._train_initial_model()
    
    def _train_initial_model(self):
        """Train initial model with sample data"""
        # Sample training data (in production, use real historical data)
        X_sample = np.array([
            [0.8, 0.9, 0.7, 0.8, 0.6, 0.5, 0.7, 0.9],  # High score lead
            [0.3, 0.4, 0.2, 0.3, 0.2, 0.1, 0.3, 0.4],  # Low score lead
            [0.6, 0.7, 0.5, 0.6, 0.4, 0.3, 0.5, 0.7],  # Medium score lead
            [0.9, 0.8, 0.8, 0.9, 0.7, 0.6, 0.8, 0.9],  # High score lead
            [0.2, 0.3, 0.1, 0.2, 0.1, 0.1, 0.2, 0.3],  # Low score lead
        ])
        y_sample = np.array([85, 25, 55, 90, 15])  # Corresponding scores
        
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X_sample)
        
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        # Convert to classification problem
        y_classes = np.digitize(y_sample, bins=[0, 30, 60, 100]) - 1
        self.model.fit(X_scaled, y_classes)
        
        # Save model
        joblib.dump(self.model, 'lead_scoring_model.pkl')
        joblib.dump(self.scaler, 'lead_scoring_scaler.pkl')
    
    def calculate_score(self, lead_data: dict) -> dict:
        """Calculate lead score based on various factors"""
        features = self._extract_features(lead_data)
        
        # Scale features
        features_array = np.array([list(features.values())]).reshape(1, -1)
        features_scaled = self.scaler.transform(features_array)
        
        # Predict score class and convert to score
        score_class = self.model.predict(features_scaled)[0]
        score_proba = self.model.predict_proba(features_scaled)[0]
        
        # Convert class to score (0-100)
        base_scores = [15, 45, 75, 95]
        final_score = base_scores[score_class]
        
        # Add some variation based on probability
        confidence = max(score_proba)
        final_score = final_score + (confidence - 0.5) * 20
        final_score = max(0, min(100, final_score))
        
        return {
            'total_score': round(final_score, 2),
            'breakdown': features,
            'confidence': round(confidence, 2)
        }
    
    def _extract_features(self, lead_data: dict) -> dict:
        """Extract scoring features from lead data"""
        features = {}
        
        # Company size score
        company_size = lead_data.get('company_size', '').lower()
        if 'enterprise' in company_size or '1000+' in company_size:
            features['company_size_score'] = 0.9
        elif 'medium' in company_size or '100-1000' in company_size:
            features['company_size_score'] = 0.7
        elif 'small' in company_size or '10-100' in company_size:
            features['company_size_score'] = 0.5
        else:
            features['company_size_score'] = 0.3
        
        # Industry score (tech industries score higher)
        industry = lead_data.get('industry', '').lower()
        tech_industries = ['technology', 'software', 'fintech', 'healthcare', 'manufacturing']
        if any(tech in industry for tech in tech_industries):
            features['industry_score'] = 0.8
        else:
            features['industry_score'] = 0.5
        
        # Job title score (decision makers score higher)
        job_title = lead_data.get('job_title', '').lower()
        decision_maker_titles = ['ceo', 'cto', 'cio', 'director', 'vp', 'manager', 'head']
        if any(title in job_title for title in decision_maker_titles):
            features['job_title_score'] = 0.8
        else:
            features['job_title_score'] = 0.4
        
        # Budget score
        budget = lead_data.get('budget_range', '').lower()
        if '100k+' in budget or 'enterprise' in budget:
            features['budget_score'] = 0.9
        elif '50k' in budget or '10k' in budget:
            features['budget_score'] = 0.6
        else:
            features['budget_score'] = 0.3
        
        # Timeline score (urgent needs score higher)
        timeline = lead_data.get('timeline', '').lower()
        if 'immediate' in timeline or 'asap' in timeline:
            features['timeline_score'] = 0.9
        elif 'month' in timeline:
            features['timeline_score'] = 0.7
        elif 'quarter' in timeline:
            features['timeline_score'] = 0.5
        else:
            features['timeline_score'] = 0.3
        
        # Engagement score (based on interests and pain points)
        interests = lead_data.get('interests', [])
        pain_points = lead_data.get('pain_points', [])
        engagement = len(interests) + len(pain_points)
        features['engagement_score'] = min(1.0, engagement / 5.0)
        
        # Source score
        source = lead_data.get('lead_source', '').lower()
        high_value_sources = ['demo_request', 'referral', 'webinar']
        if source in high_value_sources:
            features['source_score'] = 0.8
        else:
            features['source_score'] = 0.5
        
        # Completeness score
        required_fields = ['first_name', 'last_name', 'company', 'job_title', 'phone']
        completed_fields = sum(1 for field in required_fields if lead_data.get(field))
        features['completeness_score'] = completed_fields / len(required_fields)
        
        return features

# Global scoring model
scoring_model = LeadScoringModel()

# Lead Management Implementation
class LeadManager:
    def __init__(self, db: Session):
        self.db = db
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def create_lead(self, lead_data: LeadCreate) -> Lead:
        """Create a new lead with automatic scoring"""
        with tracer.start_as_current_span("create_lead") as span:
            span.set_attribute("lead_source", lead_data.lead_source)
            span.set_attribute("lead_type", lead_data.lead_type)
            
            # Check for existing lead
            existing_lead = self.db.query(Lead).filter(Lead.email == lead_data.email).first()
            if existing_lead:
                # Update existing lead instead of creating duplicate
                return await self.update_lead(existing_lead.id, LeadUpdate(**lead_data.dict(exclude={'email'})))
            
            # Create new lead
            lead = Lead(**lead_data.dict())
            self.db.add(lead)
            self.db.commit()
            self.db.refresh(lead)
            
            # Calculate initial score
            await self._score_lead(lead)
            
            # Log activity
            await self._log_activity(lead.id, "lead_created", "Lead created from " + lead_data.lead_source)
            
            # Trigger nurturing workflow
            await self._trigger_nurturing(lead)
            
            # Publish event
            await self._publish_lead_event(lead, "lead_created")
            
            leads_created_counter.labels(source=lead_data.lead_source, type=lead_data.lead_type).inc()
            
            return lead
    
    async def _score_lead(self, lead: Lead):
        """Score a lead using AI model"""
        with lead_scoring_duration.time():
            lead_dict = {
                'company_size': lead.company_size,
                'industry': lead.industry,
                'job_title': lead.job_title,
                'budget_range': lead.budget_range,
                'timeline': lead.timeline,
                'interests': lead.interests,
                'pain_points': lead.pain_points,
                'lead_source': lead.lead_source
            }
            
            score_result = scoring_model.calculate_score(lead_dict)
            
            # Update lead score
            lead.score = score_result['total_score']
            self.db.commit()
            
            # Store detailed score
            lead_score = LeadScore(
                lead_id=lead.id,
                score=score_result['total_score'],
                score_breakdown=score_result['breakdown'],
                model_version="1.0"
            )
            self.db.add(lead_score)
            self.db.commit()
    
    async def _log_activity(self, lead_id: str, activity_type: str, description: str, metadata: dict = None):
        """Log lead activity"""
        activity = LeadActivity(
            lead_id=lead_id,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {}
        )
        self.db.add(activity)
        self.db.commit()
    
    async def _trigger_nurturing(self, lead: Lead):
        """Trigger appropriate nurturing campaigns"""
        # Find matching campaigns
        campaigns = self.db.query(NurturingCampaign).filter(
            NurturingCampaign.is_active == True
        ).all()
        
        for campaign in campaigns:
            if self._lead_matches_criteria(lead, campaign.target_criteria):
                await self._enroll_in_campaign(lead, campaign)
    
    def _lead_matches_criteria(self, lead: Lead, criteria: dict) -> bool:
        """Check if lead matches campaign criteria"""
        # Simple criteria matching (can be enhanced)
        if 'lead_source' in criteria:
            if lead.lead_source not in criteria['lead_source']:
                return False
        
        if 'min_score' in criteria:
            if lead.score < criteria['min_score']:
                return False
        
        if 'max_score' in criteria:
            if lead.score > criteria['max_score']:
                return False
        
        if 'lead_type' in criteria:
            if lead.lead_type not in criteria['lead_type']:
                return False
        
        return True
    
    async def _enroll_in_campaign(self, lead: Lead, campaign: NurturingCampaign):
        """Enroll lead in nurturing campaign"""
        for action_config in campaign.actions:
            # Schedule nurturing action
            scheduled_time = datetime.now(timezone.utc) + timedelta(
                days=action_config.get('delay_days', 0),
                hours=action_config.get('delay_hours', 0)
            )
            
            nurturing_action = NurturingAction(
                lead_id=lead.id,
                campaign_id=campaign.id,
                action_type=action_config['type'],
                action_data=action_config['data'],
                scheduled_at=scheduled_time
            )
            self.db.add(nurturing_action)
        
        self.db.commit()
        await self._log_activity(lead.id, "campaign_enrolled", f"Enrolled in campaign: {campaign.name}")
    
    async def _publish_lead_event(self, lead: Lead, event_type: str):
        """Publish lead event to event bus"""
        try:
            event_data = {
                "id": str(uuid.uuid4()),
                "topic": "lead_events",
                "event_type": event_type,
                "payload": {
                    "lead_id": lead.id,
                    "email": lead.email,
                    "company": lead.company,
                    "lead_source": lead.lead_source,
                    "lead_type": lead.lead_type,
                    "status": lead.status,
                    "score": lead.score
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source_service": "lead-service"
            }
            
            await self.http_client.post(
                f"{EVENT_BUS_URL}/events/publish",
                json=event_data
            )
        except Exception as e:
            logging.error(f"Failed to publish lead event: {str(e)}")

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
        "service": "lead-service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/leads", response_model=LeadResponse)
async def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    """Create a new lead"""
    with tracer.start_as_current_span("api_create_lead"):
        manager = LeadManager(db)
        lead = await manager.create_lead(lead_data)
        
        return LeadResponse(
            id=lead.id,
            email=lead.email,
            first_name=lead.first_name,
            last_name=lead.last_name,
            company=lead.company,
            job_title=lead.job_title,
            phone=lead.phone,
            lead_source=lead.lead_source,
            lead_type=lead.lead_type,
            status=lead.status,
            score=lead.score,
            created_at=lead.created_at,
            updated_at=lead.updated_at
        )

@app.get("/leads/{lead_id}")
async def get_lead(lead_id: str, db: Session = Depends(get_db)):
    """Get lead details"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get activities
    activities = db.query(LeadActivity).filter(
        LeadActivity.lead_id == lead_id
    ).order_by(LeadActivity.created_at.desc()).limit(50).all()
    
    # Get score history
    scores = db.query(LeadScore).filter(
        LeadScore.lead_id == lead_id
    ).order_by(LeadScore.created_at.desc()).limit(10).all()
    
    return {
        "lead": lead.__dict__,
        "activities": [activity.__dict__ for activity in activities],
        "score_history": [score.__dict__ for score in scores]
    }

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
