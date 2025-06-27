# [ADR-0002] API Gateway Selection

## Status

Accepted

## Date

2023-06-05

## Context

As part of our MACH architecture implementation ([ADR-0001](0001-adopt-mach-architecture.md)), we need an API Gateway to serve as the entry point for all client requests. The API Gateway will handle cross-cutting concerns such as:

- Request routing
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Monitoring and analytics
- Caching
- SSL termination

We need to select an API Gateway solution that meets our requirements for performance, scalability, features, and ease of integration with our Kubernetes-based infrastructure.

## Decision

We will use **Kong API Gateway** as our API Gateway solution.

Kong will be deployed in Kubernetes using the official Helm chart, with the following configuration:

- Deployed in the `api-gateway` namespace
- Configured with PostgreSQL as the backing database for configuration
- Integrated with Prometheus for metrics collection
- Set up with appropriate resource requests and limits
- Configured with horizontal pod autoscaling

## Consequences

### Positive

- **Performance**: Kong is built on NGINX and provides high performance with low latency.
- **Scalability**: Kong can be horizontally scaled to handle increased load.
- **Extensibility**: Kong has a rich plugin ecosystem that covers most of our requirements out of the box.
- **Kubernetes Integration**: Kong has excellent Kubernetes integration through the Kong Ingress Controller.
- **Community Support**: Kong has a large and active community, with both open-source and enterprise support options.
- **Declarative Configuration**: Kong supports declarative configuration through YAML files, which aligns with our GitOps approach.
- **Observability**: Kong provides detailed metrics and logs for monitoring and troubleshooting.

### Negative

- **Complexity**: Kong has a learning curve, especially for advanced configurations.
- **Resource Usage**: Kong requires more resources compared to simpler API Gateways.
- **Database Dependency**: The Kong database (PostgreSQL) becomes a critical component that needs to be managed.
- **Plugin Management**: Managing and updating plugins requires careful testing and deployment.

## Alternatives Considered

### Amazon API Gateway

**Pros**:
- Fully managed service
- Tight integration with AWS services
- Pay-per-use pricing model
- Built-in DDoS protection

**Cons**:
- Vendor lock-in to AWS
- Limited customization options
- Higher latency compared to self-hosted solutions
- Potential cost concerns at scale

This option was rejected due to concerns about vendor lock-in and the desire for greater customization.

### NGINX Ingress Controller

**Pros**:
- Lightweight and high performance
- Familiar to many team members
- Good Kubernetes integration
- No database dependency

**Cons**:
- Limited built-in API Gateway features
- Requires custom development for advanced features
- Configuration can become complex
- Less comprehensive monitoring

This option was rejected because it would require significant custom development to match Kong's feature set.

### Traefik

**Pros**:
- Native Kubernetes integration
- Automatic service discovery
- Dynamic configuration
- Good observability

**Cons**:
- Less mature API Gateway features compared to Kong
- Smaller plugin ecosystem
- Less community support for enterprise use cases
- Performance concerns at high scale

This option was rejected because Kong offers a more comprehensive API Gateway solution with better enterprise support.

### Istio Gateway

**Pros**:
- Part of a comprehensive service mesh solution
- Strong security features
- Good traffic management capabilities
- Integrated with Kubernetes

**Cons**:
- High complexity and resource usage
- Steep learning curve
- Overkill if only API Gateway functionality is needed
- Potential performance overhead

This option was rejected because we decided to separate the API Gateway and Service Mesh concerns, using specialized tools for each.

## References

- [Kong API Gateway Documentation](https://docs.konghq.com/)
- [Kong Kubernetes Ingress Controller](https://github.com/Kong/kubernetes-ingress-controller)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Comparison of API Gateway Solutions](https://www.nginx.com/blog/choosing-the-right-api-gateway/)
- [Kong Performance Benchmarks](https://konghq.com/blog/kong-gateway-2-8-performance/)
