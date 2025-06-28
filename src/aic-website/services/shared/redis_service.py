"""
Centralized Redis Service
Provides consistent Redis usage patterns across all microservices
"""

import os
import json
import logging
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
import redis.asyncio as redis
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class CacheConfig(BaseModel):
    """Cache configuration model"""
    default_ttl: int = 300  # 5 minutes
    long_ttl: int = 3600    # 1 hour
    short_ttl: int = 60     # 1 minute
    max_retries: int = 3
    retry_delay: float = 0.1

class RedisService:
    """Centralized Redis service with consistent patterns"""
    
    def __init__(self, redis_url: str = None, config: CacheConfig = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://redis:6379")
        self.config = config or CacheConfig()
        self.client: Optional[redis.Redis] = None
        self._connected = False
    
    async def connect(self) -> None:
        """Initialize Redis connection with retry logic"""
        for attempt in range(self.config.max_retries):
            try:
                self.client = redis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
                
                await self.client.ping()
                self._connected = True
                logger.info("Redis connected successfully")
                return
                
            except Exception as e:
                logger.warning(f"Redis connection attempt {attempt + 1} failed: {e}")
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(self.config.retry_delay * (2 ** attempt))
                else:
                    logger.error("Failed to connect to Redis after all retries")
                    raise
    
    async def disconnect(self) -> None:
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            self._connected = False
            logger.info("Redis disconnected")
    
    async def health_check(self) -> bool:
        """Check Redis connection health"""
        try:
            if not self.client:
                return False
            await self.client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    # Cache Operations
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache with error handling"""
        try:
            if not self._connected:
                return default
            
            value = await self.client.get(key)
            if value is None:
                return default
            
            # Try to parse as JSON, fallback to string
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
                
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return default
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with TTL"""
        try:
            if not self._connected:
                return False
            
            # Serialize complex objects to JSON
            if isinstance(value, (dict, list, BaseModel)):
                if isinstance(value, BaseModel):
                    value = value.dict()
                value = json.dumps(value, default=str)
            
            ttl = ttl or self.config.default_ttl
            await self.client.setex(key, ttl, value)
            return True
            
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    async def delete(self, *keys: str) -> int:
        """Delete keys from cache"""
        try:
            if not self._connected or not keys:
                return 0
            
            return await self.client.delete(*keys)
            
        except Exception as e:
            logger.error(f"Redis DELETE error for keys {keys}: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if not self._connected:
                return False
            
            return bool(await self.client.exists(key))
            
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False
    
    # Hash Operations
    async def hget(self, name: str, key: str, default: Any = None) -> Any:
        """Get hash field value"""
        try:
            if not self._connected:
                return default
            
            value = await self.client.hget(name, key)
            if value is None:
                return default
            
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
                
        except Exception as e:
            logger.error(f"Redis HGET error for {name}:{key}: {e}")
            return default
    
    async def hset(self, name: str, key: str, value: Any) -> bool:
        """Set hash field value"""
        try:
            if not self._connected:
                return False
            
            if isinstance(value, (dict, list, BaseModel)):
                if isinstance(value, BaseModel):
                    value = value.dict()
                value = json.dumps(value, default=str)
            
            await self.client.hset(name, key, value)
            return True
            
        except Exception as e:
            logger.error(f"Redis HSET error for {name}:{key}: {e}")
            return False
    
    async def hgetall(self, name: str) -> Dict[str, Any]:
        """Get all hash fields"""
        try:
            if not self._connected:
                return {}
            
            data = await self.client.hgetall(name)
            result = {}
            
            for key, value in data.items():
                try:
                    result[key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    result[key] = value
            
            return result
            
        except Exception as e:
            logger.error(f"Redis HGETALL error for {name}: {e}")
            return {}
    
    # List Operations
    async def lpush(self, name: str, *values: Any) -> int:
        """Push values to list head"""
        try:
            if not self._connected:
                return 0
            
            serialized_values = []
            for value in values:
                if isinstance(value, (dict, list, BaseModel)):
                    if isinstance(value, BaseModel):
                        value = value.dict()
                    value = json.dumps(value, default=str)
                serialized_values.append(value)
            
            return await self.client.lpush(name, *serialized_values)
            
        except Exception as e:
            logger.error(f"Redis LPUSH error for {name}: {e}")
            return 0
    
    async def lrange(self, name: str, start: int = 0, end: int = -1) -> List[Any]:
        """Get list range"""
        try:
            if not self._connected:
                return []
            
            values = await self.client.lrange(name, start, end)
            result = []
            
            for value in values:
                try:
                    result.append(json.loads(value))
                except (json.JSONDecodeError, TypeError):
                    result.append(value)
            
            return result
            
        except Exception as e:
            logger.error(f"Redis LRANGE error for {name}: {e}")
            return []
    
    # Set Operations
    async def sadd(self, name: str, *values: Any) -> int:
        """Add values to set"""
        try:
            if not self._connected:
                return 0
            
            serialized_values = []
            for value in values:
                if isinstance(value, (dict, list, BaseModel)):
                    if isinstance(value, BaseModel):
                        value = value.dict()
                    value = json.dumps(value, default=str)
                serialized_values.append(value)
            
            return await self.client.sadd(name, *serialized_values)
            
        except Exception as e:
            logger.error(f"Redis SADD error for {name}: {e}")
            return 0
    
    async def smembers(self, name: str) -> set:
        """Get all set members"""
        try:
            if not self._connected:
                return set()
            
            values = await self.client.smembers(name)
            result = set()
            
            for value in values:
                try:
                    result.add(json.loads(value))
                except (json.JSONDecodeError, TypeError):
                    result.add(value)
            
            return result
            
        except Exception as e:
            logger.error(f"Redis SMEMBERS error for {name}: {e}")
            return set()
    
    # Utility Methods
    async def expire(self, key: str, ttl: int) -> bool:
        """Set key expiration"""
        try:
            if not self._connected:
                return False
            
            return await self.client.expire(key, ttl)
            
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False
    
    async def ttl(self, key: str) -> int:
        """Get key TTL"""
        try:
            if not self._connected:
                return -1
            
            return await self.client.ttl(key)
            
        except Exception as e:
            logger.error(f"Redis TTL error for key {key}: {e}")
            return -1
    
    # Cache Patterns
    async def cache_aside(self, key: str, fetch_func, ttl: Optional[int] = None):
        """Cache-aside pattern implementation"""
        # Try to get from cache first
        cached_value = await self.get(key)
        if cached_value is not None:
            return cached_value
        
        # Fetch from source
        try:
            value = await fetch_func() if asyncio.iscoroutinefunction(fetch_func) else fetch_func()
            if value is not None:
                await self.set(key, value, ttl)
            return value
        except Exception as e:
            logger.error(f"Cache-aside fetch error for key {key}: {e}")
            raise
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate keys matching pattern"""
        try:
            if not self._connected:
                return 0
            
            keys = await self.client.keys(pattern)
            if keys:
                return await self.client.delete(*keys)
            return 0
            
        except Exception as e:
            logger.error(f"Redis pattern invalidation error for {pattern}: {e}")
            return 0

# Global Redis service instance
redis_service = RedisService()

# Convenience functions for backward compatibility
async def get_redis_client() -> RedisService:
    """Get Redis service instance"""
    if not redis_service._connected:
        await redis_service.connect()
    return redis_service

# Cache decorators
def cache_result(key_prefix: str, ttl: Optional[int] = None):
    """Decorator to cache function results"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            import hashlib
            key_data = f"{key_prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()
            
            # Try cache first
            cached = await redis_service.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            # Cache result
            if result is not None:
                await redis_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

import asyncio
