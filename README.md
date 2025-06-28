# Applied Innovation Corporation - Enterprise AI-Native Website Platform

## Overview
State-of-the-art, enterprise-grade website platform for Applied Innovation Corporation (AIC), implementing the most advanced web architecture possible with current technology. This platform exceeds enterprise requirements for scalability, AI integration, security, and cloud portability.

## Architecture Principles
- **MACH Architecture**: Microservices, API-first, Cloud-native, Headless
- **Event-Driven & Real-Time**: Full event mesh with CQRS and Sagas
- **AI-Native**: LLM embedded at every layer
- **FOSS-First**: Best-of-breed open source stack
- **Cloud Agnostic**: Portable across AWS, GCP, Azure, on-prem
- **Zero Trust Security**: End-to-end encryption and compliance

## Domain Architecture
- `aicorp.com` - Main corporate site
- `smb.aicorp.com` - SMB division portal
- `enterprise.aicorp.com` - Enterprise division portal
- `nexus.aicorp.com` - Nexus PaaS platform
- `investors.aicorp.com` - Virtual data room & investor hub
- `admin.aicorp.com` - AI-powered admin dashboard

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 14+ (App Router + RSC + Edge Functions)
- **Styling**: TailwindCSS + shadcn/ui
- **Rendering**: Hybrid Static/SSR/ISR/Edge optimized per route
- **Features**: AI-personalized UI, PWA, mobile-first

### Backend Layer
- **Architecture**: Event-driven microservices with CQRS/Sagas
- **Runtime**: Node.js with Next.js API routes
- **CMS**: PayloadCMS (headless, DB-agnostic)
- **Auth**: Supabase Auth + NextAuth + OAuth2
- **APIs**: GraphQL/REST with unified gateway

### Data Layer
- **Primary DB**: PostgreSQL (structured data, CQRS writes)
- **NoSQL**: MongoDB (unstructured data)
- **Search**: Meilisearch + Vector DB (AI-enhanced search)
- **Patterns**: Event Sourcing, CQRS, Data Federation

### AI/ML Layer
- **LLM Integration**: Local (Ollama) + Cloud (Grok, LLaMA3, Mistral)
- **Features**: AI search, content generation, personalization, lead scoring
- **RAG**: Retrieval Augmented Generation for assistants
- **Edge AI**: Inference at CDN edge for ultra-low latency

### Infrastructure Layer
- **Containers**: Docker with multi-stage builds
- **Orchestration**: Kubernetes-ready manifests
- **IaC**: Terraform (cloud-agnostic) + AWS CDK templates
- **CI/CD**: GitHub Actions with automated testing/deployment
- **Monitoring**: Prometheus + Grafana + AI anomaly detection

## Quick Start

### Automated Setup (Recommended)
```bash
# Quick local setup
npm run setup

# Start development
npm run dev
```

### Manual Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start infrastructure services
npm run docker:up

# Build applications
npm run build

# Start development servers
npm run dev
```

### Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## Project Structure
```
nexus-v2-workspace/
├── src/aic-website/       # Main website application
├── developer-ai/          # 🤖 Agile Feature Development Algorithm
├── features/              # Feature specifications
├── docs/                  # Project documentation
├── scripts/               # Development scripts
└── Summaries/             # Implementation summaries
```

## 🤖 Developer AI System
The project includes a comprehensive **Agile Feature Development Algorithm** that can automatically develop any software feature from natural language descriptions:

```bash
# Quick start with Developer AI
cd developer-ai
python run.py examples

# Develop a custom feature
python run.py "user authentication system with OAuth2"
```

See `developer-ai/README.md` for complete documentation.

## Key Features
- 🤖 AI-native architecture with embedded LLM services
- 🚀 Edge computing with ultra-low latency
- 🔒 Zero Trust security with end-to-end encryption
- 📊 Real-time analytics and AI-powered insights
- 🌐 Multi-tenant aware routing and theming
- 📱 Progressive Web App with offline capabilities
- 🔄 Event-driven architecture with CQRS and Sagas
- 🎯 AI-powered personalization and lead scoring

## Documentation
- [Architecture Guide](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)
- [AI Integration Guide](./docs/ai-integration.md)

## License
Proprietary - Applied Innovation Corporation
