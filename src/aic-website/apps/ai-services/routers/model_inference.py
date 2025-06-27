"""
Model Inference Router
General ML model serving and inference endpoints
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


class InferenceRequest(BaseModel):
    """General inference request model"""
    model_name: str = Field(..., description="Model name to use for inference")
    input_data: Dict[str, Any] = Field(..., description="Input data for the model")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Model parameters")


class InferenceResponse(BaseModel):
    """General inference response model"""
    predictions: Dict[str, Any] = Field(..., description="Model predictions")
    confidence: Optional[float] = Field(default=None, description="Prediction confidence")
    metadata: Dict[str, Any] = Field(..., description="Response metadata")
    processing_time: float = Field(..., description="Processing time in seconds")


async def get_llm_service(request: Request) -> LLMService:
    """Dependency to get LLM service"""
    return request.app.state.llm_service


@router.get("/models")
async def list_available_models():
    """List all available models"""
    
    models = {
        "llm_models": [
            "gpt-4-turbo-preview",
            "gpt-3.5-turbo",
            "claude-3-sonnet-20240229",
            "llama2",
            "mistral-large-latest"
        ],
        "embedding_models": [
            "text-embedding-3-small",
            "text-embedding-3-large",
            "text-embedding-ada-002"
        ],
        "custom_models": [
            "aic-lead-scorer",
            "aic-content-classifier"
        ]
    }
    
    return {
        "models": models,
        "total_count": sum(len(model_list) for model_list in models.values())
    }


@router.post("/predict", response_model=InferenceResponse)
async def run_inference(
    request: InferenceRequest,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Run inference on a specified model"""
    
    logger.info("Inference requested", model=request.model_name)
    
    try:
        start_time = datetime.now()
        
        # Route to appropriate model handler
        if request.model_name.startswith("gpt-") or request.model_name.startswith("claude-"):
            result = await _run_llm_inference(request, llm_service)
        elif request.model_name.startswith("text-embedding-"):
            result = await _run_embedding_inference(request, llm_service)
        elif request.model_name.startswith("aic-"):
            result = await _run_custom_model_inference(request)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model: {request.model_name}")
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        return InferenceResponse(
            predictions=result,
            metadata={
                "model": request.model_name,
                "timestamp": end_time.isoformat()
            },
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error("Inference failed", error=str(e), model=request.model_name)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


async def _run_llm_inference(request: InferenceRequest, llm_service: LLMService) -> Dict[str, Any]:
    """Run LLM inference"""
    
    prompt = request.input_data.get("prompt", "")
    system_prompt = request.input_data.get("system_prompt")
    
    if not prompt:
        raise ValueError("Prompt is required for LLM inference")
    
    result = await llm_service.generate_text(
        prompt=prompt,
        system_prompt=system_prompt,
        model=request.model_name,
        **request.parameters
    )
    
    return {
        "text": result["content"],
        "tokens": result["metadata"]["tokens"],
        "model": result["metadata"]["model"]
    }


async def _run_embedding_inference(request: InferenceRequest, llm_service: LLMService) -> Dict[str, Any]:
    """Run embedding inference"""
    
    texts = request.input_data.get("texts", [])
    if not texts:
        raise ValueError("Texts are required for embedding inference")
    
    result = await llm_service.generate_embeddings(texts, model=request.model_name)
    
    return {
        "embeddings": result["embeddings"],
        "dimensions": result["dimensions"],
        "model": result["model"]
    }


async def _run_custom_model_inference(request: InferenceRequest) -> Dict[str, Any]:
    """Run custom model inference"""
    
    # Placeholder for custom model implementations
    if request.model_name == "aic-lead-scorer":
        # Mock lead scoring model
        email = request.input_data.get("email", "")
        message = request.input_data.get("message", "")
        
        # Simple scoring logic (in production, this would be a trained model)
        score = 50.0  # Base score
        if "@" in email and "." in email:
            score += 20
        if len(message) > 100:
            score += 15
        if any(word in message.lower() for word in ["urgent", "budget", "timeline"]):
            score += 15
        
        return {
            "score": min(score, 100.0),
            "category": "warm" if score >= 60 else "cold",
            "confidence": 0.8
        }
    
    elif request.model_name == "aic-content-classifier":
        # Mock content classification model
        content = request.input_data.get("content", "")
        
        # Simple classification logic
        if any(word in content.lower() for word in ["enterprise", "large", "corporation"]):
            category = "enterprise"
        elif any(word in content.lower() for word in ["small", "startup", "smb"]):
            category = "smb"
        else:
            category = "general"
        
        return {
            "category": category,
            "confidence": 0.75,
            "keywords": content.lower().split()[:10]
        }
    
    else:
        raise ValueError(f"Custom model {request.model_name} not implemented")


@router.get("/health")
async def model_health_check():
    """Check health of model inference services"""
    
    return {
        "status": "healthy",
        "models_available": True,
        "inference_ready": True,
        "timestamp": datetime.now().isoformat()
    }
