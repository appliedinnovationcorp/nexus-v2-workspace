# AIC API Gateway with Kong and Kuma

This directory contains the configuration and setup for the Applied Innovation Corporation API Gateway using Kong and Kuma for a universal service mesh architecture.

## Architecture Overview

Our API Gateway architecture uses:

- **Kong**: Industry-leading API Gateway for managing traffic, authentication, and routing
- **Kuma**: Universal service mesh that provides advanced networking capabilities
- **Kubernetes**: Container orchestration platform (optional, can also run on VMs)

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

## Key Features

- **API Management**: Rate limiting, authentication, transformations
- **Service Mesh**: Service discovery, traffic management, observability
- **Multi-Protocol Support**: HTTP, gRPC, TCP, and more
- **Zero-Trust Security**: mTLS between all services
- **Observability**: Integrated metrics, logging, and tracing
- **Traffic Control**: Advanced routing, circuit breaking, fault injection
- **Multi-Zone Deployment**: Support for multi-cluster and multi-cloud

## Directory Structure

- `/kong`: Kong API Gateway configuration
- `/kuma`: Kuma Service Mesh configuration
- `/scripts`: Utility scripts for setup and management
- `/docs`: Documentation and architecture diagrams

## Getting Started

### Prerequisites

- Docker and Docker Compose
- kubectl (if using Kubernetes)
- helm (if using Kubernetes)

### Local Development Setup

1. Start the local development environment:

```bash
./scripts/start-local.sh
```

2. Access the Kong Admin API:

```
http://localhost:8001
```

3. Access the Kuma Control Plane:

```
http://localhost:5681/gui
```

### Production Deployment

For production deployment, follow the instructions in `/docs/production-deployment.md`.

## Configuration

### Kong Configuration

Kong is configured using declarative configuration files in the `/kong` directory. The main configuration file is `kong.yaml`.

### Kuma Configuration

Kuma is configured using policies in the `/kuma` directory. These policies define traffic routing, security, and observability settings.

## Service Registration

To register a new service with the API Gateway and Service Mesh:

1. Add the service definition to `/kong/services`
2. Create routing rules in `/kong/routes`
3. Define Kuma policies in `/kuma/policies`
4. Apply the configuration using the provided scripts

## Monitoring and Observability

The API Gateway and Service Mesh provide built-in observability:

- **Metrics**: Prometheus-compatible metrics
- **Logging**: Structured logs that can be sent to your logging system
- **Tracing**: Distributed tracing with Zipkin/Jaeger
- **Dashboards**: Pre-configured Grafana dashboards

## Security

Security is implemented at multiple levels:

- **API Gateway**: Authentication, authorization, and rate limiting
- **Service Mesh**: mTLS for service-to-service communication
- **Network Policies**: Fine-grained access control between services

## References

- [Kong Documentation](https://docs.konghq.com/)
- [Kuma Documentation](https://kuma.io/docs/)
- [Kong for Kubernetes](https://docs.konghq.com/kubernetes-ingress-controller/)
- [Kuma with Kubernetes](https://kuma.io/docs/latest/installation/kubernetes/)
