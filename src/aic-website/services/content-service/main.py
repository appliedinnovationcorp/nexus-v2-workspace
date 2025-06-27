"""
Content Service
Handles content management, blog posts, pages, and media
"""

import os
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
import logging
import uuid
import mimetypes

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
    title="Content Service",
    description="Handles content management and media",
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
REQUEST_COUNT = Counter('content_requests_total', 'Total content service requests', ['method', 'endpoint'])
CONTENT_OPERATIONS = Counter('content_operations_total', 'Total content operations', ['operation'])
MEDIA_UPLOADS = Counter('media_uploads_total', 'Total media uploads', ['type'])

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/content_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "aic-website-media")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")

# Database connection pool
db_pool = None
redis_client = None
http_client = None
s3_client = None

# Pydantic models
class ContentBase(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None
    status: str = "draft"  # draft, published, archived

class ContentCreate(ContentBase):
    pass

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None

class Content(ContentBase):
    id: str
    author_id: str
    author_name: str
    view_count: int = 0
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

class MediaFile(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    url: str
    alt_text: Optional[str] = None
    uploaded_by: str
    created_at: datetime

class Category(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime

# Database initialization
async def init_db():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        
        # Create tables if they don't exist
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL,
                    slug VARCHAR(200) UNIQUE NOT NULL,
                    description TEXT,
                    parent_id UUID REFERENCES categories(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS content (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(500) NOT NULL,
                    slug VARCHAR(500) UNIQUE NOT NULL,
                    content TEXT NOT NULL,
                    excerpt TEXT,
                    featured_image TEXT,
                    meta_title VARCHAR(500),
                    meta_description TEXT,
                    tags TEXT[],
                    category_id UUID REFERENCES categories(id),
                    status VARCHAR(20) DEFAULT 'draft',
                    author_id UUID NOT NULL,
                    author_name VARCHAR(200) NOT NULL,
                    view_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    published_at TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS media_files (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    filename VARCHAR(500) NOT NULL,
                    original_filename VARCHAR(500) NOT NULL,
                    file_size BIGINT NOT NULL,
                    mime_type VARCHAR(200) NOT NULL,
                    url TEXT NOT NULL,
                    alt_text TEXT,
                    uploaded_by UUID NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create indexes
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_content_category ON content(category_id);")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_content_published ON content(published_at);")
            
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

def init_s3_client():
    """Initialize S3 client"""
    global s3_client
    try:
        s3_client = boto3.client(
            's3',
            region_name=AWS_REGION,
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        logger.info("S3 client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize S3 client: {e}")

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
async def upload_to_s3(file: UploadFile, user_id: str) -> str:
    """Upload file to S3 and return URL"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{user_id}/{uuid.uuid4()}{file_extension}"
        
        # Upload to S3
        s3_client.upload_fileobj(
            file.file,
            AWS_S3_BUCKET,
            unique_filename,
            ExtraArgs={
                'ContentType': file.content_type,
                'ACL': 'public-read'
            }
        )
        
        # Return public URL
        return f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        
    except ClientError as e:
        logger.error(f"S3 upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File upload failed"
        )

# API Routes
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    await init_db()
    await init_redis()
    await init_http_client()
    init_s3_client()

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
        
        return {"status": "healthy", "service": "content-service"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.post("/content", response_model=Content)
async def create_content(content_data: ContentCreate,
                        current_user: dict = Depends(get_current_user)):
    """Create new content"""
    with tracer.start_as_current_span("create_content"):
        REQUEST_COUNT.labels(method="POST", endpoint="/content").inc()
        CONTENT_OPERATIONS.labels(operation="create").inc()
        
        try:
            async with db_pool.acquire() as conn:
                # Check if slug already exists
                existing = await conn.fetchval(
                    "SELECT id FROM content WHERE slug = $1",
                    content_data.slug
                )
                
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Content with this slug already exists"
                    )
                
                # Get category ID if category provided
                category_id = None
                if content_data.category:
                    category_id = await conn.fetchval(
                        "SELECT id FROM categories WHERE slug = $1",
                        content_data.category
                    )
                
                # Set published_at if status is published
                published_at = None
                if content_data.status == "published":
                    published_at = datetime.utcnow()
                
                # Create content
                content = await conn.fetchrow("""
                    INSERT INTO content (
                        title, slug, content, excerpt, featured_image,
                        meta_title, meta_description, tags, category_id,
                        status, author_id, author_name, published_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING *
                """, content_data.title, content_data.slug, content_data.content,
                    content_data.excerpt, content_data.featured_image,
                    content_data.meta_title, content_data.meta_description,
                    content_data.tags, category_id, content_data.status,
                    current_user["user_id"], current_user["email"], published_at)
                
                # Clear cache
                await redis_client.delete("content:published")
                
                return Content(**dict(content), category=content_data.category)
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create content: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create content"
            )

@app.get("/content", response_model=List[Content])
async def get_content_list(status: Optional[str] = Query(None),
                          category: Optional[str] = Query(None),
                          limit: int = Query(20, le=100),
                          offset: int = Query(0, ge=0)):
    """Get content list with filtering"""
    with tracer.start_as_current_span("get_content_list"):
        REQUEST_COUNT.labels(method="GET", endpoint="/content").inc()
        
        try:
            # Build query dynamically
            where_conditions = []
            params = []
            param_count = 1
            
            if status:
                where_conditions.append(f"c.status = ${param_count}")
                params.append(status)
                param_count += 1
            
            if category:
                where_conditions.append(f"cat.slug = ${param_count}")
                params.append(category)
                param_count += 1
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            params.extend([limit, offset])
            
            query = f"""
                SELECT c.*, cat.slug as category
                FROM content c
                LEFT JOIN categories cat ON c.category_id = cat.id
                {where_clause}
                ORDER BY c.created_at DESC
                LIMIT ${param_count} OFFSET ${param_count + 1}
            """
            
            async with db_pool.acquire() as conn:
                content_list = await conn.fetch(query, *params)
                
                return [Content(**dict(content)) for content in content_list]
                
        except Exception as e:
            logger.error(f"Failed to get content list: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve content"
            )

@app.get("/content/{slug}", response_model=Content)
async def get_content_by_slug(slug: str):
    """Get content by slug"""
    with tracer.start_as_current_span("get_content_by_slug"):
        REQUEST_COUNT.labels(method="GET", endpoint="/content/{slug}").inc()
        
        try:
            # Try to get from cache first
            cached_content = await redis_client.get(f"content:{slug}")
            if cached_content:
                import json
                return Content(**json.loads(cached_content))
            
            async with db_pool.acquire() as conn:
                content = await conn.fetchrow("""
                    SELECT c.*, cat.slug as category
                    FROM content c
                    LEFT JOIN categories cat ON c.category_id = cat.id
                    WHERE c.slug = $1
                """, slug)
                
                if not content:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Content not found"
                    )
                
                # Increment view count
                await conn.execute(
                    "UPDATE content SET view_count = view_count + 1 WHERE slug = $1",
                    slug
                )
                
                content_data = Content(**dict(content))
                
                # Cache the content for 5 minutes
                await redis_client.setex(
                    f"content:{slug}",
                    300,
                    content_data.json()
                )
                
                return content_data
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get content: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve content"
            )

@app.post("/upload", response_model=MediaFile)
async def upload_media(file: UploadFile = File(...),
                      alt_text: Optional[str] = None,
                      current_user: dict = Depends(get_current_user)):
    """Upload media file"""
    with tracer.start_as_current_span("upload_media"):
        REQUEST_COUNT.labels(method="POST", endpoint="/upload").inc()
        MEDIA_UPLOADS.labels(type=file.content_type.split('/')[0] if file.content_type else 'unknown').inc()
        
        try:
            # Validate file type
            allowed_types = ['image/', 'video/', 'audio/', 'application/pdf']
            if not any(file.content_type.startswith(t) for t in allowed_types):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File type not allowed"
                )
            
            # Validate file size (10MB limit)
            if file.size > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File size too large (max 10MB)"
                )
            
            # Upload to S3
            file_url = await upload_to_s3(file, current_user["user_id"])
            
            # Save to database
            async with db_pool.acquire() as conn:
                media_file = await conn.fetchrow("""
                    INSERT INTO media_files (
                        filename, original_filename, file_size, mime_type,
                        url, alt_text, uploaded_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                """, os.path.basename(file_url), file.filename, file.size,
                    file.content_type, file_url, alt_text, current_user["user_id"])
                
                return MediaFile(**dict(media_file))
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload media: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
