"""
LLM Service - Large Language Model Integration
Handles all LLM operations including OpenAI, Anthropic, and Ollama
"""

import asyncio
import json
from typing import Dict, List, Optional, Any, AsyncGenerator
from datetime import datetime
import structlog

import openai
from anthropic import AsyncAnthropic
import httpx
from cachetools import TTLCache

from core.config import Settings

logger = structlog.get_logger()


class LLMService:
    """Large Language Model service with multiple provider support"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.cache = TTLCache(maxsize=1000, ttl=settings.cache_ttl)
        
        # Initialize clients
        self.openai_client = None
        self.anthropic_client = None
        self.ollama_client = httpx.AsyncClient(timeout=30.0)
        
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize AI service clients"""
        try:
            if self.settings.openai_api_key:
                self.openai_client = openai.AsyncOpenAI(
                    api_key=self.settings.openai_api_key,
                    organization=self.settings.openai_org_id
                )
                logger.info("OpenAI client initialized")
            
            if self.settings.anthropic_api_key:
                self.anthropic_client = AsyncAnthropic(
                    api_key=self.settings.anthropic_api_key
                )
                logger.info("Anthropic client initialized")
                
            logger.info("Ollama client initialized", host=self.settings.ollama_host)
            
        except Exception as e:
            logger.error("Failed to initialize LLM clients", error=str(e))
    
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        provider: str = "openai"
    ) -> Dict[str, Any]:
        """Generate text using specified LLM provider"""
        
        # Create cache key
        cache_key = f"{provider}:{model}:{hash(prompt + (system_prompt or ''))}"
        
        # Check cache
        if cache_key in self.cache:
            logger.info("Returning cached response", cache_key=cache_key)
            return self.cache[cache_key]
        
        # Set defaults
        model = model or self.settings.default_llm_model
        temperature = temperature or self.settings.temperature
        max_tokens = max_tokens or self.settings.max_tokens
        
        try:
            if provider == "openai" and self.openai_client:
                result = await self._generate_openai(prompt, system_prompt, model, temperature, max_tokens)
            elif provider == "anthropic" and self.anthropic_client:
                result = await self._generate_anthropic(prompt, system_prompt, model, temperature, max_tokens)
            elif provider == "ollama":
                result = await self._generate_ollama(prompt, system_prompt, model, temperature, max_tokens)
            else:
                # Fallback to available provider
                result = await self._generate_fallback(prompt, system_prompt, model, temperature, max_tokens)
            
            # Cache result
            self.cache[cache_key] = result
            
            return result
            
        except Exception as e:
            logger.error("Text generation failed", provider=provider, error=str(e))
            raise
    
    async def _generate_openai(
        self, prompt: str, system_prompt: Optional[str], model: str, temperature: float, max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using OpenAI"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        start_time = datetime.now()
        
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        end_time = datetime.now()
        latency = (end_time - start_time).total_seconds()
        
        return {
            "content": response.choices[0].message.content,
            "provider": "openai",
            "model": model,
            "tokens": response.usage.total_tokens if response.usage else 0,
            "latency": latency,
            "timestamp": end_time.isoformat()
        }
    
    async def _generate_anthropic(
        self, prompt: str, system_prompt: Optional[str], model: str, temperature: float, max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using Anthropic Claude"""
        start_time = datetime.now()
        
        # Anthropic uses different model names
        anthropic_model = "claude-3-sonnet-20240229" if "claude" not in model else model
        
        response = await self.anthropic_client.messages.create(
            model=anthropic_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}]
        )
        
        end_time = datetime.now()
        latency = (end_time - start_time).total_seconds()
        
        return {
            "content": response.content[0].text,
            "provider": "anthropic",
            "model": anthropic_model,
            "tokens": response.usage.input_tokens + response.usage.output_tokens,
            "latency": latency,
            "timestamp": end_time.isoformat()
        }
    
    async def _generate_ollama(
        self, prompt: str, system_prompt: Optional[str], model: str, temperature: float, max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using Ollama (local LLM)"""
        start_time = datetime.now()
        
        # Ollama uses different model names
        ollama_model = "llama2" if "gpt" in model else model
        
        payload = {
            "model": ollama_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        response = await self.ollama_client.post(
            f"{self.settings.ollama_host}/api/generate",
            json=payload
        )
        
        response.raise_for_status()
        result = response.json()
        
        end_time = datetime.now()
        latency = (end_time - start_time).total_seconds()
        
        return {
            "content": result.get("response", ""),
            "provider": "ollama",
            "model": ollama_model,
            "tokens": result.get("eval_count", 0),
            "latency": latency,
            "timestamp": end_time.isoformat()
        }
    
    async def _generate_fallback(
        self, prompt: str, system_prompt: Optional[str], model: str, temperature: float, max_tokens: int
    ) -> Dict[str, Any]:
        """Fallback generation using available provider"""
        if self.openai_client:
            return await self._generate_openai(prompt, system_prompt, model, temperature, max_tokens)
        elif self.anthropic_client:
            return await self._generate_anthropic(prompt, system_prompt, model, temperature, max_tokens)
        else:
            return await self._generate_ollama(prompt, system_prompt, model, temperature, max_tokens)
    
    async def generate_embeddings(
        self, texts: List[str], model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate embeddings for text"""
        model = model or self.settings.default_embedding_model
        
        try:
            if self.openai_client:
                response = await self.openai_client.embeddings.create(
                    model=model,
                    input=texts
                )
                
                return {
                    "embeddings": [data.embedding for data in response.data],
                    "model": model,
                    "provider": "openai",
                    "dimensions": len(response.data[0].embedding) if response.data else 0
                }
            else:
                # Fallback to sentence transformers or other embedding service
                raise NotImplementedError("No embedding provider available")
                
        except Exception as e:
            logger.error("Embedding generation failed", error=str(e))
            raise
    
    async def stream_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        provider: str = "openai"
    ) -> AsyncGenerator[str, None]:
        """Stream text generation for real-time responses"""
        
        model = model or self.settings.default_llm_model
        temperature = temperature or self.settings.temperature
        
        try:
            if provider == "openai" and self.openai_client:
                async for chunk in self._stream_openai(prompt, system_prompt, model, temperature):
                    yield chunk
            elif provider == "ollama":
                async for chunk in self._stream_ollama(prompt, system_prompt, model, temperature):
                    yield chunk
            else:
                # Fallback to non-streaming
                result = await self.generate_text(prompt, system_prompt, model, temperature, provider=provider)
                yield result["content"]
                
        except Exception as e:
            logger.error("Streaming generation failed", provider=provider, error=str(e))
            raise
    
    async def _stream_openai(
        self, prompt: str, system_prompt: Optional[str], model: str, temperature: float
    ) -> AsyncGenerator[str, None]:
        """Stream OpenAI responses"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        stream = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    async def _stream_ollama(
        self, prompt: str, system_prompt: Optional[str], model: str, temperature: float
    ) -> AsyncGenerator[str, None]:
        """Stream Ollama responses"""
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": True,
            "options": {"temperature": temperature}
        }
        
        async with self.ollama_client.stream(
            "POST", f"{self.settings.ollama_host}/api/generate", json=payload
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if "response" in data:
                            yield data["response"]
                    except json.JSONDecodeError:
                        continue
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of LLM services"""
        health_status = {
            "status": "healthy",
            "providers": {}
        }
        
        # Check OpenAI
        if self.openai_client:
            try:
                await self.openai_client.models.list()
                health_status["providers"]["openai"] = "healthy"
            except Exception as e:
                health_status["providers"]["openai"] = f"unhealthy: {str(e)}"
        
        # Check Anthropic
        if self.anthropic_client:
            try:
                # Simple test - Anthropic doesn't have a direct health endpoint
                health_status["providers"]["anthropic"] = "healthy"
            except Exception as e:
                health_status["providers"]["anthropic"] = f"unhealthy: {str(e)}"
        
        # Check Ollama
        try:
            response = await self.ollama_client.get(f"{self.settings.ollama_host}/api/tags")
            if response.status_code == 200:
                health_status["providers"]["ollama"] = "healthy"
            else:
                health_status["providers"]["ollama"] = f"unhealthy: HTTP {response.status_code}"
        except Exception as e:
            health_status["providers"]["ollama"] = f"unhealthy: {str(e)}"
        
        # Overall status
        if any("unhealthy" in status for status in health_status["providers"].values()):
            health_status["status"] = "degraded"
        
        return health_status
    
    async def close(self):
        """Close all clients"""
        if self.ollama_client:
            await self.ollama_client.aclose()
        
        logger.info("LLM service clients closed")
