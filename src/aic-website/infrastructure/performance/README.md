# Performance Tuning and Optimization

This directory contains performance tuning guidelines, configurations, and tools for the AIC Website MACH architecture.

## Overview

Performance optimization is critical for meeting the performance requirements specified in Feature 002. This directory provides comprehensive resources for tuning and optimizing all components of the MACH architecture.

## Contents

- [Performance Tuning Guidelines](./PERFORMANCE-TUNING-GUIDELINES.md): Comprehensive guidelines for performance tuning
- [Load Testing Scripts](./load-test.js): k6 scripts for load testing
- [Performance Test Runner](./run-performance-tests.sh): Script to run performance tests
- [Kubernetes Performance Test Job](./k6-performance-test.yaml): Kubernetes job for running performance tests
- [PostgreSQL Optimization](./optimize-postgres.sql): SQL script for optimizing PostgreSQL
- [Redis Configuration](./redis.conf): Optimized Redis configuration
- [Kubernetes HPA Configuration](./hpa-config.yaml): Horizontal Pod Autoscaler configuration

## Performance Requirements

As specified in Feature 002, the system must meet the following performance requirements:

### PR-001: Scalability
- Horizontal pod autoscaling configured
- Load testing validates scaling behavior
- Database connection pooling implemented
- CDN (CloudFlare) for static content delivery
- Performance benchmarks established

### PR-002: Availability
- 99.9% uptime SLA
- Multi-zone deployment
- Circuit breakers prevent cascade failures
- Graceful degradation implemented
- Chaos engineering practices

### PR-003: Performance
- API response times <200ms (95th percentile)
- Database query optimization
- Caching strategies implemented
- Performance monitoring and alerting
- Regular performance testing

## How to Use

### Running Performance Tests Locally

```bash
# Install k6
npm install -g k6

# Run the performance tests
./run-performance-tests.sh
```

### Running Performance Tests in Kubernetes

```bash
# Create the performance namespace
kubectl create namespace performance

# Apply the performance test job
kubectl apply -f k6-performance-test.yaml

# Check the job status
kubectl get jobs -n performance

# View the test results
kubectl logs job/k6-performance-test -n performance
```

### Optimizing PostgreSQL

```bash
# Connect to the PostgreSQL database
psql -h <database-host> -U <username> -d <database>

# Run the optimization script
\i optimize-postgres.sql
```

### Applying Redis Configuration

```bash
# Apply the Redis configuration
kubectl create configmap redis-config -n messaging --from-file=redis.conf

# Update the Redis deployment to use the configmap
kubectl patch deployment redis -n messaging -p '{"spec":{"template":{"spec":{"containers":[{"name":"redis","args":["redis-server", "/etc/redis/redis.conf"]}]}}}}'
```

### Applying HPA Configuration

```bash
# Apply the HPA configuration
kubectl apply -f hpa-config.yaml
```

## Performance Monitoring

Performance monitoring is implemented using the following tools:

- **Prometheus**: Collects metrics from all components
- **Grafana**: Visualizes performance metrics
- **Jaeger**: Provides distributed tracing
- **ELK Stack**: Centralizes logs for analysis

### Key Dashboards

- **API Gateway Dashboard**: Monitors Kong performance
- **Microservices Dashboard**: Monitors backend services
- **Database Dashboard**: Monitors PostgreSQL performance
- **Cache Dashboard**: Monitors Redis performance
- **Infrastructure Dashboard**: Monitors Kubernetes resources

## Best Practices

1. **Regular Performance Testing**: Run performance tests regularly to catch regressions
2. **Continuous Optimization**: Continuously optimize based on monitoring data
3. **Capacity Planning**: Plan for future growth and scale
4. **Performance Budgets**: Establish and enforce performance budgets
5. **Optimization Workflow**:
   - Measure current performance
   - Identify bottlenecks
   - Implement optimizations
   - Measure impact
   - Repeat

## References

- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Performance Optimization](https://redis.io/topics/optimization)
- [k6 Documentation](https://k6.io/docs/)
- [Kong Performance Tuning](https://docs.konghq.com/gateway/latest/production/sizing-guidelines/)
