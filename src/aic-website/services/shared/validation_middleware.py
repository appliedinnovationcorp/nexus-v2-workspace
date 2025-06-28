"""
Input Validation Middleware
Provides comprehensive input validation for all API endpoints
"""

import re
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError, validator
import bleach
import html

logger = logging.getLogger(__name__)

class ValidationConfig(BaseModel):
    """Validation configuration"""
    max_string_length: int = 1000
    max_text_length: int = 10000
    max_array_length: int = 100
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'text/csv'
    ]
    sanitize_html: bool = True
    allowed_html_tags: List[str] = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds

class SecurityValidator:
    """Security-focused input validation"""
    
    # Common attack patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
        r"(--|#|/\*|\*/)",
        r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
        r"(\bUNION\s+SELECT\b)",
        r"(\b(EXEC|EXECUTE)\s*\()",
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>.*?</iframe>",
        r"<object[^>]*>.*?</object>",
        r"<embed[^>]*>.*?</embed>",
    ]
    
    COMMAND_INJECTION_PATTERNS = [
        r"[;&|`$(){}[\]\\]",
        r"\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b",
        r"(\.\.\/|\.\.\\)",
        r"(\|\s*(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig))",
    ]
    
    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """Check for SQL injection patterns"""
        if not isinstance(value, str):
            return False
        
        value_lower = value.lower()
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def check_xss(cls, value: str) -> bool:
        """Check for XSS patterns"""
        if not isinstance(value, str):
            return False
        
        value_lower = value.lower()
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def check_command_injection(cls, value: str) -> bool:
        """Check for command injection patterns"""
        if not isinstance(value, str):
            return False
        
        for pattern in cls.COMMAND_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def sanitize_string(cls, value: str, config: ValidationConfig) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            return str(value)
        
        # HTML escape
        value = html.escape(value)
        
        # Sanitize HTML if enabled
        if config.sanitize_html:
            value = bleach.clean(
                value,
                tags=config.allowed_html_tags,
                strip=True
            )
        
        # Trim whitespace
        value = value.strip()
        
        return value

class InputValidator:
    """Comprehensive input validator"""
    
    def __init__(self, config: ValidationConfig = None):
        self.config = config or ValidationConfig()
        self.security = SecurityValidator()
    
    def validate_string(self, value: Any, field_name: str, max_length: Optional[int] = None) -> str:
        """Validate string input"""
        if value is None:
            return ""
        
        if not isinstance(value, str):
            value = str(value)
        
        # Check length
        max_len = max_length or self.config.max_string_length
        if len(value) > max_len:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} exceeds maximum length of {max_len} characters"
            )
        
        # Security checks
        if self.security.check_sql_injection(value):
            logger.warning(f"SQL injection attempt detected in {field_name}: {value[:100]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid characters detected in {field_name}"
            )
        
        if self.security.check_xss(value):
            logger.warning(f"XSS attempt detected in {field_name}: {value[:100]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content detected in {field_name}"
            )
        
        if self.security.check_command_injection(value):
            logger.warning(f"Command injection attempt detected in {field_name}: {value[:100]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid characters detected in {field_name}"
            )
        
        # Sanitize
        return self.security.sanitize_string(value, self.config)
    
    def validate_email(self, value: str, field_name: str) -> str:
        """Validate email format"""
        if not value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} is required"
            )
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid email format for {field_name}"
            )
        
        return self.validate_string(value.lower(), field_name)
    
    def validate_url(self, value: str, field_name: str) -> str:
        """Validate URL format"""
        if not value:
            return ""
        
        url_pattern = r'^https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?$'
        if not re.match(url_pattern, value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid URL format for {field_name}"
            )
        
        return self.validate_string(value, field_name)
    
    def validate_phone(self, value: str, field_name: str) -> str:
        """Validate phone number format"""
        if not value:
            return ""
        
        # Remove common formatting characters
        cleaned = re.sub(r'[^\d+]', '', value)
        
        # Basic phone validation (international format)
        phone_pattern = r'^\+?[1-9]\d{1,14}$'
        if not re.match(phone_pattern, cleaned):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid phone number format for {field_name}"
            )
        
        return cleaned
    
    def validate_integer(self, value: Any, field_name: str, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
        """Validate integer input"""
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be a valid integer"
            )
        
        if min_val is not None and int_value < min_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be at least {min_val}"
            )
        
        if max_val is not None and int_value > max_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be at most {max_val}"
            )
        
        return int_value
    
    def validate_float(self, value: Any, field_name: str, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
        """Validate float input"""
        try:
            float_value = float(value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be a valid number"
            )
        
        if min_val is not None and float_value < min_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be at least {min_val}"
            )
        
        if max_val is not None and float_value > max_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be at most {max_val}"
            )
        
        return float_value
    
    def validate_boolean(self, value: Any, field_name: str) -> bool:
        """Validate boolean input"""
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            if value.lower() in ('true', '1', 'yes', 'on'):
                return True
            elif value.lower() in ('false', '0', 'no', 'off'):
                return False
        
        if isinstance(value, int):
            return bool(value)
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a valid boolean value"
        )
    
    def validate_array(self, value: Any, field_name: str, max_length: Optional[int] = None) -> List[Any]:
        """Validate array input"""
        if not isinstance(value, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} must be an array"
            )
        
        max_len = max_length or self.config.max_array_length
        if len(value) > max_len:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} exceeds maximum length of {max_len} items"
            )
        
        return value
    
    def validate_uuid(self, value: str, field_name: str) -> str:
        """Validate UUID format"""
        if not value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} is required"
            )
        
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        if not re.match(uuid_pattern, value.lower()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid UUID format for {field_name}"
            )
        
        return value.lower()
    
    def validate_datetime(self, value: str, field_name: str) -> datetime:
        """Validate datetime format"""
        if not value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} is required"
            )
        
        # Try common datetime formats
        formats = [
            '%Y-%m-%dT%H:%M:%S.%fZ',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid datetime format for {field_name}. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)"
        )

class ValidationMiddleware:
    """FastAPI middleware for input validation"""
    
    def __init__(self, config: ValidationConfig = None):
        self.validator = InputValidator(config)
        self.config = config or ValidationConfig()
    
    async def __call__(self, request: Request, call_next):
        """Process request validation"""
        try:
            # Validate request size
            if hasattr(request, 'headers'):
                content_length = request.headers.get('content-length')
                if content_length and int(content_length) > self.config.max_file_size:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"detail": "Request entity too large"}
                    )
            
            # Validate content type for POST/PUT requests
            if request.method in ['POST', 'PUT', 'PATCH']:
                content_type = request.headers.get('content-type', '')
                if content_type and not any(ct in content_type for ct in [
                    'application/json', 'application/x-www-form-urlencoded', 
                    'multipart/form-data', 'text/plain'
                ]):
                    return JSONResponse(
                        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                        content={"detail": "Unsupported media type"}
                    )
            
            # Process request
            response = await call_next(request)
            return response
            
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        except Exception as e:
            logger.error(f"Validation middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"}
            )

# Validation decorators
def validate_input(validator_func: Callable):
    """Decorator for input validation"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Apply validation
            validated_kwargs = {}
            for key, value in kwargs.items():
                if key in ['request', 'current_user', 'db']:
                    validated_kwargs[key] = value
                else:
                    validated_kwargs[key] = validator_func(value, key)
            
            return await func(*args, **validated_kwargs)
        return wrapper
    return decorator

# Common validation schemas
class BaseValidationModel(BaseModel):
    """Base model with common validation"""
    
    @validator('*', pre=True)
    def validate_strings(cls, v, field):
        if isinstance(v, str) and field.name:
            validator = InputValidator()
            return validator.validate_string(v, field.name)
        return v

class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    page: int = 1
    limit: int = 20
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            raise ValueError('Page must be greater than 0')
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Limit must be between 1 and 100')
        return v

class SortParams(BaseModel):
    """Standard sorting parameters"""
    sort_by: Optional[str] = None
    sort_order: str = 'asc'
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v.lower() not in ['asc', 'desc']:
            raise ValueError('Sort order must be "asc" or "desc"')
        return v.lower()

# Global validator instance
input_validator = InputValidator()
