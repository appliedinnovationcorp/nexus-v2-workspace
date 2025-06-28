# Applied Innovation Corporation - Website Platform

## Overview
Modern website platform for Applied Innovation Corporation (AIC), built with Next.js and microservices architecture. This project is currently in active development with core functionality implemented and additional features planned.

## Current Implementation Status
✅ **Implemented:**
- Main corporate website (Next.js 14 + TypeScript)
- Authentication service with JWT tokens
- User management service
- Content management service
- Docker containerization
- Basic monitoring setup
- Advanced predictive scaling for auto-scaling infrastructure

🚧 **In Progress:**
- AI integration services
- Business intelligence dashboard
- Performance optimization suite

📋 **Planned:**
- SMB and Enterprise division portals
- Nexus PaaS platform integration
- Advanced AI features
- Comprehensive testing suite

## Architecture Overview
- **Frontend**: Next.js 14 with App Router, TypeScript, TailwindCSS
- **Backend**: FastAPI microservices with PostgreSQL
- **Authentication**: JWT-based with refresh tokens
- **Caching**: Redis for sessions and data caching
- **Monitoring**: Prometheus + Grafana + Jaeger tracing
- **Containerization**: Docker with Docker Compose orchestration

## Domain Architecture (Planned)
- `aicorp.com` - Main corporate site ✅ **Implemented**
- `smb.aicorp.com` - SMB division portal 📋 **Planned**
- `enterprise.aicorp.com` - Enterprise division portal 📋 **Planned**
- `nexus.aicorp.com` - Nexus PaaS platform 📋 **Planned**
- `investors.aicorp.com` - Virtual data room & investor hub 📋 **Planned**
- `admin.aicorp.com` - AI-powered admin dashboard 🚧 **In Progress**

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand (planned)
- **Testing**: Jest + Testing Library (planned)

### Backend Layer
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT with refresh tokens
- **API Documentation**: OpenAPI/Swagger

### Infrastructure Layer
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana + Jaeger
- **CI/CD**: GitHub Actions (planned)
- **Testing**: Pytest + Playwright (planned)

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
│   ├── apps/              # Frontend applications
│   │   ├── web-main/      # Main corporate website
│   │   └── backend/       # Backend services
│   ├── packages/          # Shared libraries
│   │   ├── ui/            # UI components
│   │   └── auth/          # Authentication utilities
│   └── services/          # Microservices
│       ├── auth-service/  # Authentication service
│       └── user-service/  # User management service
├── features/              # Feature specifications
├── docs/                  # Project documentation
└── scripts/               # Development scripts
```

## Development Roadmap

### Q3 2025
- Complete main website implementation
- Finalize authentication and user management services
- Implement basic content management
- Set up CI/CD pipeline with GitHub Actions

### Q4 2025
- Implement SMB division portal
- Add comprehensive testing suite
- Enhance monitoring and observability
- Implement basic AI integration features

### Q1 2026
- Launch Enterprise division portal
- Develop Nexus PaaS platform MVP
- Implement advanced AI features
- Enhance security posture

### Q2 2026
- Launch investor portal
- Complete admin dashboard
- Implement advanced analytics
- Full production deployment with high availability

## Documentation
- [Architecture Guide](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)
- [API Documentation](./docs/api.md)

## License
Proprietary - Applied Innovation Corporation
