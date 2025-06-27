# API Gateway Architecture

This document describes the architecture of the AIC API Gateway using Kong and Kuma.

## Overview

The API Gateway architecture consists of the following components:

1. **Kong API Gateway**: Handles API management, authentication, and routing
2. **Kuma Service Mesh**: Provides service discovery, traffic management, and observability
3. **Backend Services**: Various microservices that provide business functionality
4. **Observability Stack**: Prometheus, Grafana, and Zipkin for monitoring and tracing

## Architecture Diagram

```
                                 ┌─────────────────────┐
                                 │                     │
                                 │  Client Applications│
                                 │                     │
                                 └──────────┬──────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                              Kong API Gateway                           │
│                                                                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            Kuma Service Mesh                            │
│                                                                         │
└───┬─────────────────────┬─────────────────────┬─────────────────────┬───┘
    │                     │                     │                     │
    ▼                     ▼                     ▼                     ▼
┌─────────┐         ┌─────────┐           ┌─────────┐           ┌─────────┐
│         │         │         │           │         │           │         │
│ Backend │         │Ghost CMS│           │   AI    │           │  Other  │
│ Service │         │         │           │Services │           │Services │
│         │         │         │           │         │           │         │
└─────────┘         └─────────┘           └─────────┘           └─────────┘
```

## Component Details

### Kong API Gateway

Kong serves as the entry point for all client requests and provides:

- **API Management**: Rate limiting, authentication, transformations
- **Traffic Control**: Routing, load balancing
- **Security**: Authentication, authorization, IP filtering
- **Plugins**: Extensibility through plugins

### Kuma Service Mesh

Kuma provides service mesh capabilities:

- **Service Discovery**: Automatic service discovery
- **Traffic Management**: Advanced routing, circuit breaking
- **Security**: mTLS for service-to-service communication
- **Observability**: Metrics, logging, and tracing

### Backend Services

The backend services include:

- **Backend API**: Core business logic and data access
- **Ghost CMS**: Content management system
- **AI Services**: AI model serving and agent execution
- **Other Services**: Additional microservices as needed

### Observability Stack

The observability stack includes:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Zipkin**: Distributed tracing

## Request Flow

1. **Client Request**: A client makes a request to the API Gateway
2. **Authentication**: Kong authenticates the request
3. **Rate Limiting**: Kong applies rate limiting
4. **Routing**: Kong routes the request to the appropriate service
5. **Service Mesh**: Kuma handles service-to-service communication
6. **Service Execution**: The target service processes the request
7. **Response**: The response flows back through Kuma and Kong to the client

## Security Architecture

### Authentication Methods

- **API Keys**: For service-to-service communication
- **JWT**: For user authentication
- **OAuth2**: For third-party integrations

### Authorization

- **Role-Based Access Control**: Different roles have different permissions
- **Attribute-Based Access Control**: Fine-grained access control based on attributes

### Network Security

- **mTLS**: All service-to-service communication is encrypted
- **Network Policies**: Restrict communication between services
- **IP Restrictions**: Limit admin access to trusted IPs

## Deployment Models

### Kubernetes Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                       │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │
│  │             │   │             │   │                     │    │
│  │  Kong Pods  │   │  Kuma Pods  │   │  Service Pods       │    │
│  │             │   │             │   │                     │    │
│  └─────────────┘   └─────────────┘   └─────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                Observability Stack                      │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### VM Deployment

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│             │   │             │   │             │   │             │
│  Kong VM    │   │  Kuma VM    │   │ Service VM  │   │ Service VM  │
│             │   │             │   │             │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
        │                 │                │                │
        └─────────────────┴────────────────┴────────────────┘
                                │
                        ┌───────────────┐
                        │               │
                        │ Database VM   │
                        │               │
                        └───────────────┘
```

## Scaling Strategy

### Horizontal Scaling

- **Kong**: Deploy multiple instances behind a load balancer
- **Kuma**: Scale control plane and data plane independently
- **Services**: Scale individual services based on demand

### Vertical Scaling

- Increase resources (CPU, memory) for components as needed

## Disaster Recovery

### Backup Strategy

- Regular backups of Kong's PostgreSQL database
- Configuration stored in version control
- Automated restoration procedures

### High Availability

- Multiple instances of each component
- Geographic distribution for global deployments
- Automatic failover mechanisms
