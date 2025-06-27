"""
Personalization Router
AI-powered user experience personalization endpoints
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from services.llm_service import LLMService
from core.config import get_settings

logger = structlog.get_logger()
router = APIRouter()


class PersonalizationRequest(BaseModel):
    """Personalization request model"""
    user_id: str = Field(..., description="Unique user identifier")
    division: Optional[str] = Field(default=None, description="User division (smb, enterprise)")
    industry: Optional[str] = Field(default=None, description="User industry")
    company_size: Optional[str] = Field(default=None, description="Company size")
    interests: List[str] = Field(default=[], description="User interests")
    previous_interactions: List[str] = Field(default=[], description="Previous page visits/interactions")
    session_data: Dict[str, Any] = Field(default_factory=dict, description="Current session data")
    page_context: Optional[str] = Field(default=None, description="Current page context")
    behavioral_data: Dict[str, Any] = Field(default_factory=dict, description="User behavioral data")


class RecommendationItem(BaseModel):
    """Individual recommendation item"""
    type: str = Field(..., description="Recommendation type")
    title: str = Field(..., description="Recommendation title")
    description: str = Field(..., description="Recommendation description")
    url: Optional[str] = Field(default=None, description="Recommendation URL")
    score: float = Field(..., description="Recommendation relevance score")
    reasoning: str = Field(..., description="Why this was recommended")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class PersonalizedContent(BaseModel):
    """Personalized content model"""
    hero_message: Optional[str] = Field(default=None, description="Personalized hero message")
    cta_text: Optional[str] = Field(default=None, description="Personalized CTA text")
    featured_services: List[str] = Field(default=[], description="Recommended services")
    content_tone: str = Field(default="professional", description="Recommended content tone")
    messaging_focus: List[str] = Field(default=[], description="Key messaging points to emphasize")


class UserProfile(BaseModel):
    """User profile model"""
    segment: str = Field(..., description="User segment classification")
    interests: List[str] = Field(..., description="Identified interests")
    predicted_needs: List[str] = Field(..., description="Predicted user needs")
    engagement_level: str = Field(..., description="Engagement level (high, medium, low)")
    conversion_likelihood: float = Field(..., description="Likelihood to convert (0-1)")
    preferred_communication: str = Field(..., description="Preferred communication style")


class PersonalizationResponse(BaseModel):
    """Personalization response model"""
    recommendations: List[RecommendationItem] = Field(..., description="Personalized recommendations")
    personalized_content: PersonalizedContent = Field(..., description="Personalized content elements")
    user_profile: UserProfile = Field(..., description="Updated user profile")
    confidence: float = Field(..., description="Confidence in personalization (0-1)")
    timestamp: str = Field(..., description="Response timestamp")


async def get_llm_service(request: Request) -> LLMService:
    """Dependency to get LLM service"""
    return request.app.state.llm_service


@router.post("/recommend", response_model=PersonalizationResponse)
async def get_personalized_recommendations(
    request: PersonalizationRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Get personalized recommendations for a user"""
    
    logger.info("Personalization requested", 
                user_id=request.user_id,
                division=request.division,
                industry=request.industry)
    
    try:
        start_time = datetime.now()
        
        # Analyze user profile
        user_profile = await _analyze_user_profile(request, llm_service)
        
        # Generate recommendations
        recommendations = await _generate_recommendations(request, user_profile, llm_service)
        
        # Create personalized content
        personalized_content = await _generate_personalized_content(request, user_profile, llm_service)
        
        # Calculate confidence
        confidence = _calculate_personalization_confidence(request, user_profile)
        
        end_time = datetime.now()
        
        logger.info("Personalization completed", 
                   user_id=request.user_id,
                   recommendations_count=len(recommendations),
                   confidence=confidence)
        
        return PersonalizationResponse(
            recommendations=recommendations,
            personalized_content=personalized_content,
            user_profile=user_profile,
            confidence=confidence,
            timestamp=end_time.isoformat()
        )
        
    except Exception as e:
        logger.error("Personalization failed", error=str(e), user_id=request.user_id)
        raise HTTPException(status_code=500, detail=f"Personalization failed: {str(e)}")


@router.get("/segments")
async def get_user_segments():
    """Get available user segments and their characteristics"""
    
    segments = {
        "enterprise_decision_maker": {
            "description": "C-level executives and decision makers at large enterprises",
            "characteristics": ["High budget authority", "Strategic focus", "Compliance concerns"],
            "recommended_approach": "Executive-level messaging, ROI focus, security emphasis"
        },
        "enterprise_technical": {
            "description": "Technical leaders and architects at enterprises",
            "characteristics": ["Technical depth", "Implementation focus", "Integration concerns"],
            "recommended_approach": "Technical details, architecture discussions, proof of concepts"
        },
        "smb_owner": {
            "description": "Small business owners and entrepreneurs",
            "characteristics": ["Cost-conscious", "Quick ROI focus", "Hands-on approach"],
            "recommended_approach": "Practical benefits, affordable solutions, quick wins"
        },
        "smb_technical": {
            "description": "Technical staff at small to medium businesses",
            "characteristics": ["Resource constraints", "Multi-role responsibilities", "Practical solutions"],
            "recommended_approach": "Easy implementation, comprehensive support, training resources"
        },
        "startup_founder": {
            "description": "Startup founders and early-stage entrepreneurs",
            "characteristics": ["Innovation focus", "Growth orientation", "Limited resources"],
            "recommended_approach": "Scalable solutions, growth enablement, competitive advantage"
        },
        "consultant_partner": {
            "description": "Consultants and potential partners",
            "characteristics": ["Industry expertise", "Client focus", "Partnership potential"],
            "recommended_approach": "Partnership opportunities, white-label solutions, referral programs"
        }
    }
    
    return {
        "segments": segments,
        "total_segments": len(segments),
        "classification_factors": [
            "Company size",
            "Industry vertical",
            "Role/title",
            "Behavioral patterns",
            "Content engagement",
            "Technical sophistication"
        ]
    }


async def _analyze_user_profile(request: PersonalizationRequest, llm_service: LLMService) -> UserProfile:
    """Analyze user data to create comprehensive profile"""
    
    # Determine user segment
    segment = _classify_user_segment(request)
    
    # Analyze interests and needs
    interests = _analyze_user_interests(request)
    predicted_needs = await _predict_user_needs(request, llm_service)
    
    # Assess engagement level
    engagement_level = _assess_engagement_level(request)
    
    # Calculate conversion likelihood
    conversion_likelihood = _calculate_conversion_likelihood(request, segment)
    
    # Determine communication preference
    preferred_communication = _determine_communication_style(request, segment)
    
    return UserProfile(
        segment=segment,
        interests=interests,
        predicted_needs=predicted_needs,
        engagement_level=engagement_level,
        conversion_likelihood=conversion_likelihood,
        preferred_communication=preferred_communication
    )


def _classify_user_segment(request: PersonalizationRequest) -> str:
    """Classify user into appropriate segment"""
    
    # Default segment
    segment = "general_visitor"
    
    # Check division preference
    if request.division == "enterprise":
        # Determine if technical or business role
        technical_indicators = ["developer", "architect", "engineer", "technical", "cto", "cio"]
        business_indicators = ["ceo", "president", "director", "manager", "executive"]
        
        session_data_str = str(request.session_data).lower()
        interests_str = " ".join(request.interests).lower()
        
        if any(indicator in session_data_str or indicator in interests_str for indicator in technical_indicators):
            segment = "enterprise_technical"
        elif any(indicator in session_data_str or indicator in interests_str for indicator in business_indicators):
            segment = "enterprise_decision_maker"
        else:
            segment = "enterprise_decision_maker"  # Default for enterprise
            
    elif request.division == "smb":
        # Check if owner or technical staff
        owner_indicators = ["owner", "founder", "ceo", "president"]
        technical_indicators = ["developer", "it", "technical", "engineer"]
        
        session_data_str = str(request.session_data).lower()
        interests_str = " ".join(request.interests).lower()
        
        if any(indicator in session_data_str or indicator in interests_str for indicator in owner_indicators):
            segment = "smb_owner"
        elif any(indicator in session_data_str or indicator in interests_str for indicator in technical_indicators):
            segment = "smb_technical"
        else:
            segment = "smb_owner"  # Default for SMB
    
    # Check for startup indicators
    if request.company_size and "startup" in request.company_size.lower():
        segment = "startup_founder"
    
    # Check for consultant indicators
    consultant_indicators = ["consultant", "consulting", "advisor", "partner"]
    if request.industry and any(indicator in request.industry.lower() for indicator in consultant_indicators):
        segment = "consultant_partner"
    
    return segment


def _analyze_user_interests(request: PersonalizationRequest) -> List[str]:
    """Analyze and expand user interests"""
    
    interests = list(request.interests)  # Start with provided interests
    
    # Infer interests from interactions
    for interaction in request.previous_interactions:
        interaction_lower = interaction.lower()
        
        if "ai" in interaction_lower or "artificial-intelligence" in interaction_lower:
            interests.append("AI Technology")
        if "automation" in interaction_lower:
            interests.append("Process Automation")
        if "consulting" in interaction_lower:
            interests.append("AI Consulting")
        if "nexus" in interaction_lower:
            interests.append("AI Platform")
        if "case-studies" in interaction_lower:
            interests.append("Success Stories")
        if "pricing" in interaction_lower:
            interests.append("Cost Analysis")
    
    # Remove duplicates and return
    return list(set(interests))


async def _predict_user_needs(request: PersonalizationRequest, llm_service: LLMService) -> List[str]:
    """Use AI to predict user needs based on profile"""
    
    system_prompt = """You are an expert in analyzing user behavior and predicting business needs 
    for AI consulting services. Based on the user profile, predict their most likely needs and pain points."""
    
    user_prompt = f"""Analyze this user profile and predict their top 3-5 business needs:
    
    Division: {request.division or 'Not specified'}
    Industry: {request.industry or 'Not specified'}
    Company Size: {request.company_size or 'Not specified'}
    Interests: {', '.join(request.interests) if request.interests else 'None specified'}
    Previous Interactions: {', '.join(request.previous_interactions) if request.previous_interactions else 'None'}
    
    Predict their most likely business needs related to AI and technology transformation."""
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.6,
            provider="openai"
        )
        
        # Parse needs from AI response
        needs = _parse_predicted_needs(result["content"])
        return needs
        
    except Exception as e:
        logger.error("AI needs prediction failed", error=str(e))
        # Fallback to rule-based prediction
        return _fallback_needs_prediction(request)


def _parse_predicted_needs(ai_response: str) -> List[str]:
    """Parse predicted needs from AI response"""
    # Simple parsing - in production, use more sophisticated NLP
    lines = ai_response.split('\n')
    needs = []
    
    for line in lines:
        line = line.strip()
        if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
            # Clean up the line
            clean_line = line.lstrip('-•0123456789. ').strip()
            if clean_line and len(clean_line) > 10:  # Reasonable length
                needs.append(clean_line)
    
    return needs[:5]  # Return top 5 needs


def _fallback_needs_prediction(request: PersonalizationRequest) -> List[str]:
    """Fallback needs prediction using rules"""
    
    needs = []
    
    if request.division == "enterprise":
        needs.extend([
            "Scalable AI infrastructure",
            "Enterprise security and compliance",
            "AI strategy and roadmap development",
            "Legacy system integration"
        ])
    elif request.division == "smb":
        needs.extend([
            "Affordable AI solutions",
            "Quick ROI and implementation",
            "Process automation",
            "Customer service enhancement"
        ])
    
    # Add industry-specific needs
    if request.industry:
        industry_lower = request.industry.lower()
        if "healthcare" in industry_lower:
            needs.append("HIPAA-compliant AI solutions")
        elif "finance" in industry_lower:
            needs.append("Regulatory compliance and risk management")
        elif "manufacturing" in industry_lower:
            needs.append("Predictive maintenance and quality control")
    
    return needs[:5]


def _assess_engagement_level(request: PersonalizationRequest) -> str:
    """Assess user engagement level"""
    
    engagement_score = 0
    
    # Score based on interactions
    engagement_score += len(request.previous_interactions) * 10
    
    # Score based on session data
    if request.session_data:
        engagement_score += len(request.session_data) * 5
    
    # Score based on provided information
    if request.interests:
        engagement_score += len(request.interests) * 15
    
    if request.industry:
        engagement_score += 20
    
    if request.company_size:
        engagement_score += 15
    
    # Classify engagement level
    if engagement_score >= 80:
        return "high"
    elif engagement_score >= 40:
        return "medium"
    else:
        return "low"


def _calculate_conversion_likelihood(request: PersonalizationRequest, segment: str) -> float:
    """Calculate likelihood of conversion"""
    
    base_likelihood = 0.3  # Base 30% likelihood
    
    # Adjust based on segment
    segment_multipliers = {
        "enterprise_decision_maker": 1.5,
        "enterprise_technical": 1.2,
        "smb_owner": 1.3,
        "smb_technical": 1.1,
        "startup_founder": 1.4,
        "consultant_partner": 1.6
    }
    
    likelihood = base_likelihood * segment_multipliers.get(segment, 1.0)
    
    # Adjust based on engagement
    engagement_level = _assess_engagement_level(request)
    if engagement_level == "high":
        likelihood *= 1.4
    elif engagement_level == "medium":
        likelihood *= 1.2
    
    # Adjust based on provided information completeness
    info_completeness = sum([
        bool(request.division),
        bool(request.industry),
        bool(request.company_size),
        bool(request.interests),
        bool(request.previous_interactions)
    ]) / 5
    
    likelihood *= (0.8 + info_completeness * 0.4)  # 0.8 to 1.2 multiplier
    
    return min(likelihood, 0.95)  # Cap at 95%


def _determine_communication_style(request: PersonalizationRequest, segment: str) -> str:
    """Determine preferred communication style"""
    
    style_mapping = {
        "enterprise_decision_maker": "executive",
        "enterprise_technical": "technical",
        "smb_owner": "practical",
        "smb_technical": "straightforward",
        "startup_founder": "innovative",
        "consultant_partner": "collaborative"
    }
    
    return style_mapping.get(segment, "professional")


async def _generate_recommendations(
    request: PersonalizationRequest, 
    user_profile: UserProfile, 
    llm_service: LLMService
) -> List[RecommendationItem]:
    """Generate personalized recommendations"""
    
    recommendations = []
    
    # Content recommendations based on segment
    if user_profile.segment == "enterprise_decision_maker":
        recommendations.extend([
            RecommendationItem(
                type="case_study",
                title="Enterprise AI Transformation Success Stories",
                description="See how Fortune 500 companies achieved 300%+ ROI with AIC's AI solutions",
                url="/case-studies/enterprise",
                score=0.9,
                reasoning="High relevance for enterprise decision makers seeking proven results"
            ),
            RecommendationItem(
                type="consultation",
                title="Executive AI Strategy Session",
                description="Free 60-minute consultation with our AI strategy experts",
                url="/contact?type=executive-consultation",
                score=0.85,
                reasoning="Direct path to engagement for executive-level prospects"
            )
        ])
    
    elif user_profile.segment == "smb_owner":
        recommendations.extend([
            RecommendationItem(
                type="pricing",
                title="SMB AI Solutions Pricing",
                description="Affordable AI packages starting at $500/month with quick ROI",
                url="/smb/pricing",
                score=0.9,
                reasoning="SMB owners are cost-conscious and need clear pricing information"
            ),
            RecommendationItem(
                type="demo",
                title="15-Minute AI Demo",
                description="See how AI can transform your business in just 15 minutes",
                url="/demo?segment=smb",
                score=0.8,
                reasoning="Quick, low-commitment way to show value to busy SMB owners"
            )
        ])
    
    # Add interest-based recommendations
    for interest in user_profile.interests:
        if "automation" in interest.lower():
            recommendations.append(
                RecommendationItem(
                    type="resource",
                    title="Process Automation Guide",
                    description="Complete guide to automating business processes with AI",
                    url="/resources/automation-guide",
                    score=0.75,
                    reasoning=f"Matches user interest in {interest}"
                )
            )
    
    # Sort by score and return top recommendations
    recommendations.sort(key=lambda x: x.score, reverse=True)
    return recommendations[:5]


async def _generate_personalized_content(
    request: PersonalizationRequest,
    user_profile: UserProfile,
    llm_service: LLMService
) -> PersonalizedContent:
    """Generate personalized content elements"""
    
    # Generate personalized hero message
    hero_message = await _generate_hero_message(request, user_profile, llm_service)
    
    # Generate personalized CTA
    cta_text = _generate_cta_text(user_profile)
    
    # Recommend featured services
    featured_services = _recommend_featured_services(user_profile)
    
    # Determine content tone
    content_tone = user_profile.preferred_communication
    
    # Generate messaging focus
    messaging_focus = _generate_messaging_focus(user_profile)
    
    return PersonalizedContent(
        hero_message=hero_message,
        cta_text=cta_text,
        featured_services=featured_services,
        content_tone=content_tone,
        messaging_focus=messaging_focus
    )


async def _generate_hero_message(
    request: PersonalizationRequest,
    user_profile: UserProfile,
    llm_service: LLMService
) -> str:
    """Generate personalized hero message"""
    
    system_prompt = """You are a marketing copywriter for AIC, specializing in personalized messaging. 
    Create compelling hero messages that resonate with specific user segments."""
    
    user_prompt = f"""Create a personalized hero message for this user profile:
    
    Segment: {user_profile.segment}
    Industry: {request.industry or 'General'}
    Interests: {', '.join(user_profile.interests)}
    Predicted Needs: {', '.join(user_profile.predicted_needs)}
    Communication Style: {user_profile.preferred_communication}
    
    Create a compelling 1-2 sentence hero message that speaks directly to their needs and situation."""
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            provider="openai"
        )
        
        return result["content"].strip().strip('"')
        
    except Exception as e:
        logger.error("Hero message generation failed", error=str(e))
        return _fallback_hero_message(user_profile)


def _fallback_hero_message(user_profile: UserProfile) -> str:
    """Fallback hero message based on segment"""
    
    messages = {
        "enterprise_decision_maker": "Transform your enterprise with AI solutions that deliver measurable ROI and competitive advantage.",
        "enterprise_technical": "Build scalable AI infrastructure with enterprise-grade security and seamless integration.",
        "smb_owner": "Grow your business with affordable AI solutions that deliver results in weeks, not months.",
        "smb_technical": "Implement AI solutions quickly with comprehensive support and easy-to-use tools.",
        "startup_founder": "Scale your startup with AI-powered innovation and competitive differentiation.",
        "consultant_partner": "Partner with AIC to deliver cutting-edge AI solutions to your clients."
    }
    
    return messages.get(user_profile.segment, "Transform your business with AI solutions tailored to your needs.")


def _generate_cta_text(user_profile: UserProfile) -> str:
    """Generate personalized CTA text"""
    
    cta_mapping = {
        "enterprise_decision_maker": "Schedule Executive Consultation",
        "enterprise_technical": "Request Technical Demo",
        "smb_owner": "Get Started Today",
        "smb_technical": "Try Free Demo",
        "startup_founder": "Accelerate Growth",
        "consultant_partner": "Explore Partnership"
    }
    
    return cta_mapping.get(user_profile.segment, "Get Started")


def _recommend_featured_services(user_profile: UserProfile) -> List[str]:
    """Recommend featured services based on profile"""
    
    service_mapping = {
        "enterprise_decision_maker": ["AI Strategy Consulting", "Enterprise Transformation", "Executive Advisory"],
        "enterprise_technical": ["Nexus Platform", "AI Architecture", "Technical Integration"],
        "smb_owner": ["SMB AI Packages", "Quick Start Programs", "ROI Optimization"],
        "smb_technical": ["Easy Implementation", "Technical Support", "Training Programs"],
        "startup_founder": ["Startup AI Solutions", "Growth Acceleration", "Innovation Consulting"],
        "consultant_partner": ["Partner Program", "White-label Solutions", "Referral Benefits"]
    }
    
    return service_mapping.get(user_profile.segment, ["AI Consulting", "Nexus Platform", "Custom Solutions"])


def _generate_messaging_focus(user_profile: UserProfile) -> List[str]:
    """Generate key messaging points to emphasize"""
    
    focus_mapping = {
        "enterprise_decision_maker": ["ROI and Business Impact", "Strategic Advantage", "Risk Mitigation"],
        "enterprise_technical": ["Technical Excellence", "Scalability", "Integration Capabilities"],
        "smb_owner": ["Affordability", "Quick Results", "Ease of Use"],
        "smb_technical": ["Implementation Support", "Technical Resources", "Reliability"],
        "startup_founder": ["Innovation", "Competitive Edge", "Scalable Growth"],
        "consultant_partner": ["Partnership Benefits", "Client Success", "Revenue Opportunities"]
    }
    
    return focus_mapping.get(user_profile.segment, ["AI Expertise", "Proven Results", "Customer Success"])


def _calculate_personalization_confidence(request: PersonalizationRequest, user_profile: UserProfile) -> float:
    """Calculate confidence in personalization accuracy"""
    
    confidence = 0.5  # Base confidence
    
    # Increase confidence based on available data
    if request.division:
        confidence += 0.15
    if request.industry:
        confidence += 0.1
    if request.company_size:
        confidence += 0.1
    if request.interests:
        confidence += 0.1
    if request.previous_interactions:
        confidence += len(request.previous_interactions) * 0.02
    
    # Adjust based on engagement level
    if user_profile.engagement_level == "high":
        confidence += 0.1
    elif user_profile.engagement_level == "medium":
        confidence += 0.05
    
    return min(confidence, 0.95)  # Cap at 95%
