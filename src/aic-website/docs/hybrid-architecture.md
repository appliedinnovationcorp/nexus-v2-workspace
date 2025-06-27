# AIC Hybrid Architecture: Express.js + FastAPI

## Overview

The AIC website platform implements a strategic hybrid architecture that combines the strengths of both Node.js/Express.js and Python/FastAPI to create the most advanced, AI-native web platform possible.

## Architecture Principles

### Strategic Technology Allocation

#### Express.js/Node.js for:
- **Frontend-connected services** (Next.js applications, PayloadCMS)
- **Monorepo consistency** (JavaScript/TypeScript everywhere)
- **Developer velocity** with shared libraries and unified tooling
- **CQRS/Event Sourcing** infrastructure
- **Real-time communication** (WebSockets, Server-Sent Events)
- **Business logic orchestration** and workflow management

#### FastAPI/Python for:
- **AI/LLM microservices** (OpenAI, Anthropic, Ollama integration)
- **Heavy data-processing endpoints** (analytics, ML pipelines)
- **ML model inference** and training tasks
- **Vector operations** and semantic search
- **Scientific computing** and data analysis

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend Layer                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Main Site   │ │ SMB Portal  │ │ Enterprise  │ │ Nexus       │ │ Admin   │ │
│  │ (Next.js)   │ │ (Next.js)   │ │ (Next.js)   │ │ (Next.js)   │ │ (Next)  │ │
│  │ :3000       │ │ :3001       │ │ :3002       │ │ :3003       │ │ :3005   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway Layer                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                    Express.js Backend (:3100)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    CQRS + Event Sourcing                               │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ Command Bus │ │ Query Bus   │ │ Event Bus   │ │ Saga        │      │ │
│  │  │             │ │             │ │             │ │ Orchestrator│      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                     │
│                              AI Gateway Service                             │
│                                        │                                     │
└────────────────────────────────────────┼───────────────────────────────────┘
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI Services Layer                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                      FastAPI AI Services (:8000)                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ Content     │ │ Lead        │ │ Personaliz- │ │ Search      │      │ │
│  │  │ Generation  │ │ Scoring     │ │ ation       │ │ Enhancement │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ Model       │ │ Vector      │ │ Analytics   │ │ LLM         │      │ │
│  │  │ Inference   │ │ Operations  │ │ Insights    │ │ Service     │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Data Layer                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ PostgreSQL  │ │ MongoDB     │ │ Redis       │ │ Meilisearch │ │ Vector  │ │
│  │ (Primary)   │ │ (NoSQL)     │ │ (Cache)     │ │ (Search)    │ │ DB      │ │
│  │ :5432       │ │ :27017      │ │ :6379       │ │ :7700       │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Communication Patterns

### 1. Frontend → Express.js Backend
- **Protocol**: HTTP/HTTPS, WebSocket
- **Format**: JSON, Server-Sent Events
- **Authentication**: JWT, Session-based
- **Use Cases**: Business logic, CRUD operations, real-time updates

### 2. Express.js → FastAPI AI Services
- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Authentication**: API Key, Service-to-Service tokens
- **Use Cases**: AI operations, ML inference, data processing

### 3. Event-Driven Communication
- **Pattern**: Publish/Subscribe via Event Bus
- **Transport**: Redis Streams, In-memory EventEmitter
- **Use Cases**: Cross-service notifications, workflow orchestration

## AI Gateway Service

The AI Gateway acts as a bridge between Express.js and FastAPI, providing:

### Features
- **Request/Response Translation**: Convert Express.js requests to FastAPI format
- **Connection Pooling**: Efficient HTTP connection management
- **Retry Logic**: Automatic retry with exponential backoff
- **Circuit Breaker**: Fail-fast pattern for service resilience
- **Caching**: Response caching for expensive AI operations
- **Monitoring**: Request/response logging and metrics

### Implementation
```typescript
// AI Gateway Service in Express.js
class AIGatewayService {
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse>
  async scoreLead(request: LeadScoringRequest): Promise<LeadScoringResponse>
  async getPersonalization(request: PersonalizationRequest): Promise<PersonalizationResponse>
  async enhanceSearch(query: string, filters?: any): Promise<SearchResults>
}
```

## Data Flow Examples

### 1. Content Generation Flow
```
Frontend Request → Express.js API → AI Gateway → FastAPI AI Service → LLM Provider
     ↓                ↓                ↓              ↓                    ↓
Response ← Event Bus ← Command Bus ← AI Gateway ← FastAPI Response ← LLM Response
```

### 2. Lead Scoring Flow
```
Lead Created Event → Express.js Handler → AI Gateway → FastAPI Scoring → ML Model
      ↓                     ↓                ↓              ↓              ↓
Database Update ← Event Store ← Score Event ← AI Gateway ← Score Result ← Prediction
```

### 3. Personalization Flow
```
User Request → Express.js → AI Gateway → FastAPI → Vector DB + User Profile
     ↓              ↓            ↓           ↓              ↓
Response ← Cache ← Gateway ← Recommendations ← ML Algorithm ← User Data
```

## Technology Stack Details

### Express.js Backend Stack
```typescript
// Core Technologies
- Express.js 4.18+
- TypeScript 5.3+
- Node.js 18+

// Architecture Patterns
- CQRS (Command Query Responsibility Segregation)
- Event Sourcing
- Saga Pattern for distributed transactions
- Domain-Driven Design (DDD)

// Libraries
- Zod for validation
- EventEmitter3 for event handling
- Axios for HTTP client
- Helmet for security
- Morgan for logging
```

### FastAPI AI Services Stack
```python
# Core Technologies
- FastAPI 0.104+
- Python 3.11+
- Uvicorn ASGI server

# AI/ML Libraries
- OpenAI SDK
- Anthropic SDK
- LangChain
- Transformers
- Sentence Transformers
- Scikit-learn

# Data Processing
- NumPy, Pandas
- Pydantic for validation
- AsyncPG for PostgreSQL
- Motor for MongoDB
```

## Deployment Architecture

### Container Strategy
```yaml
# Docker Compose Services
services:
  # Express.js Backend
  backend:
    image: aic-backend:latest
    ports: ["3100:3100"]
    depends_on: [postgres, mongodb, redis, ai-services]
  
  # FastAPI AI Services  
  ai-services:
    image: aic-ai-services:latest
    ports: ["8000:8000"]
    depends_on: [postgres, mongodb, redis, ollama]
    
  # Supporting Services
  postgres: {...}
  mongodb: {...}
  redis: {...}
  meilisearch: {...}
  ollama: {...}
```

### Kubernetes Deployment
```yaml
# Separate deployments for each service type
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aic-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aic-backend
  template:
    spec:
      containers:
      - name: backend
        image: aic-backend:latest
        ports:
        - containerPort: 3100
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aic-ai-services
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aic-ai-services
  template:
    spec:
      containers:
      - name: ai-services
        image: aic-ai-services:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Performance Considerations

### Express.js Optimizations
- **Connection Pooling**: Database connection pools
- **Caching**: Redis-based caching for frequent queries
- **Clustering**: Multi-process deployment
- **Compression**: Gzip compression middleware

### FastAPI Optimizations
- **Async/Await**: Non-blocking I/O operations
- **Worker Processes**: Multiple Uvicorn workers
- **Model Caching**: In-memory model caching
- **Batch Processing**: Batch AI requests for efficiency

### Cross-Service Optimizations
- **Connection Reuse**: HTTP keep-alive connections
- **Request Batching**: Batch multiple AI requests
- **Response Caching**: Cache expensive AI operations
- **Circuit Breakers**: Prevent cascade failures

## Monitoring & Observability

### Metrics Collection
```python
# FastAPI Prometheus Metrics
from prometheus_client import Counter, Histogram, Gauge

REQUEST_COUNT = Counter('aic_ai_requests_total', 'Total AI requests')
REQUEST_DURATION = Histogram('aic_ai_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('aic_ai_active_connections', 'Active connections')
```

```typescript
// Express.js Monitoring
import { createPrometheusMetrics } from '@prometheus/client'

const httpRequestDuration = new Histogram({
  name: 'aic_backend_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})
```

### Health Checks
- **Express.js**: `/api/health` endpoint with dependency checks
- **FastAPI**: `/health` and `/health/detailed` endpoints
- **Cross-Service**: AI Gateway health monitoring

### Logging Strategy
- **Structured Logging**: JSON format for both services
- **Correlation IDs**: Request tracing across services
- **Log Aggregation**: Centralized logging with ELK stack

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Shared token validation
- **API Keys**: Service-to-service authentication
- **RBAC**: Role-based access control
- **Rate Limiting**: Per-service rate limits

### Data Protection
- **Encryption**: TLS for all inter-service communication
- **Input Validation**: Zod (TypeScript) and Pydantic (Python)
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up -d

# Express.js development
cd apps/backend
npm run dev

# FastAPI development  
cd apps/ai-services
uvicorn main:app --reload --port 8000
```

### Testing Strategy
- **Unit Tests**: Jest (Express.js), Pytest (FastAPI)
- **Integration Tests**: Cross-service API testing
- **Contract Tests**: API contract validation
- **Load Tests**: Performance testing for AI endpoints

## Benefits of Hybrid Architecture

### Technical Benefits
1. **Best Tool for the Job**: Use each technology's strengths
2. **Performance**: Optimized for specific workloads
3. **Scalability**: Independent scaling of services
4. **Maintainability**: Clear separation of concerns

### Business Benefits
1. **Developer Productivity**: Familiar technologies for each domain
2. **Time to Market**: Faster development cycles
3. **Cost Efficiency**: Optimized resource utilization
4. **Future-Proofing**: Easy to adopt new AI technologies

### Operational Benefits
1. **Monitoring**: Service-specific observability
2. **Deployment**: Independent deployment cycles
3. **Fault Isolation**: Service failures don't cascade
4. **Resource Management**: Optimized resource allocation

## Migration Strategy

### Phase 1: Foundation (Current)
- ✅ Express.js backend with CQRS/Event Sourcing
- ✅ FastAPI AI services with core ML capabilities
- ✅ AI Gateway for service communication

### Phase 2: Enhancement
- Advanced AI features (RAG, fine-tuning)
- Real-time AI streaming
- Enhanced personalization

### Phase 3: Scale
- Microservices decomposition
- Kubernetes deployment
- Advanced monitoring and alerting

This hybrid architecture positions AIC as a leader in AI-driven platforms while maintaining the flexibility and performance needed for enterprise-scale operations.
