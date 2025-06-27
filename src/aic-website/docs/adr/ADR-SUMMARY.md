# Architecture Decision Records (ADRs) Summary

This document provides a summary of all Architecture Decision Records (ADRs) for the AIC Website project and illustrates the relationships between them.

## ADR Overview

| Number | Title | Status | Date | Key Decision |
|--------|-------|--------|------|-------------|
| [ADR-0001](0001-adopt-mach-architecture.md) | Adopt MACH Architecture | Accepted | 2023-06-01 | Adopt Microservices, API-first, Cloud-native, Headless architecture |
| [ADR-0002](0002-api-gateway-selection.md) | API Gateway Selection | Accepted | 2023-06-05 | Use Kong API Gateway |
| [ADR-0003](0003-service-mesh-implementation.md) | Service Mesh Implementation | Accepted | 2023-06-10 | Implement Kuma Service Mesh |
| [ADR-0004](0004-database-technology-selection.md) | Database Technology Selection | Accepted | 2023-06-15 | Use PostgreSQL, Redis, Elasticsearch, and Kafka |
| [ADR-0005](0005-cms-selection.md) | CMS Selection | Accepted | 2023-06-20 | Use Ghost CMS |
| [ADR-0006](0006-observability-stack.md) | Observability Stack | Accepted | 2023-06-25 | Implement Prometheus, Grafana, ELK Stack, and Jaeger |
| [ADR-0007](0007-ci-cd-pipeline.md) | CI/CD Pipeline | Accepted | 2023-07-01 | Use GitHub Actions, GitLab CI, Jenkins, and ArgoCD |
| [ADR-0008](0008-security-implementation.md) | Security Implementation | Accepted | 2023-07-05 | Implement HashiCorp Vault, Keycloak, cert-manager, Network Policies, and mTLS |
| [ADR-0009](0009-storage-solution.md) | Storage Solution | Accepted | 2023-07-10 | Use Longhorn, MinIO, and Velero |
| [ADR-0010](0010-frontend-framework.md) | Frontend Framework | Accepted | 2023-07-15 | Use Next.js with React |
| [ADR-0011](0011-event-driven-architecture.md) | Event-Driven Architecture | Accepted | 2023-07-20 | Use Apache Kafka for event-driven communication |

## ADR Relationships

The following diagram illustrates the relationships between the ADRs:

```
                                  ┌───────────────────┐
                                  │                   │
                                  │  ADR-0001:        │
                                  │  MACH Architecture│
                                  │                   │
                                  └─────────┬─────────┘
                                            │
                 ┌──────────────────────────┼──────────────────────────┐
                 │                          │                          │
                 ▼                          ▼                          ▼
        ┌─────────────────┐       ┌─────────────────┐        ┌─────────────────┐
        │                 │       │                 │        │                 │
        │  ADR-0002:      │       │  ADR-0004:      │        │  ADR-0005:      │
        │  API Gateway    │       │  Database       │        │  CMS Selection  │
        │                 │       │  Technology     │        │                 │
        └────────┬────────┘       └────────┬────────┘        └────────┬────────┘
                 │                         │                          │
                 ▼                         │                          │
        ┌─────────────────┐                │                          │
        │                 │                │                          │
        │  ADR-0003:      │                │                          │
        │  Service Mesh   │                │                          │
        │                 │                │                          │
        └────────┬────────┘                │                          │
                 │                         │                          │
                 │                         ▼                          │
                 │                ┌─────────────────┐                 │
                 └───────────────►│                 │◄────────────────┘
                                  │  ADR-0011:      │
                                  │  Event-Driven   │
                                  │  Architecture   │
                                  │                 │
                                  └────────┬────────┘
                                           │
                 ┌──────────────────────────┼──────────────────────────┐
                 │                          │                          │
                 ▼                          ▼                          ▼
        ┌─────────────────┐       ┌─────────────────┐        ┌─────────────────┐
        │                 │       │                 │        │                 │
        │  ADR-0006:      │       │  ADR-0007:      │        │  ADR-0008:      │
        │  Observability  │       │  CI/CD Pipeline │        │  Security       │
        │                 │       │                 │        │                 │
        └─────────────────┘       └────────┬────────┘        └────────┬────────┘
                                           │                          │
                                           ▼                          │
                                  ┌─────────────────┐                 │
                                  │                 │                 │
                                  │  ADR-0009:      │◄────────────────┘
                                  │  Storage        │
                                  │  Solution       │
                                  │                 │
                                  └────────┬────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │                 │
                                  │  ADR-0010:      │
                                  │  Frontend       │
                                  │  Framework      │
                                  │                 │
                                  └─────────────────┘
```

## Key Architectural Insights

1. **Foundation**: ADR-0001 (MACH Architecture) serves as the foundation for all other architectural decisions, establishing the core principles of Microservices, API-first, Cloud-native, and Headless architecture.

2. **API Layer**: ADR-0002 (API Gateway) and ADR-0003 (Service Mesh) define the API layer, handling external and internal communication respectively.

3. **Data Layer**: ADR-0004 (Database Technology) and ADR-0011 (Event-Driven Architecture) define the data layer, covering both data storage and data flow.

4. **Content Layer**: ADR-0005 (CMS Selection) defines the content management approach, implementing the "Headless" aspect of MACH.

5. **Infrastructure Layer**: ADR-0006 (Observability), ADR-0007 (CI/CD), ADR-0008 (Security), and ADR-0009 (Storage) define the infrastructure layer that supports the application.

6. **Presentation Layer**: ADR-0010 (Frontend Framework) defines the presentation layer, completing the "Headless" architecture by providing a decoupled frontend.

## Evolution of Architecture

The ADRs show a logical progression in the architectural decision-making process:

1. First, the core architectural style was established (ADR-0001).
2. Then, the communication patterns were defined (ADR-0002, ADR-0003, ADR-0011).
3. Next, the data storage and content management approaches were selected (ADR-0004, ADR-0005).
4. Following that, the supporting infrastructure was designed (ADR-0006, ADR-0007, ADR-0008, ADR-0009).
5. Finally, the frontend approach was decided (ADR-0010).

This progression demonstrates a thoughtful, layered approach to architecture, starting with foundational decisions and building up to more specific implementation choices.

## Future Considerations

As the system evolves, additional ADRs may be needed to address:

1. **AI Integration**: How AI capabilities will be integrated into the architecture
2. **Multi-region Deployment**: Strategies for deploying across multiple regions
3. **Edge Computing**: Approaches for moving computation closer to users
4. **Mobile Strategy**: Native apps vs. progressive web apps
5. **Personalization**: Architecture for user personalization and recommendations

These future decisions should build upon and align with the existing architectural foundation established by the current ADRs.
