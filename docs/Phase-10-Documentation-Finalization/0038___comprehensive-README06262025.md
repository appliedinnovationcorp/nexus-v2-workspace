A comprehensive README has been created in this codebase as part of the documentation for Feature 002: Full MACH architecture. The main README file is located at:

/home/oss/Business/workspaces/nexus-v2-workspace/src/aic-website/infrastructure/README.md

This README provides detailed information about the MACH architecture implementation, including:

1. Architecture Overview:
   • Explanation of MACH principles (Microservices, API-first, Cloud-native, Headless)
   • Description of how each principle is implemented in the codebase

2. Directory Structure:
   • Clear outline of the repository organization
   • Description of what each directory contains

3. Core Components:
   • Detailed information about each major component:
     • API Layer (Kong API Gateway and Kuma Service Mesh)
     • Container Orchestration (Kubernetes and Docker)
     • Data Layer (PostgreSQL, Redis, Elasticsearch, Kafka)
     • Observability Stack (Prometheus, Grafana, ELK Stack, Jaeger)
     • CI/CD Pipeline (GitHub Actions, GitLab CI, Jenkins, ArgoCD)
     • Security & Secrets (HashiCorp Vault, Keycloak, cert-manager)
     • Storage & Backup (Longhorn, MinIO, Velero)

4. Getting Started:
   • Prerequisites for working with the codebase
   • Step-by-step deployment instructions
   • Commands for setting up the infrastructure

5. Documentation References:
   • Links to more detailed documentation
   • References to Architecture Decision Records (ADRs)
   • Information about API documentation

The README serves as a comprehensive entry point for understanding the MACH architecture 
implementation and provides guidance for developers working with the codebase.