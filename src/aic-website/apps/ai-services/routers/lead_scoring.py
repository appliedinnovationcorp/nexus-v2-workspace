"""
Lead Scoring Router
AI-powered lead qualification and scoring endpoints
"""

import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog
import re

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, EmailStr

from services.llm_service import LLMService
from core.config import get_settings

logger = structlog.get_logger()
router = APIRouter()


class LeadScoringRequest(BaseModel):
    """Lead scoring request model"""
    email: EmailStr = Field(..., description="Lead email address")
    company: Optional[str] = Field(default=None, description="Company name")
    name: Optional[str] = Field(default=None, description="Contact name")
    phone: Optional[str] = Field(default=None, description="Phone number")
    message: str = Field(..., description="Lead message or inquiry")
    source: Optional[str] = Field(default="website", description="Lead source")
    division: Optional[str] = Field(default="general", description="Target division (smb, enterprise, general)")
    industry: Optional[str] = Field(default=None, description="Company industry")
    company_size: Optional[str] = Field(default=None, description="Company size indicator")
    budget_indicator: Optional[str] = Field(default=None, description="Budget or investment level")
    timeline: Optional[str] = Field(default=None, description="Implementation timeline")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class LeadScoringResponse(BaseModel):
    """Lead scoring response model"""
    score: float = Field(..., description="Lead score (0-100)")
    category: str = Field(..., description="Lead category (hot, warm, cold)")
    confidence: float = Field(..., description="Confidence in scoring (0-1)")
    reasoning: str = Field(..., description="AI reasoning for the score")
    next_actions: List[str] = Field(..., description="Recommended next actions")
    factors: Dict[str, float] = Field(..., description="Individual scoring factors")
    priority: str = Field(..., description="Priority level (high, medium, low)")
    estimated_value: Optional[float] = Field(default=None, description="Estimated deal value")
    conversion_probability: float = Field(..., description="Probability of conversion (0-1)")


class BulkLeadScoringRequest(BaseModel):
    """Bulk lead scoring request"""
    leads: List[LeadScoringRequest] = Field(..., description="List of leads to score")
    batch_size: int = Field(default=10, description="Batch processing size")


class BulkLeadScoringResponse(BaseModel):
    """Bulk lead scoring response"""
    results: List[LeadScoringResponse] = Field(..., description="Scoring results")
    summary: Dict[str, Any] = Field(..., description="Batch processing summary")
    processing_time: float = Field(..., description="Total processing time")


async def get_llm_service(request: Request) -> LLMService:
    """Dependency to get LLM service"""
    return request.app.state.llm_service


@router.post("/score", response_model=LeadScoringResponse)
async def score_lead(
    request: LeadScoringRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Score a single lead using AI analysis"""
    
    logger.info("Lead scoring requested", 
                email=request.email, 
                company=request.company,
                division=request.division)
    
    try:
        start_time = datetime.now()
        
        # Analyze lead data
        lead_analysis = await _analyze_lead_data(request)
        
        # Generate AI-powered scoring
        ai_score = await _generate_ai_score(request, llm_service)
        
        # Calculate composite score
        final_score = await _calculate_composite_score(lead_analysis, ai_score)
        
        # Determine category and priority
        category = _determine_lead_category(final_score["score"])
        priority = _determine_priority(final_score["score"], request.division)
        
        # Generate next actions
        next_actions = await _generate_next_actions(request, final_score, llm_service)
        
        # Estimate deal value
        estimated_value = _estimate_deal_value(request, final_score["score"])
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        logger.info("Lead scored successfully", 
                   email=request.email,
                   score=final_score["score"],
                   category=category,
                   processing_time=processing_time)
        
        return LeadScoringResponse(
            score=final_score["score"],
            category=category,
            confidence=final_score["confidence"],
            reasoning=final_score["reasoning"],
            next_actions=next_actions,
            factors=final_score["factors"],
            priority=priority,
            estimated_value=estimated_value,
            conversion_probability=final_score["conversion_probability"]
        )
        
    except Exception as e:
        logger.error("Lead scoring failed", error=str(e), email=request.email)
        raise HTTPException(status_code=500, detail=f"Lead scoring failed: {str(e)}")


@router.post("/score/bulk", response_model=BulkLeadScoringResponse)
async def score_leads_bulk(
    request: BulkLeadScoringRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Score multiple leads in batch"""
    
    logger.info("Bulk lead scoring requested", count=len(request.leads))
    
    try:
        start_time = datetime.now()
        results = []
        
        # Process leads in batches
        for i in range(0, len(request.leads), request.batch_size):
            batch = request.leads[i:i + request.batch_size]
            
            # Process batch concurrently
            batch_tasks = [
                score_lead(lead, llm_service) 
                for lead in batch
            ]
            
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Handle results and exceptions
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error("Batch lead scoring error", error=str(result))
                    # Create error response
                    results.append(LeadScoringResponse(
                        score=0.0,
                        category="error",
                        confidence=0.0,
                        reasoning=f"Scoring failed: {str(result)}",
                        next_actions=["Manual review required"],
                        factors={},
                        priority="low",
                        conversion_probability=0.0
                    ))
                else:
                    results.append(result)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        # Generate summary
        summary = _generate_batch_summary(results, processing_time)
        
        logger.info("Bulk lead scoring completed", 
                   total_leads=len(request.leads),
                   successful=summary["successful_scores"],
                   processing_time=processing_time)
        
        return BulkLeadScoringResponse(
            results=results,
            summary=summary,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error("Bulk lead scoring failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Bulk scoring failed: {str(e)}")


@router.get("/score/factors")
async def get_scoring_factors():
    """Get available scoring factors and their weights"""
    
    factors = {
        "email_quality": {
            "weight": 0.15,
            "description": "Email address quality and domain reputation",
            "criteria": ["Corporate domain", "Professional format", "Deliverability"]
        },
        "company_profile": {
            "weight": 0.25,
            "description": "Company size, industry, and growth indicators",
            "criteria": ["Company size", "Industry relevance", "Growth stage"]
        },
        "message_intent": {
            "weight": 0.30,
            "description": "Message content analysis for buying intent",
            "criteria": ["Specific needs", "Urgency indicators", "Budget mentions"]
        },
        "division_fit": {
            "weight": 0.20,
            "description": "Alignment with AIC division capabilities",
            "criteria": ["SMB vs Enterprise fit", "Service alignment", "Complexity match"]
        },
        "engagement_potential": {
            "weight": 0.10,
            "description": "Likelihood of meaningful engagement",
            "criteria": ["Contact completeness", "Professional indicators", "Follow-up potential"]
        }
    }
    
    return {
        "factors": factors,
        "total_weight": sum(factor["weight"] for factor in factors.values()),
        "scoring_range": {"min": 0, "max": 100},
        "categories": {
            "hot": {"min": 80, "max": 100, "description": "High-priority leads requiring immediate attention"},
            "warm": {"min": 50, "max": 79, "description": "Qualified leads for nurturing campaigns"},
            "cold": {"min": 0, "max": 49, "description": "Low-priority leads for automated follow-up"}
        }
    }


async def _analyze_lead_data(request: LeadScoringRequest) -> Dict[str, Any]:
    """Analyze lead data for scoring factors"""
    
    analysis = {
        "email_quality": _analyze_email_quality(request.email),
        "company_profile": _analyze_company_profile(request.company, request.industry, request.company_size),
        "message_content": _analyze_message_content(request.message),
        "contact_completeness": _analyze_contact_completeness(request),
        "division_alignment": _analyze_division_alignment(request.division, request.message)
    }
    
    return analysis


def _analyze_email_quality(email: str) -> float:
    """Analyze email quality (0-1 score)"""
    score = 0.5  # Base score
    
    # Check domain quality
    domain = email.split('@')[1].lower()
    
    # Corporate domains get higher scores
    if domain in ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']:
        score = 0.3  # Personal email
    elif domain.endswith('.edu'):
        score = 0.6  # Educational
    elif domain.endswith('.gov'):
        score = 0.8  # Government
    else:
        score = 0.8  # Likely corporate
    
    # Check email format
    if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        score += 0.1
    
    return min(score, 1.0)


def _analyze_company_profile(company: Optional[str], industry: Optional[str], size: Optional[str]) -> float:
    """Analyze company profile (0-1 score)"""
    score = 0.3  # Base score
    
    if company:
        score += 0.3
        # Bonus for recognizable company patterns
        if len(company) > 3 and not company.lower() in ['test', 'example']:
            score += 0.1
    
    if industry:
        score += 0.2
        # Bonus for AI-relevant industries
        ai_relevant = ['technology', 'software', 'fintech', 'healthcare', 'manufacturing']
        if any(term in industry.lower() for term in ai_relevant):
            score += 0.1
    
    if size:
        score += 0.1
        # Enterprise indicators
        if any(term in size.lower() for term in ['large', 'enterprise', '1000+', '500+']):
            score += 0.2
    
    return min(score, 1.0)


def _analyze_message_content(message: str) -> float:
    """Analyze message content for buying intent (0-1 score)"""
    score = 0.2  # Base score
    
    message_lower = message.lower()
    
    # Intent indicators
    high_intent_words = ['budget', 'timeline', 'implement', 'purchase', 'contract', 'proposal', 'quote']
    medium_intent_words = ['interested', 'explore', 'discuss', 'learn more', 'demo', 'consultation']
    urgency_words = ['urgent', 'asap', 'immediately', 'soon', 'quickly']
    
    # Score based on intent words
    high_intent_count = sum(1 for word in high_intent_words if word in message_lower)
    medium_intent_count = sum(1 for word in medium_intent_words if word in message_lower)
    urgency_count = sum(1 for word in urgency_words if word in message_lower)
    
    score += high_intent_count * 0.2
    score += medium_intent_count * 0.1
    score += urgency_count * 0.15
    
    # Message length and quality
    if len(message) > 50:
        score += 0.1
    if len(message) > 200:
        score += 0.1
    
    return min(score, 1.0)


def _analyze_contact_completeness(request: LeadScoringRequest) -> float:
    """Analyze contact information completeness (0-1 score)"""
    score = 0.2  # Base for having email
    
    if request.name:
        score += 0.2
    if request.company:
        score += 0.3
    if request.phone:
        score += 0.2
    if request.industry:
        score += 0.1
    
    return min(score, 1.0)


def _analyze_division_alignment(division: Optional[str], message: str) -> float:
    """Analyze alignment with AIC divisions (0-1 score)"""
    if not division or division == "general":
        return 0.5
    
    message_lower = message.lower()
    
    if division == "smb":
        smb_indicators = ['small business', 'startup', 'growing company', 'affordable', 'budget-friendly']
        score = 0.5 + sum(0.1 for indicator in smb_indicators if indicator in message_lower)
    elif division == "enterprise":
        enterprise_indicators = ['enterprise', 'large company', 'corporation', 'compliance', 'scale']
        score = 0.5 + sum(0.1 for indicator in enterprise_indicators if indicator in message_lower)
    else:
        score = 0.5
    
    return min(score, 1.0)


async def _generate_ai_score(request: LeadScoringRequest, llm_service: LLMService) -> Dict[str, Any]:
    """Generate AI-powered lead score using LLM"""
    
    system_prompt = """You are an expert lead scoring analyst for Applied Innovation Corporation (AIC), 
    a leading AI consulting company. Analyze the lead information and provide a detailed scoring assessment.
    
    Consider these factors:
    1. Business need alignment with AI services
    2. Decision-making authority indicators
    3. Budget and timeline readiness
    4. Company fit for AIC's services
    5. Message quality and professionalism
    
    Provide your analysis in a structured format with specific reasoning."""
    
    user_prompt = f"""Analyze this lead for scoring:
    
    Email: {request.email}
    Company: {request.company or 'Not provided'}
    Name: {request.name or 'Not provided'}
    Division: {request.division}
    Industry: {request.industry or 'Not provided'}
    Company Size: {request.company_size or 'Not provided'}
    Message: {request.message}
    Source: {request.source}
    
    Provide a lead score (0-100) with detailed reasoning and specific factors that influenced the score."""
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for consistent scoring
            provider="openai"
        )
        
        # Parse AI response for structured data
        ai_analysis = _parse_ai_scoring_response(result["content"])
        
        return {
            "ai_score": ai_analysis.get("score", 50),
            "ai_reasoning": ai_analysis.get("reasoning", result["content"]),
            "ai_factors": ai_analysis.get("factors", {}),
            "confidence": 0.8  # AI confidence level
        }
        
    except Exception as e:
        logger.error("AI scoring failed", error=str(e))
        return {
            "ai_score": 50,
            "ai_reasoning": "AI analysis unavailable, using baseline scoring",
            "ai_factors": {},
            "confidence": 0.3
        }


def _parse_ai_scoring_response(response: str) -> Dict[str, Any]:
    """Parse AI response for structured scoring data"""
    # Simple parsing - in production, use more sophisticated NLP
    score_match = re.search(r'score[:\s]*(\d+)', response.lower())
    score = int(score_match.group(1)) if score_match else 50
    
    return {
        "score": min(max(score, 0), 100),
        "reasoning": response,
        "factors": {}
    }


async def _calculate_composite_score(lead_analysis: Dict[str, Any], ai_score: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate final composite score from all factors"""
    
    # Factor weights
    weights = {
        "email_quality": 0.15,
        "company_profile": 0.25,
        "message_content": 0.30,
        "contact_completeness": 0.10,
        "division_alignment": 0.20
    }
    
    # Calculate weighted score from analysis
    analysis_score = sum(
        lead_analysis.get(factor, 0.5) * weight 
        for factor, weight in weights.items()
    ) * 100
    
    # Combine with AI score (70% analysis, 30% AI)
    final_score = (analysis_score * 0.7) + (ai_score["ai_score"] * 0.3)
    
    # Calculate conversion probability
    conversion_probability = min(final_score / 100 * 0.8, 0.9)  # Max 90% probability
    
    return {
        "score": round(final_score, 1),
        "confidence": (ai_score["confidence"] + 0.8) / 2,  # Average AI and analysis confidence
        "reasoning": ai_score["ai_reasoning"],
        "factors": {
            "email_quality": round(lead_analysis.get("email_quality", 0.5) * 100, 1),
            "company_profile": round(lead_analysis.get("company_profile", 0.5) * 100, 1),
            "message_intent": round(lead_analysis.get("message_content", 0.5) * 100, 1),
            "division_fit": round(lead_analysis.get("division_alignment", 0.5) * 100, 1),
            "engagement_potential": round(lead_analysis.get("contact_completeness", 0.5) * 100, 1)
        },
        "conversion_probability": round(conversion_probability, 2)
    }


def _determine_lead_category(score: float) -> str:
    """Determine lead category based on score"""
    if score >= 80:
        return "hot"
    elif score >= 50:
        return "warm"
    else:
        return "cold"


def _determine_priority(score: float, division: Optional[str]) -> str:
    """Determine priority level"""
    if score >= 85:
        return "high"
    elif score >= 60:
        return "medium"
    else:
        return "low"


async def _generate_next_actions(request: LeadScoringRequest, score_data: Dict[str, Any], llm_service: LLMService) -> List[str]:
    """Generate recommended next actions based on lead score"""
    
    score = score_data["score"]
    category = _determine_lead_category(score)
    
    # Base actions by category
    if category == "hot":
        actions = [
            "Schedule immediate consultation call",
            "Send personalized proposal within 24 hours",
            "Assign to senior sales representative"
        ]
    elif category == "warm":
        actions = [
            "Send targeted follow-up email within 48 hours",
            "Provide relevant case studies and resources",
            "Schedule discovery call within 1 week"
        ]
    else:
        actions = [
            "Add to nurturing email campaign",
            "Send educational content about AI benefits",
            "Follow up in 2-3 weeks"
        ]
    
    # Add division-specific actions
    if request.division == "smb":
        actions.append("Highlight SMB-specific pricing and packages")
    elif request.division == "enterprise":
        actions.append("Prepare enterprise security and compliance materials")
    
    return actions


def _estimate_deal_value(request: LeadScoringRequest, score: float) -> Optional[float]:
    """Estimate potential deal value based on lead characteristics"""
    
    base_value = 10000  # Base deal value
    
    # Adjust based on division
    if request.division == "enterprise":
        base_value = 50000
    elif request.division == "smb":
        base_value = 5000
    
    # Adjust based on company size
    if request.company_size:
        size_lower = request.company_size.lower()
        if "large" in size_lower or "enterprise" in size_lower:
            base_value *= 2
        elif "medium" in size_lower:
            base_value *= 1.5
    
    # Adjust based on score (higher score = higher value potential)
    score_multiplier = 0.5 + (score / 100)  # 0.5 to 1.5 multiplier
    
    estimated_value = base_value * score_multiplier
    
    return round(estimated_value, 2)


def _generate_batch_summary(results: List[LeadScoringResponse], processing_time: float) -> Dict[str, Any]:
    """Generate summary for batch processing"""
    
    total_leads = len(results)
    successful_scores = len([r for r in results if r.category != "error"])
    
    # Category distribution
    categories = {"hot": 0, "warm": 0, "cold": 0, "error": 0}
    total_score = 0
    
    for result in results:
        categories[result.category] += 1
        if result.category != "error":
            total_score += result.score
    
    average_score = total_score / successful_scores if successful_scores > 0 else 0
    
    return {
        "total_leads": total_leads,
        "successful_scores": successful_scores,
        "failed_scores": total_leads - successful_scores,
        "average_score": round(average_score, 1),
        "category_distribution": categories,
        "processing_time": round(processing_time, 2),
        "leads_per_second": round(total_leads / processing_time, 2) if processing_time > 0 else 0
    }
