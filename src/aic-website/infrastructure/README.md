# AIC Website - Full MACH Architecture

This directory contains the infrastructure implementation for the AIC Website based on MACH principles (Microservices, API-first, Cloud-native, Headless).

## Architecture Overview

The AIC Website infrastructure follows a full MACH architecture with the following components:

### Microservices
- Independent, loosely coupled services
- Each service has its own database
- Communication via well-defined APIs
- Containerized with Docker

### API-First
- Kong API Gateway for centralized API management
- OpenAPI/Swagger specifications for all services
- RESTful API design principles
- API versioning strategy

### Cloud-Native
- Kubernetes for container orchestration
- Kuma for service mesh capabilities
- Horizontal auto-scaling
- Cloud-agnostic deployment

### Headless
- Decoupled frontend and backend
- Multiple frontend clients (web, mobile, etc.)
- Content management separated from presentation

## Directory Structure

- `/kubernetes`: Kubernetes manifests and configurations
- `/terraform`: Infrastructure as Code using Terraform
- `/helm`: Helm charts for Kubernetes deployments
- `/argocd`: ArgoCD configurations for GitOps
- `/observability`: Monitoring, logging, and tracing setup
- `/security`: Security configurations and policies
- `/cicd`: CI/CD pipeline configurations

## Core Components

### API Layer
- **Kong API Gateway**: API management, routing, and security
- **Kuma Service Mesh**: Service-to-service communication

### Container Orchestration
- **Kubernetes**: Container orchestration platform
- **Docker**: Containerization

### Data Layer
- **PostgreSQL**: Transactional data
- **Redis**: Caching and sessions
- **Elasticsearch**: Search capabilities
- **Apache Kafka**: Message queues and async communication

### Observability Stack
- **Prometheus + Grafana**: Metrics and dashboards
- **ELK Stack**: Centralized logging
- **Jaeger**: Distributed tracing
- **AlertManager**: Alerting

### CI/CD Pipeline
- **GitHub Actions**: Source code triggers and lightweight builds
- **GitLab CI**: Security scanning and compliance checks
- **Jenkins**: Complex deployment orchestrations
- **ArgoCD**: GitOps deployments

### Security & Secrets
- **HashiCorp Vault**: Secrets management
- **Keycloak**: OAuth2/OIDC provider
- **cert-manager**: Certificate management for Kubernetes

### Storage & Backup
- **Longhorn**: Cloud-native distributed block storage
- **MinIO**: S3-compatible object storage
- **Velero**: Kubernetes cluster backup and restore

## Getting Started

### Prerequisites
- Kubernetes cluster
- Helm 3+
- kubectl
- Terraform
- Docker

### Deployment
1. Set up infrastructure using Terraform:
   ```
   cd terraform
   terraform init
   terraform apply
   ```

2. Deploy core components with Helm:
   ```
   cd helm
   ./deploy-core.sh
   ```

3. Configure ArgoCD for GitOps:
   ```
   cd argocd
   ./setup-argocd.sh
   ```

4. Deploy microservices:
   ```
   cd kubernetes
   kubectl apply -f namespaces.yaml
   kubectl apply -f services/
   ```

## Documentation
- Architecture Decision Records (ADRs) are in the `/docs/adr` directory
- API documentation is auto-generated and available at `/docs/api`
- Runbooks for operational procedures are in the `/docs/runbooks` directory

## Compliance
- Security and compliance documentation is in the `/docs/compliance` directory
- Testing strategy and reports are in the `/docs/testing` directory
