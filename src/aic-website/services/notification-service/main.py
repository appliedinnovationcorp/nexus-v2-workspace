"""
Notification Service
Handles email notifications, push notifications, and messaging
"""

import os
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import asyncpg
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, generate_latest
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
import httpx
import boto3
from botocore.exceptions import ClientError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import logging
import json
from jinja2 import Template

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name=os.getenv("JAEGER_AGENT_HOST", "jaeger-agent"),
    agent_port=int(os.getenv("JAEGER_AGENT_PORT", "6831")),
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Initialize FastAPI app
app = FastAPI(
    title="Notification Service",
    description="Handles notifications and messaging",
    version="1.0.0"
)

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
REQUEST_COUNT = Counter('notification_requests_total', 'Total notification requests', ['method', 'endpoint'])
NOTIFICATIONS_SENT = Counter('notifications_sent_total', 'Total notifications sent', ['type', 'status'])
EMAIL_QUEUE_SIZE = Histogram('email_queue_size', 'Email queue size')

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/notification_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@aicorp.com")

# AWS SES configuration
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
USE_AWS_SES = os.getenv("USE_AWS_SES", "false").lower() == "true"

# Database connection pool
db_pool = None
redis_client = None
http_client = None
ses_client = None

# Pydantic models
class EmailNotification(BaseModel):
    to_email: EmailStr
    subject: str
    body: str
    html_body: Optional[str] = None
    template_name: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    priority: str = "normal"  # low, normal, high
    scheduled_at: Optional[datetime] = None

class PushNotification(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    priority: str = "normal"
    scheduled_at: Optional[datetime] = None

class SMSNotification(BaseModel):
    phone_number: str
    message: str
    priority: str = "normal"
    scheduled_at: Optional[datetime] = None

class NotificationTemplate(BaseModel):
    name: str
    subject_template: str
    body_template: str
    html_template: Optional[str] = None
    variables: List[str] = []

class NotificationHistory(BaseModel):
    id: str
    type: str
    recipient: str
    subject: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

class NotificationPreferences(BaseModel):
    user_id: str
    email_enabled: bool = True
    push_enabled: bool = True
    sms_enabled: bool = False
    marketing_emails: bool = False
    security_alerts: bool = True
    product_updates: bool = True
    newsletter: bool = True

# Database initialization
async def init_db():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        
        # Create tables if they don't exist
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS notification_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) UNIQUE NOT NULL,
                    subject_template TEXT NOT NULL,
                    body_template TEXT NOT NULL,
                    html_template TEXT,
                    variables TEXT[],
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS notification_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    type VARCHAR(50) NOT NULL,
                    recipient VARCHAR(500) NOT NULL,
                    subject TEXT,
                    body TEXT,
                    status VARCHAR(50) NOT NULL,
                    error_message TEXT,
                    metadata JSONB,
                    sent_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS notification_preferences (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID UNIQUE NOT NULL,
                    email_enabled BOOLEAN DEFAULT true,
                    push_enabled BOOLEAN DEFAULT true,
                    sms_enabled BOOLEAN DEFAULT false,
                    marketing_emails BOOLEAN DEFAULT false,
                    security_alerts BOOLEAN DEFAULT true,
                    product_updates BOOLEAN DEFAULT true,
                    newsletter BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS notification_queue (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    type VARCHAR(50) NOT NULL,
                    recipient VARCHAR(500) NOT NULL,
                    payload JSONB NOT NULL,
                    priority VARCHAR(20) DEFAULT 'normal',
                    scheduled_at TIMESTAMP,
                    attempts INTEGER DEFAULT 0,
                    max_attempts INTEGER DEFAULT 3,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create indexes
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_at);")
            
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = redis.from_url(REDIS_URL)
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise

async def init_http_client():
    """Initialize HTTP client"""
    global http_client
    http_client = httpx.AsyncClient()

def init_ses_client():
    """Initialize AWS SES client"""
    global ses_client
    if USE_AWS_SES:
        try:
            ses_client = boto3.client(
                'ses',
                region_name=AWS_REGION,
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
            )
            logger.info("SES client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize SES client: {e}")

# Authentication dependency
async def verify_token(authorization: str):
    """Verify JWT token with auth service"""
    try:
        headers = {"Authorization": authorization}
        response = await http_client.post(
            f"{AUTH_SERVICE_URL}/verify-token",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )

async def get_current_user(authorization: str = Depends(lambda: None)):
    """Get current user from token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    token_data = await verify_token(authorization)
    return token_data

# Utility functions
async def send_email_smtp(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    """Send email using SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add text part
        text_part = MIMEText(body, 'plain')
        msg.attach(text_part)
        
        # Add HTML part if provided
        if html_body:
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        logger.error(f"SMTP email failed: {e}")
        return False

async def send_email_ses(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    """Send email using AWS SES"""
    try:
        destination = {'ToAddresses': [to_email]}
        message = {
            'Subject': {'Data': subject, 'Charset': 'UTF-8'},
            'Body': {'Text': {'Data': body, 'Charset': 'UTF-8'}}
        }
        
        if html_body:
            message['Body']['Html'] = {'Data': html_body, 'Charset': 'UTF-8'}
        
        response = ses_client.send_email(
            Source=FROM_EMAIL,
            Destination=destination,
            Message=message
        )
        
        return True
    except ClientError as e:
        logger.error(f"SES email failed: {e}")
        return False

async def render_template(template_name: str, data: Dict[str, Any]) -> tuple:
    """Render email template with data"""
    try:
        async with db_pool.acquire() as conn:
            template = await conn.fetchrow(
                "SELECT * FROM notification_templates WHERE name = $1",
                template_name
            )
            
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Template not found"
                )
            
            # Render templates
            subject_template = Template(template['subject_template'])
            body_template = Template(template['body_template'])
            
            subject = subject_template.render(**data)
            body = body_template.render(**data)
            
            html_body = None
            if template['html_template']:
                html_template = Template(template['html_template'])
                html_body = html_template.render(**data)
            
            return subject, body, html_body
            
    except Exception as e:
        logger.error(f"Template rendering failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Template rendering failed"
        )

async def process_email_queue():
    """Process pending emails in queue"""
    try:
        async with db_pool.acquire() as conn:
            # Get pending emails
            emails = await conn.fetch("""
                SELECT * FROM notification_queue 
                WHERE type = 'email' AND status = 'pending' 
                AND (scheduled_at IS NULL OR scheduled_at <= NOW())
                AND attempts < max_attempts
                ORDER BY priority DESC, created_at ASC
                LIMIT 10
            """)
            
            for email in emails:
                try:
                    payload = email['payload']
                    
                    # Send email
                    success = False
                    if USE_AWS_SES:
                        success = await send_email_ses(
                            payload['to_email'],
                            payload['subject'],
                            payload['body'],
                            payload.get('html_body')
                        )
                    else:
                        success = await send_email_smtp(
                            payload['to_email'],
                            payload['subject'],
                            payload['body'],
                            payload.get('html_body')
                        )
                    
                    if success:
                        # Mark as sent
                        await conn.execute("""
                            UPDATE notification_queue 
                            SET status = 'sent', sent_at = NOW()
                            WHERE id = $1
                        """, email['id'])
                        
                        # Add to history
                        await conn.execute("""
                            INSERT INTO notification_history 
                            (type, recipient, subject, body, status, sent_at)
                            VALUES ($1, $2, $3, $4, $5, NOW())
                        """, 'email', payload['to_email'], payload['subject'], 
                            payload['body'], 'sent')
                        
                        NOTIFICATIONS_SENT.labels(type="email", status="success").inc()
                    else:
                        # Increment attempts
                        await conn.execute("""
                            UPDATE notification_queue 
                            SET attempts = attempts + 1
                            WHERE id = $1
                        """, email['id'])
                        
                        # Mark as failed if max attempts reached
                        if email['attempts'] + 1 >= email['max_attempts']:
                            await conn.execute("""
                                UPDATE notification_queue 
                                SET status = 'failed'
                                WHERE id = $1
                            """, email['id'])
                            
                            NOTIFICATIONS_SENT.labels(type="email", status="failed").inc()
                
                except Exception as e:
                    logger.error(f"Failed to process email {email['id']}: {e}")
                    
                    # Mark as failed
                    await conn.execute("""
                        UPDATE notification_queue 
                        SET status = 'failed', error_message = $2
                        WHERE id = $1
                    """, email['id'], str(e))
                    
                    NOTIFICATIONS_SENT.labels(type="email", status="error").inc()
    
    except Exception as e:
        logger.error(f"Email queue processing failed: {e}")

# Background task to process notifications
async def notification_worker():
    """Background worker to process notification queue"""
    while True:
        try:
            await process_email_queue()
            await asyncio.sleep(10)  # Process every 10 seconds
        except Exception as e:
            logger.error(f"Notification worker error: {e}")
            await asyncio.sleep(30)  # Wait longer on error

# API Routes
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    await init_db()
    await init_redis()
    await init_http_client()
    init_ses_client()
    
    # Start background worker
    asyncio.create_task(notification_worker())

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()
    if http_client:
        await http_client.aclose()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        # Check Redis connection
        await redis_client.ping()
        
        return {"status": "healthy", "service": "notification-service"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.post("/send/email")
async def send_email_notification(email_data: EmailNotification,
                                background_tasks: BackgroundTasks,
                                current_user: dict = Depends(get_current_user)):
    """Send email notification"""
    with tracer.start_as_current_span("send_email_notification"):
        REQUEST_COUNT.labels(method="POST", endpoint="/send/email").inc()
        
        try:
            subject = email_data.subject
            body = email_data.body
            html_body = email_data.html_body
            
            # Render template if provided
            if email_data.template_name and email_data.template_data:
                subject, body, html_body = await render_template(
                    email_data.template_name, 
                    email_data.template_data
                )
            
            # Add to queue
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO notification_queue 
                    (type, recipient, payload, priority, scheduled_at)
                    VALUES ($1, $2, $3, $4, $5)
                """, 'email', email_data.to_email, {
                    'to_email': email_data.to_email,
                    'subject': subject,
                    'body': body,
                    'html_body': html_body
                }, email_data.priority, email_data.scheduled_at)
            
            return {"message": "Email queued for delivery"}
            
        except Exception as e:
            logger.error(f"Failed to queue email: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to queue email"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
