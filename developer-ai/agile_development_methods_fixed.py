"""
Development and Testing methods for the Agile Feature Development Algorithm
Contains implementation logic for development, testing, deployment, and maintenance phases
"""

import os
import json
import datetime
import asyncio
from pathlib import Path
from typing import Dict, List, Any


class AgileDevelopmentMethods:
    """Development, testing, deployment, and maintenance methods"""
    
    def __init__(self):
        """Initialize the development methods"""
        self.logger = self._setup_logger()
    
    def _setup_logger(self):
        """Setup basic logging"""
        import logging
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger(__name__)
    
    def _extract_feature_name(self) -> str:
        """Extract feature name from context"""
        # This would normally extract from the current context
        return "feature"
    
    def _setup_environment(self) -> Dict[str, Any]:
        """Step 3.1: Environment setup"""
        feature_name = self._extract_feature_name()
        
        environment_setup = {
            "development_tools": [
                "Node.js 18+ with npm/yarn",
                "TypeScript compiler",
                "ESLint and Prettier for code quality",
                "Jest for testing framework",
                "Docker for containerization",
                "Git for version control"
            ],
            "frameworks": [
                "Express.js or Fastify for backend API",
                "React with Next.js for frontend",
                "Prisma or TypeORM for database ORM",
                "Redis client for caching",
                "Winston for logging"
            ],
            "infrastructure": [
                "PostgreSQL database instance",
                "Redis cache instance",
                "Development server environment",
                "CI/CD pipeline setup",
                "Monitoring and logging infrastructure"
            ],
            "configuration_files": {
                "package.json": "Node.js dependencies and scripts",
                "tsconfig.json": "TypeScript configuration",
                "docker-compose.yml": "Local development containers",
                ".env.example": "Environment variables template",
                "jest.config.js": "Testing configuration"
            }
        }
        
        return environment_setup
    
    def _generate_backend_code(self) -> Dict[str, str]:
        """Step 3.2: Backend code generation"""
        feature_name = self._extract_feature_name()
        
        # Generate Python/FastAPI backend code instead of JavaScript
        backend_code = {
            "models.py": f'''
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class {feature_name.title()}(Base):
    __tablename__ = "{feature_name}s"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
''',
            "service.py": f'''
from typing import List, Optional
import json
import logging

class {feature_name.title()}Service:
    def __init__(self, db_session, redis_client):
        self.db = db_session
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)
    
    async def create_{feature_name}(self, data: dict, user_id: int) -> dict:
        """Create a new {feature_name}"""
        try:
            # Validate input data
            validated_data = self._validate_input(data)
            
            # Check cache for duplicates
            cache_key = f"{feature_name}:create:{user_id}:{hash(str(validated_data))}"
            cached = await self.redis.get(cache_key)
            
            if cached:
                return json.loads(cached)
            
            # Create in database
            new_entity = {feature_name.title()}(
                **validated_data,
                user_id=user_id
            )
            self.db.add(new_entity)
            self.db.commit()
            
            # Cache the result
            result = self._entity_to_dict(new_entity)
            await self.redis.setex(cache_key, 300, json.dumps(result))
            await self.redis.setex(f"{feature_name}:{new_entity.id}", 3600, json.dumps(result))
            
            self.logger.info(f"{feature_name.title()} created successfully", extra={{
                "feature_id": new_entity.id,
                "user_id": user_id
            }})
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error creating {feature_name}: {str(e)}")
            raise
    
    def _validate_input(self, data: dict) -> dict:
        """Validate input data"""
        # Basic validation - extend as needed
        required_fields = ["name"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        return data
    
    def _entity_to_dict(self, entity) -> dict:
        """Convert entity to dictionary"""
        return {{
            "id": entity.id,
            "name": entity.name,
            "description": entity.description,
            "user_id": entity.user_id,
            "created_at": entity.created_at.isoformat(),
            "updated_at": entity.updated_at.isoformat()
        }}
'''
        }
        
        return backend_code
    
    def _generate_frontend_code(self) -> Dict[str, str]:
        """Step 3.3: Frontend code generation"""
        feature_name = self._extract_feature_name()
        
        frontend_code = {
            "component.tsx": f'''
import React, {{ useState, useEffect }} from 'react';

interface {feature_name.title()} {{
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}}

export const {feature_name.title()}Component: React.FC = () => {{
    const [items, setItems] = useState<{feature_name.title()}[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {{
        fetch('/api/{feature_name}s')
            .then(res => res.json())
            .then(data => {{
                setItems(data);
                setLoading(false);
            }})
            .catch(err => {{
                console.error('Error fetching {feature_name}s:', err);
                setLoading(false);
            }});
    }}, []);
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div>
            <h2>{feature_name.title()}s</h2>
            {{items.map(item => (
                <div key={{item.id}}>
                    <h3>{{item.name}}</h3>
                    <p>{{item.description}}</p>
                </div>
            ))}}
        </div>
    );
}};
'''
        }
        
        return frontend_code
    
    def _setup_database(self) -> Dict[str, Any]:
        """Step 3.4: Database setup"""
        feature_name = self._extract_feature_name()
        
        database_config = {
            "migrations": {
                f"create_{feature_name}s_table.sql": f'''
CREATE TABLE {feature_name}s (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_{feature_name}s_user_id ON {feature_name}s(user_id);
CREATE INDEX idx_{feature_name}s_created_at ON {feature_name}s(created_at);
'''
            },
            "connection_config": {
                "host": "localhost",
                "port": 5432,
                "database": "agile_dev",
                "user": "postgres",
                "password": "password"
            }
        }
        
        return database_config
    
    def _implement_caching(self) -> Dict[str, Any]:
        """Step 3.5: Caching implementation"""
        caching_config = {
            "redis_config": {
                "host": "localhost",
                "port": 6379,
                "db": 0,
                "decode_responses": True
            },
            "cache_strategies": {
                "entity_cache": "3600 seconds (1 hour)",
                "list_cache": "300 seconds (5 minutes)",
                "search_cache": "600 seconds (10 minutes)"
            }
        }
        
        return caching_config
    
    def generate_development_artifacts(self) -> Dict[str, Any]:
        """Generate all development artifacts"""
        return {
            "environment": self._setup_environment(),
            "backend_code": self._generate_backend_code(),
            "frontend_code": self._generate_frontend_code(),
            "database": self._setup_database(),
            "caching": self._implement_caching()
        }
