"""
Search Enhancement Router
AI-powered search and semantic retrieval endpoints
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from services.llm_service import LLMService
from services.vector_service import VectorService
from core.config import get_settings

logger = structlog.get_logger()
router = APIRouter()


class SearchRequest(BaseModel):
    """Search request model"""
    query: str = Field(..., description="Search query")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Search filters")
    limit: int = Field(default=10, description="Maximum number of results")
    offset: int = Field(default=0, description="Result offset for pagination")
    search_type: str = Field(default="hybrid", description="Search type (text, semantic, hybrid)")
    division: Optional[str] = Field(default=None, description="Filter by division")
    content_types: List[str] = Field(default=[], description="Filter by content types")
    include_embeddings: bool = Field(default=False, description="Include embeddings in response")


class SearchResult(BaseModel):
    """Individual search result"""
    id: str = Field(..., description="Result ID")
    title: str = Field(..., description="Result title")
    content: str = Field(..., description="Result content/excerpt")
    url: Optional[str] = Field(default=None, description="Result URL")
    score: float = Field(..., description="Relevance score")
    content_type: str = Field(..., description="Type of content")
    division: Optional[str] = Field(default=None, description="Content division")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    highlights: List[str] = Field(default=[], description="Highlighted text snippets")
    embedding: Optional[List[float]] = Field(default=None, description="Content embedding vector")


class SearchResponse(BaseModel):
    """Search response model"""
    results: List[SearchResult] = Field(..., description="Search results")
    total_count: int = Field(..., description="Total number of matching results")
    query_analysis: Dict[str, Any] = Field(..., description="Query analysis and insights")
    suggestions: List[str] = Field(default=[], description="Search suggestions")
    facets: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict, description="Search facets")
    processing_time: float = Field(..., description="Search processing time in seconds")
    search_type_used: str = Field(..., description="Actual search type used")


class QueryExpansionRequest(BaseModel):
    """Query expansion request"""
    query: str = Field(..., description="Original query")
    context: Optional[str] = Field(default=None, description="Search context")
    max_expansions: int = Field(default=5, description="Maximum number of expanded queries")


class QueryExpansionResponse(BaseModel):
    """Query expansion response"""
    original_query: str = Field(..., description="Original query")
    expanded_queries: List[str] = Field(..., description="Expanded query variations")
    semantic_keywords: List[str] = Field(..., description="Related semantic keywords")
    intent_analysis: Dict[str, Any] = Field(..., description="Query intent analysis")


async def get_llm_service(request: Request) -> LLMService:
    """Dependency to get LLM service"""
    return request.app.state.llm_service


async def get_vector_service(request: Request) -> VectorService:
    """Dependency to get Vector service"""
    return request.app.state.vector_service


@router.post("/enhance", response_model=SearchResponse)
async def enhance_search(
    request: SearchRequest,
    llm_service: LLMService = Depends(get_llm_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    """Enhance search with AI-powered semantic understanding"""
    
    logger.info("Search enhancement requested", 
                query=request.query,
                search_type=request.search_type,
                limit=request.limit)
    
    try:
        start_time = datetime.now()
        
        # Analyze the query
        query_analysis = await _analyze_search_query(request.query, llm_service)
        
        # Perform the search based on type
        if request.search_type == "semantic":
            results = await _semantic_search(request, query_analysis, vector_service, llm_service)
        elif request.search_type == "text":
            results = await _text_search(request, query_analysis)
        else:  # hybrid
            results = await _hybrid_search(request, query_analysis, vector_service, llm_service)
        
        # Generate search suggestions
        suggestions = await _generate_search_suggestions(request.query, query_analysis, llm_service)
        
        # Generate facets
        facets = _generate_search_facets(results)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        logger.info("Search enhancement completed", 
                   query=request.query,
                   results_count=len(results),
                   processing_time=processing_time)
        
        return SearchResponse(
            results=results,
            total_count=len(results),  # In production, this would be the total count from the search engine
            query_analysis=query_analysis,
            suggestions=suggestions,
            facets=facets,
            processing_time=processing_time,
            search_type_used=request.search_type
        )
        
    except Exception as e:
        logger.error("Search enhancement failed", error=str(e), query=request.query)
        raise HTTPException(status_code=500, detail=f"Search enhancement failed: {str(e)}")


@router.post("/expand", response_model=QueryExpansionResponse)
async def expand_query(
    request: QueryExpansionRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Expand search query with AI-generated variations"""
    
    logger.info("Query expansion requested", query=request.query)
    
    try:
        # Analyze query intent
        intent_analysis = await _analyze_query_intent(request.query, llm_service)
        
        # Generate expanded queries
        expanded_queries = await _generate_expanded_queries(request, intent_analysis, llm_service)
        
        # Extract semantic keywords
        semantic_keywords = await _extract_semantic_keywords(request.query, llm_service)
        
        logger.info("Query expansion completed", 
                   original_query=request.query,
                   expansions_count=len(expanded_queries))
        
        return QueryExpansionResponse(
            original_query=request.query,
            expanded_queries=expanded_queries,
            semantic_keywords=semantic_keywords,
            intent_analysis=intent_analysis
        )
        
    except Exception as e:
        logger.error("Query expansion failed", error=str(e), query=request.query)
        raise HTTPException(status_code=500, detail=f"Query expansion failed: {str(e)}")


@router.get("/suggestions/{query}")
async def get_search_suggestions(
    query: str,
    limit: int = 5,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Get AI-powered search suggestions"""
    
    try:
        suggestions = await _generate_search_suggestions(query, {}, llm_service, limit)
        
        return {
            "query": query,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
        
    except Exception as e:
        logger.error("Search suggestions failed", error=str(e), query=query)
        raise HTTPException(status_code=500, detail=f"Search suggestions failed: {str(e)}")


async def _analyze_search_query(query: str, llm_service: LLMService) -> Dict[str, Any]:
    """Analyze search query for intent and context"""
    
    system_prompt = """You are an expert search analyst. Analyze search queries to understand user intent, 
    extract key concepts, and identify the type of information the user is seeking. Focus on AI, technology, 
    and business consulting contexts."""
    
    user_prompt = f"""Analyze this search query: "{query}"
    
    Provide analysis including:
    1. User intent (informational, navigational, transactional)
    2. Key concepts and entities
    3. Likely content types they're seeking
    4. Business context (SMB vs Enterprise)
    5. Technical level (beginner, intermediate, advanced)
    """
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            provider="openai"
        )
        
        # Parse the analysis
        analysis = _parse_query_analysis(result["content"])
        analysis["ai_analysis"] = result["content"]
        
        return analysis
        
    except Exception as e:
        logger.error("Query analysis failed", error=str(e))
        return _fallback_query_analysis(query)


def _parse_query_analysis(ai_response: str) -> Dict[str, Any]:
    """Parse AI query analysis response"""
    
    # Simple parsing - in production, use more sophisticated NLP
    analysis = {
        "intent": "informational",
        "key_concepts": [],
        "content_types": ["general"],
        "business_context": "general",
        "technical_level": "intermediate"
    }
    
    response_lower = ai_response.lower()
    
    # Determine intent
    if any(word in response_lower for word in ["buy", "purchase", "price", "cost"]):
        analysis["intent"] = "transactional"
    elif any(word in response_lower for word in ["how to", "guide", "tutorial"]):
        analysis["intent"] = "informational"
    elif any(word in response_lower for word in ["login", "dashboard", "account"]):
        analysis["intent"] = "navigational"
    
    # Determine business context
    if any(word in response_lower for word in ["enterprise", "large", "corporation"]):
        analysis["business_context"] = "enterprise"
    elif any(word in response_lower for word in ["small", "smb", "startup"]):
        analysis["business_context"] = "smb"
    
    # Determine technical level
    if any(word in response_lower for word in ["api", "integration", "technical", "developer"]):
        analysis["technical_level"] = "advanced"
    elif any(word in response_lower for word in ["basic", "introduction", "getting started"]):
        analysis["technical_level"] = "beginner"
    
    return analysis


def _fallback_query_analysis(query: str) -> Dict[str, Any]:
    """Fallback query analysis using simple rules"""
    
    query_lower = query.lower()
    
    analysis = {
        "intent": "informational",
        "key_concepts": query.split(),
        "content_types": ["general"],
        "business_context": "general",
        "technical_level": "intermediate",
        "ai_analysis": "Fallback analysis used"
    }
    
    # Simple intent detection
    if any(word in query_lower for word in ["price", "cost", "buy", "purchase"]):
        analysis["intent"] = "transactional"
    elif any(word in query_lower for word in ["login", "dashboard", "account"]):
        analysis["intent"] = "navigational"
    
    return analysis


async def _semantic_search(
    request: SearchRequest,
    query_analysis: Dict[str, Any],
    vector_service: VectorService,
    llm_service: LLMService
) -> List[SearchResult]:
    """Perform semantic search using vector embeddings"""
    
    try:
        # Generate query embedding
        embedding_result = await llm_service.generate_embeddings([request.query])
        query_embedding = embedding_result["embeddings"][0]
        
        # Perform vector search
        vector_results = await vector_service.similarity_search(
            query_embedding,
            limit=request.limit,
            filters=request.filters
        )
        
        # Convert to SearchResult format
        results = []
        for result in vector_results:
            search_result = SearchResult(
                id=result["id"],
                title=result["title"],
                content=result["content"][:500] + "..." if len(result["content"]) > 500 else result["content"],
                url=result.get("url"),
                score=result["score"],
                content_type=result.get("content_type", "unknown"),
                division=result.get("division"),
                metadata=result.get("metadata", {}),
                highlights=[],
                embedding=result["embedding"] if request.include_embeddings else None
            )
            results.append(search_result)
        
        return results
        
    except Exception as e:
        logger.error("Semantic search failed", error=str(e))
        return []


async def _text_search(request: SearchRequest, query_analysis: Dict[str, Any]) -> List[SearchResult]:
    """Perform traditional text search"""
    
    # This would integrate with Meilisearch or Elasticsearch
    # For now, return mock results
    
    mock_results = [
        SearchResult(
            id="text-1",
            title="AI Consulting Services for Businesses",
            content="Comprehensive AI consulting services to help businesses transform with artificial intelligence...",
            url="/services/ai-consulting",
            score=0.95,
            content_type="service",
            division="general",
            metadata={"category": "consulting"},
            highlights=["AI consulting", "businesses", "artificial intelligence"]
        ),
        SearchResult(
            id="text-2",
            title="Nexus AI Platform Overview",
            content="Nexus is our flagship AI Platform-as-a-Service offering enterprise-grade AI infrastructure...",
            url="/products/nexus",
            score=0.88,
            content_type="product",
            division="general",
            metadata={"category": "platform"},
            highlights=["Nexus", "AI Platform", "enterprise-grade"]
        )
    ]
    
    # Filter results based on query relevance
    filtered_results = []
    query_words = request.query.lower().split()
    
    for result in mock_results:
        relevance_score = 0
        content_lower = (result.title + " " + result.content).lower()
        
        for word in query_words:
            if word in content_lower:
                relevance_score += 1
        
        if relevance_score > 0:
            result.score = relevance_score / len(query_words)
            filtered_results.append(result)
    
    # Sort by score and apply limit
    filtered_results.sort(key=lambda x: x.score, reverse=True)
    return filtered_results[:request.limit]


async def _hybrid_search(
    request: SearchRequest,
    query_analysis: Dict[str, Any],
    vector_service: VectorService,
    llm_service: LLMService
) -> List[SearchResult]:
    """Perform hybrid search combining text and semantic search"""
    
    # Get results from both search types
    text_results = await _text_search(request, query_analysis)
    semantic_results = await _semantic_search(request, query_analysis, vector_service, llm_service)
    
    # Combine and deduplicate results
    combined_results = {}
    
    # Add text results with weight
    for result in text_results:
        result.score *= 0.6  # Weight text search at 60%
        combined_results[result.id] = result
    
    # Add semantic results with weight
    for result in semantic_results:
        result.score *= 0.4  # Weight semantic search at 40%
        if result.id in combined_results:
            # Combine scores for duplicate results
            combined_results[result.id].score += result.score
        else:
            combined_results[result.id] = result
    
    # Sort by combined score and return
    final_results = list(combined_results.values())
    final_results.sort(key=lambda x: x.score, reverse=True)
    
    return final_results[:request.limit]


async def _generate_search_suggestions(
    query: str,
    query_analysis: Dict[str, Any],
    llm_service: LLMService,
    limit: int = 5
) -> List[str]:
    """Generate AI-powered search suggestions"""
    
    system_prompt = """You are a search suggestion expert for AIC's AI consulting website. 
    Generate relevant search suggestions that would help users find what they're looking for."""
    
    user_prompt = f"""Generate {limit} search suggestions related to: "{query}"
    
    Focus on AI consulting, business transformation, and technology services.
    Make suggestions specific and actionable."""
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.6,
            provider="openai"
        )
        
        # Parse suggestions from response
        suggestions = _parse_suggestions(result["content"])
        return suggestions[:limit]
        
    except Exception as e:
        logger.error("Search suggestions generation failed", error=str(e))
        return _fallback_suggestions(query)


def _parse_suggestions(ai_response: str) -> List[str]:
    """Parse suggestions from AI response"""
    
    lines = ai_response.split('\n')
    suggestions = []
    
    for line in lines:
        line = line.strip()
        if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
            clean_line = line.lstrip('-•0123456789. ').strip()
            if clean_line and len(clean_line) > 5:
                suggestions.append(clean_line)
    
    return suggestions


def _fallback_suggestions(query: str) -> List[str]:
    """Fallback search suggestions"""
    
    base_suggestions = [
        "AI consulting services",
        "Business AI transformation",
        "Nexus AI platform",
        "Enterprise AI solutions",
        "SMB AI implementation"
    ]
    
    # Add query-specific suggestions
    query_lower = query.lower()
    if "price" in query_lower or "cost" in query_lower:
        base_suggestions.insert(0, f"{query} pricing")
    if "how" in query_lower:
        base_suggestions.insert(0, f"{query} guide")
    
    return base_suggestions[:5]


async def _analyze_query_intent(query: str, llm_service: LLMService) -> Dict[str, Any]:
    """Analyze query intent in detail"""
    
    system_prompt = """Analyze search query intent for an AI consulting website. 
    Determine what the user is trying to accomplish and what type of content would best serve them."""
    
    user_prompt = f"""Analyze the intent behind this search query: "{query}"
    
    Determine:
    1. Primary intent (learn, buy, navigate, compare)
    2. Information need level (basic, detailed, expert)
    3. Decision stage (awareness, consideration, decision)
    4. Content preference (article, demo, pricing, contact)
    """
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            provider="openai"
        )
        
        return {
            "analysis": result["content"],
            "confidence": 0.8,
            "primary_intent": "informational",  # Would be parsed from AI response
            "decision_stage": "consideration"
        }
        
    except Exception as e:
        logger.error("Query intent analysis failed", error=str(e))
        return {
            "analysis": "Intent analysis unavailable",
            "confidence": 0.3,
            "primary_intent": "informational",
            "decision_stage": "awareness"
        }


async def _generate_expanded_queries(
    request: QueryExpansionRequest,
    intent_analysis: Dict[str, Any],
    llm_service: LLMService
) -> List[str]:
    """Generate expanded query variations"""
    
    system_prompt = """You are a search query expansion expert. Generate alternative phrasings 
    and related queries that capture the same user intent but use different terminology."""
    
    user_prompt = f"""Generate {request.max_expansions} alternative search queries for: "{request.query}"
    
    Context: {request.context or 'AI consulting and business transformation'}
    
    Create variations that:
    1. Use synonyms and related terms
    2. Add relevant context
    3. Include both technical and business language
    4. Cover different aspects of the topic
    """
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            provider="openai"
        )
        
        expanded_queries = _parse_suggestions(result["content"])
        return expanded_queries[:request.max_expansions]
        
    except Exception as e:
        logger.error("Query expansion generation failed", error=str(e))
        return [request.query]  # Return original query as fallback


async def _extract_semantic_keywords(query: str, llm_service: LLMService) -> List[str]:
    """Extract semantic keywords related to the query"""
    
    system_prompt = """Extract semantic keywords and related concepts for search queries 
    in the context of AI consulting and business technology."""
    
    user_prompt = f"""Extract 5-10 semantic keywords related to: "{query}"
    
    Include:
    1. Synonyms and related terms
    2. Industry-specific terminology
    3. Technical concepts
    4. Business concepts
    """
    
    try:
        result = await llm_service.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.5,
            provider="openai"
        )
        
        keywords = _parse_suggestions(result["content"])
        return keywords[:10]
        
    except Exception as e:
        logger.error("Semantic keyword extraction failed", error=str(e))
        return query.split()  # Return query words as fallback


def _generate_search_facets(results: List[SearchResult]) -> Dict[str, List[Dict[str, Any]]]:
    """Generate search facets from results"""
    
    facets = {
        "content_type": {},
        "division": {},
        "category": {}
    }
    
    # Count facet values
    for result in results:
        # Content type facet
        content_type = result.content_type
        if content_type not in facets["content_type"]:
            facets["content_type"][content_type] = 0
        facets["content_type"][content_type] += 1
        
        # Division facet
        if result.division:
            if result.division not in facets["division"]:
                facets["division"][result.division] = 0
            facets["division"][result.division] += 1
        
        # Category facet from metadata
        category = result.metadata.get("category")
        if category:
            if category not in facets["category"]:
                facets["category"][category] = 0
            facets["category"][category] += 1
    
    # Convert to list format
    formatted_facets = {}
    for facet_name, facet_counts in facets.items():
        formatted_facets[facet_name] = [
            {"value": value, "count": count}
            for value, count in facet_counts.items()
        ]
    
    return formatted_facets
