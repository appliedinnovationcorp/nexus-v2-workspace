"""
Content Generation Router
AI-powered content generation endpoints
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from pydantic import BaseModel, Field
from starlette.responses import StreamingResponse

from services.llm_service import LLMService
from core.config import get_settings

logger = structlog.get_logger()
router = APIRouter()


class ContentGenerationRequest(BaseModel):
    """Content generation request model"""
    type: str = Field(..., description="Content type (blog, case-study, whitepaper, email, social, webpage)")
    topic: str = Field(..., description="Content topic or subject")
    audience: str = Field(..., description="Target audience (smb, enterprise, technical, executive)")
    tone: str = Field(..., description="Content tone (professional, casual, technical, persuasive)")
    length: str = Field(..., description="Content length (short, medium, long)")
    keywords: List[str] = Field(default=[], description="Keywords to include")
    context: Optional[str] = Field(default=None, description="Additional context or requirements")
    division: Optional[str] = Field(default="general", description="AIC division (smb, enterprise, general)")
    language: str = Field(default="en", description="Content language")
    model: Optional[str] = Field(default=None, description="Specific LLM model to use")
    temperature: Optional[float] = Field(default=None, description="Generation temperature (0.0-1.0)")


class ContentGenerationResponse(BaseModel):
    """Content generation response model"""
    content: str
    metadata: Dict[str, Any]
    generation_time: float
    word_count: int
    timestamp: str


class ContentOptimizationRequest(BaseModel):
    """Content optimization request model"""
    content: str = Field(..., description="Content to optimize")
    optimization_type: str = Field(..., description="Optimization type (seo, readability, engagement)")
    target_keywords: List[str] = Field(default=[], description="SEO keywords to target")
    audience: str = Field(..., description="Target audience")


async def get_llm_service(request: Request) -> LLMService:
    """Dependency to get LLM service"""
    return request.app.state.llm_service


@router.post("/generate", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Generate AI-powered content"""
    
    logger.info("Content generation requested", 
                type=request.type, 
                topic=request.topic, 
                audience=request.audience)
    
    try:
        # Build system prompt based on content type and audience
        system_prompt = _build_system_prompt(request)
        
        # Build user prompt
        user_prompt = _build_user_prompt(request)
        
        # Generate content
        start_time = datetime.now()
        
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            model=request.model,
            temperature=request.temperature,
            provider="openai"  # Default to OpenAI for content generation
        )
        
        end_time = datetime.now()
        generation_time = (end_time - start_time).total_seconds()
        
        # Calculate word count
        word_count = len(result["content"].split())
        
        logger.info("Content generated successfully", 
                   word_count=word_count, 
                   generation_time=generation_time)
        
        return ContentGenerationResponse(
            content=result["content"],
            metadata={
                "model": result["model"],
                "provider": result["provider"],
                "tokens": result["tokens"],
                "type": request.type,
                "audience": request.audience,
                "tone": request.tone,
                "length": request.length,
                "keywords": request.keywords
            },
            generation_time=generation_time,
            word_count=word_count,
            timestamp=end_time.isoformat()
        )
        
    except Exception as e:
        logger.error("Content generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")


@router.post("/generate/stream")
async def generate_content_stream(
    request: ContentGenerationRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Generate content with streaming response"""
    
    logger.info("Streaming content generation requested", 
                type=request.type, 
                topic=request.topic)
    
    try:
        system_prompt = _build_system_prompt(request)
        user_prompt = _build_user_prompt(request)
        
        async def generate():
            async for chunk in llm_service.stream_text(
                prompt=user_prompt,
                system_prompt=system_prompt,
                model=request.model,
                temperature=request.temperature,
                provider="openai"
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache"}
        )
        
    except Exception as e:
        logger.error("Streaming content generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Streaming generation failed: {str(e)}")


@router.post("/optimize", response_model=ContentGenerationResponse)
async def optimize_content(
    request: ContentOptimizationRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Optimize existing content for SEO, readability, or engagement"""
    
    logger.info("Content optimization requested", 
                optimization_type=request.optimization_type,
                content_length=len(request.content))
    
    try:
        system_prompt = _build_optimization_system_prompt(request.optimization_type)
        user_prompt = _build_optimization_user_prompt(request)
        
        start_time = datetime.now()
        
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            provider="openai"
        )
        
        end_time = datetime.now()
        generation_time = (end_time - start_time).total_seconds()
        word_count = len(result["content"].split())
        
        logger.info("Content optimized successfully", 
                   optimization_type=request.optimization_type,
                   word_count=word_count)
        
        return ContentGenerationResponse(
            content=result["content"],
            metadata={
                "model": result["model"],
                "provider": result["provider"],
                "tokens": result["tokens"],
                "optimization_type": request.optimization_type,
                "target_keywords": request.target_keywords,
                "audience": request.audience
            },
            generation_time=generation_time,
            word_count=word_count,
            timestamp=end_time.isoformat()
        )
        
    except Exception as e:
        logger.error("Content optimization failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Content optimization failed: {str(e)}")


@router.get("/templates/{content_type}")
async def get_content_templates(content_type: str):
    """Get content templates for specific content types"""
    
    templates = {
        "blog": {
            "structure": ["Introduction", "Main Points", "Examples", "Conclusion", "Call to Action"],
            "word_counts": {"short": 500, "medium": 1000, "long": 2000},
            "seo_tips": ["Include target keywords in title and headers", "Use meta descriptions", "Add internal links"]
        },
        "case-study": {
            "structure": ["Challenge", "Solution", "Implementation", "Results", "Lessons Learned"],
            "word_counts": {"short": 800, "medium": 1500, "long": 3000},
            "elements": ["Client testimonial", "Metrics and ROI", "Visual elements"]
        },
        "whitepaper": {
            "structure": ["Executive Summary", "Problem Statement", "Solution Overview", "Technical Details", "Conclusion"],
            "word_counts": {"short": 2000, "medium": 4000, "long": 8000},
            "elements": ["Research citations", "Data visualizations", "Expert quotes"]
        },
        "email": {
            "structure": ["Subject Line", "Opening", "Value Proposition", "Call to Action", "Signature"],
            "word_counts": {"short": 100, "medium": 200, "long": 400},
            "tips": ["Personalization", "Clear CTA", "Mobile optimization"]
        }
    }
    
    if content_type not in templates:
        raise HTTPException(status_code=404, detail=f"Templates for {content_type} not found")
    
    return templates[content_type]


def _build_system_prompt(request: ContentGenerationRequest) -> str:
    """Build system prompt based on request parameters"""
    
    base_prompt = """You are an expert content writer for Applied Innovation Corporation (AIC), 
    a leading AI consulting company. AIC provides AI-specific transformation, consulting, and enablement 
    services, along with the flagship Nexus PaaS platform and fractional CTO services.
    
    AIC has two main divisions:
    - SMB Division: Focuses on small and medium businesses with affordable, practical AI solutions
    - Enterprise Division: Focuses on large enterprises with comprehensive, secure, scalable AI solutions
    
    Create engaging, informative, and professional content that demonstrates deep AI expertise 
    while being accessible to the target audience."""
    
    # Add audience-specific instructions
    if request.audience == "smb":
        base_prompt += "\n\nFocus on practical, affordable AI solutions. Use clear, jargon-free language. Emphasize ROI and quick implementation."
    elif request.audience == "enterprise":
        base_prompt += "\n\nFocus on scalability, security, and compliance. Use technical depth appropriate for enterprise decision-makers."
    elif request.audience == "technical":
        base_prompt += "\n\nUse technical language and provide implementation details. Include code examples and architectural considerations."
    elif request.audience == "executive":
        base_prompt += "\n\nFocus on business impact, strategic value, and competitive advantage. Use executive-level language."
    
    # Add tone instructions
    tone_instructions = {
        "professional": "Maintain a professional, authoritative tone throughout.",
        "casual": "Use a conversational, approachable tone while maintaining expertise.",
        "technical": "Use precise technical language with detailed explanations.",
        "persuasive": "Use compelling arguments and strong calls to action."
    }
    
    if request.tone in tone_instructions:
        base_prompt += f"\n\n{tone_instructions[request.tone]}"
    
    return base_prompt


def _build_user_prompt(request: ContentGenerationRequest) -> str:
    """Build user prompt based on request parameters"""
    
    length_guidelines = {
        "short": "Keep it concise and focused (300-800 words).",
        "medium": "Provide comprehensive coverage (800-1500 words).",
        "long": "Create in-depth, detailed content (1500+ words)."
    }
    
    prompt = f"""Create a {request.type} about "{request.topic}" for {request.audience} audience.

Content Requirements:
- Type: {request.type}
- Topic: {request.topic}
- Audience: {request.audience}
- Tone: {request.tone}
- Length: {request.length} - {length_guidelines.get(request.length, '')}
"""
    
    if request.keywords:
        prompt += f"\n- Keywords to include: {', '.join(request.keywords)}"
    
    if request.context:
        prompt += f"\n- Additional context: {request.context}"
    
    if request.division != "general":
        prompt += f"\n- Focus on AIC's {request.division.upper()} division"
    
    prompt += "\n\nEnsure the content is original, engaging, and provides real value to the reader."
    
    return prompt


def _build_optimization_system_prompt(optimization_type: str) -> str:
    """Build system prompt for content optimization"""
    
    base_prompt = """You are an expert content optimizer specializing in AI and technology content 
    for Applied Innovation Corporation (AIC)."""
    
    if optimization_type == "seo":
        base_prompt += "\n\nOptimize content for search engines while maintaining readability and value. Focus on keyword integration, meta descriptions, and structure."
    elif optimization_type == "readability":
        base_prompt += "\n\nImprove content readability and clarity. Simplify complex concepts, improve flow, and enhance comprehension."
    elif optimization_type == "engagement":
        base_prompt += "\n\nEnhance content engagement through compelling headlines, storytelling, and interactive elements."
    
    return base_prompt


def _build_optimization_user_prompt(request: ContentOptimizationRequest) -> str:
    """Build user prompt for content optimization"""
    
    prompt = f"""Optimize the following content for {request.optimization_type}:

Target Audience: {request.audience}
"""
    
    if request.target_keywords:
        prompt += f"Target Keywords: {', '.join(request.target_keywords)}\n"
    
    prompt += f"""
Original Content:
{request.content}

Optimized Content:"""
    
    return prompt
