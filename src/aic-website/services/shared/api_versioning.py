"""
API Versioning Strategy
Provides comprehensive API versioning support for all microservices
"""

import re
import logging
from typing import Dict, List, Optional, Callable, Any
from enum import Enum
from datetime import datetime, date
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.routing import APIRoute
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class VersioningStrategy(str, Enum):
    """API versioning strategies"""
    HEADER = "header"
    URL_PATH = "url_path"
    QUERY_PARAM = "query_param"
    ACCEPT_HEADER = "accept_header"

class VersionStatus(str, Enum):
    """Version lifecycle status"""
    ALPHA = "alpha"
    BETA = "beta"
    STABLE = "stable"
    DEPRECATED = "deprecated"
    SUNSET = "sunset"

class APIVersion(BaseModel):
    """API version metadata"""
    version: str
    status: VersionStatus
    release_date: date
    deprecation_date: Optional[date] = None
    sunset_date: Optional[date] = None
    description: str
    breaking_changes: List[str] = []
    migration_guide: Optional[str] = None

class VersionConfig(BaseModel):
    """Versioning configuration"""
    default_version: str = "v1"
    latest_version: str = "v1"
    supported_versions: List[str] = ["v1"]
    strategy: VersioningStrategy = VersioningStrategy.HEADER
    header_name: str = "API-Version"
    query_param_name: str = "version"
    url_prefix: str = "/api"
    strict_versioning: bool = True
    version_metadata: Dict[str, APIVersion] = {}

class VersionManager:
    """Manages API versioning across services"""
    
    def __init__(self, config: VersionConfig = None):
        self.config = config or VersionConfig()
        self._version_routes: Dict[str, Dict[str, APIRoute]] = {}
        self._middleware_handlers: Dict[str, List[Callable]] = {}
    
    def get_version_from_request(self, request: Request) -> str:
        """Extract version from request based on strategy"""
        version = None
        
        if self.config.strategy == VersioningStrategy.HEADER:
            version = request.headers.get(self.config.header_name)
        
        elif self.config.strategy == VersioningStrategy.URL_PATH:
            # Extract version from URL path like /api/v1/users
            path = request.url.path
            match = re.search(r'/v(\d+(?:\.\d+)?)', path)
            if match:
                version = f"v{match.group(1)}"
        
        elif self.config.strategy == VersioningStrategy.QUERY_PARAM:
            version = request.query_params.get(self.config.query_param_name)
        
        elif self.config.strategy == VersioningStrategy.ACCEPT_HEADER:
            accept_header = request.headers.get('accept', '')
            # Parse Accept header like: application/vnd.api+json;version=1
            match = re.search(r'version=(\d+(?:\.\d+)?)', accept_header)
            if match:
                version = f"v{match.group(1)}"
        
        # Use default version if none specified
        if not version:
            if self.config.strict_versioning:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"API version required. Specify version using {self.config.strategy.value}"
                )
            version = self.config.default_version
        
        # Validate version
        if version not in self.config.supported_versions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported API version: {version}. Supported versions: {', '.join(self.config.supported_versions)}"
            )
        
        return version
    
    def is_version_deprecated(self, version: str) -> bool:
        """Check if version is deprecated"""
        if version not in self.config.version_metadata:
            return False
        
        version_info = self.config.version_metadata[version]
        return version_info.status in [VersionStatus.DEPRECATED, VersionStatus.SUNSET]
    
    def get_version_info(self, version: str) -> Optional[APIVersion]:
        """Get version metadata"""
        return self.config.version_metadata.get(version)
    
    def add_version_metadata(self, version: str, metadata: APIVersion):
        """Add version metadata"""
        self.config.version_metadata[version] = metadata
        if version not in self.config.supported_versions:
            self.config.supported_versions.append(version)
    
    def register_version_middleware(self, version: str, middleware: Callable):
        """Register version-specific middleware"""
        if version not in self._middleware_handlers:
            self._middleware_handlers[version] = []
        self._middleware_handlers[version].append(middleware)
    
    def get_version_middleware(self, version: str) -> List[Callable]:
        """Get middleware for specific version"""
        return self._middleware_handlers.get(version, [])

class VersionedRoute:
    """Decorator for versioned routes"""
    
    def __init__(self, versions: List[str], version_manager: VersionManager):
        self.versions = versions
        self.version_manager = version_manager
    
    def __call__(self, func):
        func._api_versions = self.versions
        return func

class APIVersioningMiddleware:
    """Middleware for API versioning"""
    
    def __init__(self, version_manager: VersionManager):
        self.version_manager = version_manager
    
    async def __call__(self, request: Request, call_next):
        """Process versioning middleware"""
        try:
            # Extract version from request
            version = self.version_manager.get_version_from_request(request)
            
            # Add version to request state
            request.state.api_version = version
            
            # Check if version is deprecated
            if self.version_manager.is_version_deprecated(version):
                version_info = self.version_manager.get_version_info(version)
                warning_msg = f"API version {version} is deprecated"
                
                if version_info and version_info.sunset_date:
                    warning_msg += f" and will be sunset on {version_info.sunset_date}"
                
                logger.warning(f"{warning_msg}. Request: {request.method} {request.url.path}")
            
            # Apply version-specific middleware
            version_middleware = self.version_manager.get_version_middleware(version)
            
            # Process request through version middleware
            response = await call_next(request)
            
            # Add version headers to response
            response.headers["API-Version"] = version
            response.headers["API-Supported-Versions"] = ",".join(self.version_manager.config.supported_versions)
            response.headers["API-Latest-Version"] = self.version_manager.config.latest_version
            
            # Add deprecation warning if applicable
            if self.version_manager.is_version_deprecated(version):
                response.headers["API-Deprecation-Warning"] = "true"
                version_info = self.version_manager.get_version_info(version)
                if version_info and version_info.sunset_date:
                    response.headers["API-Sunset-Date"] = version_info.sunset_date.isoformat()
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"API versioning middleware error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

class VersionedFastAPI(FastAPI):
    """Extended FastAPI with versioning support"""
    
    def __init__(self, version_manager: VersionManager = None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.version_manager = version_manager or VersionManager()
        
        # Add versioning middleware
        self.add_middleware(APIVersioningMiddleware, version_manager=self.version_manager)
        
        # Add version info endpoint
        self.add_api_route("/api/versions", self.get_version_info, methods=["GET"])
    
    async def get_version_info(self):
        """Get API version information"""
        return {
            "default_version": self.version_manager.config.default_version,
            "latest_version": self.version_manager.config.latest_version,
            "supported_versions": self.version_manager.config.supported_versions,
            "versioning_strategy": self.version_manager.config.strategy.value,
            "versions": {
                version: {
                    "status": info.status.value,
                    "release_date": info.release_date.isoformat(),
                    "deprecation_date": info.deprecation_date.isoformat() if info.deprecation_date else None,
                    "sunset_date": info.sunset_date.isoformat() if info.sunset_date else None,
                    "description": info.description,
                    "breaking_changes": info.breaking_changes,
                    "migration_guide": info.migration_guide
                }
                for version, info in self.version_manager.config.version_metadata.items()
            }
        }
    
    def versioned_route(self, path: str, versions: List[str], **kwargs):
        """Create versioned route decorator"""
        def decorator(func):
            # Create routes for each version
            for version in versions:
                version_path = path
                if self.version_manager.config.strategy == VersioningStrategy.URL_PATH:
                    version_path = f"/api/{version}{path}"
                
                # Add route with version tag
                self.add_api_route(
                    version_path,
                    func,
                    tags=[f"API {version}"],
                    **kwargs
                )
            
            return func
        return decorator

# Dependency for getting current API version
async def get_api_version(request: Request) -> str:
    """Dependency to get current API version"""
    return getattr(request.state, 'api_version', 'v1')

# Version comparison utilities
def parse_version(version: str) -> tuple:
    """Parse version string to tuple for comparison"""
    # Remove 'v' prefix if present
    version = version.lstrip('v')
    return tuple(map(int, version.split('.')))

def compare_versions(version1: str, version2: str) -> int:
    """Compare two versions. Returns -1, 0, or 1"""
    v1 = parse_version(version1)
    v2 = parse_version(version2)
    
    if v1 < v2:
        return -1
    elif v1 > v2:
        return 1
    else:
        return 0

def is_version_compatible(required_version: str, current_version: str) -> bool:
    """Check if current version is compatible with required version"""
    return compare_versions(current_version, required_version) >= 0

# Response models for different versions
class BaseVersionedResponse(BaseModel):
    """Base response model with version info"""
    api_version: str
    timestamp: datetime = datetime.utcnow()

class V1Response(BaseVersionedResponse):
    """Version 1 response format"""
    data: Any
    success: bool = True
    message: Optional[str] = None

class V2Response(BaseVersionedResponse):
    """Version 2 response format with enhanced structure"""
    result: Any
    status: str = "success"
    meta: Dict[str, Any] = {}
    errors: List[str] = []

# Version-specific serializers
class VersionedSerializer:
    """Handles version-specific response serialization"""
    
    @staticmethod
    def serialize_for_version(data: Any, version: str) -> Dict[str, Any]:
        """Serialize data for specific API version"""
        if version == "v1":
            return V1Response(
                api_version=version,
                data=data
            ).dict()
        elif version == "v2":
            return V2Response(
                api_version=version,
                result=data
            ).dict()
        else:
            # Default to latest format
            return V2Response(
                api_version=version,
                result=data
            ).dict()

# Migration utilities
class VersionMigrator:
    """Handles data migration between API versions"""
    
    def __init__(self):
        self._migration_rules: Dict[str, Dict[str, Callable]] = {}
    
    def register_migration(self, from_version: str, to_version: str, migrator: Callable):
        """Register migration function between versions"""
        if from_version not in self._migration_rules:
            self._migration_rules[from_version] = {}
        self._migration_rules[from_version][to_version] = migrator
    
    def migrate_data(self, data: Any, from_version: str, to_version: str) -> Any:
        """Migrate data between versions"""
        if from_version == to_version:
            return data
        
        if from_version in self._migration_rules and to_version in self._migration_rules[from_version]:
            migrator = self._migration_rules[from_version][to_version]
            return migrator(data)
        
        # No direct migration available, try chain migration
        # This is a simplified implementation - in practice, you'd want more sophisticated path finding
        logger.warning(f"No direct migration from {from_version} to {to_version}")
        return data

# Global instances
default_version_manager = VersionManager()
version_migrator = VersionMigrator()

# Example version configurations
def setup_default_versions():
    """Setup default version configurations"""
    # Version 1
    v1_info = APIVersion(
        version="v1",
        status=VersionStatus.STABLE,
        release_date=date(2024, 1, 1),
        description="Initial API version with basic functionality"
    )
    default_version_manager.add_version_metadata("v1", v1_info)
    
    # Version 2
    v2_info = APIVersion(
        version="v2",
        status=VersionStatus.BETA,
        release_date=date(2024, 6, 1),
        description="Enhanced API with improved response format and new features",
        breaking_changes=[
            "Response format changed from 'data' to 'result'",
            "Error handling improved with structured error responses",
            "Pagination parameters standardized"
        ],
        migration_guide="https://docs.example.com/api/v2-migration"
    )
    default_version_manager.add_version_metadata("v2", v2_info)
    
    # Update config
    default_version_manager.config.latest_version = "v2"
    default_version_manager.config.supported_versions = ["v1", "v2"]

# Initialize default versions
setup_default_versions()
