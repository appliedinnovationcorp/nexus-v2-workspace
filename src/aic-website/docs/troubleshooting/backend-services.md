# Backend Services Troubleshooting

## Common Backend API Issues

### 1. Service Not Responding

#### Symptoms
- HTTP 503 Service Unavailable
- Connection timeouts
- No response from API endpoints

#### Diagnosis
```bash
# Check pod status
kubectl get pods -n backend-services

# Check service endpoints
kubectl get endpoints backend-api -n backend-services

# Test connectivity
kubectl exec -it <pod-name> -n backend-services -- curl http://localhost:8080/health
```

#### Solutions
```bash
# Restart deployment
kubectl rollout restart deployment/backend-api -n backend-services

# Check resource limits
kubectl describe pod <pod-name> -n backend-services

# Scale up replicas
kubectl scale deployment backend-api --replicas=3 -n backend-services

# Check service configuration
kubectl get service backend-api -n backend-services -o yaml
```

### 2. Database Connection Issues

#### Symptoms
- Database connection errors
- Query timeouts
- Connection pool exhaustion

#### Diagnosis
```bash
# Test database connectivity
kubectl exec -it <backend-pod> -n backend-services -- pg_isready -h postgresql -p 5432

# Check connection pool status
kubectl logs deployment/backend-api -n backend-services | grep -i "connection"

# Verify database credentials
kubectl get secret backend-db-secret -n backend-services -o yaml
```

#### Solutions
```bash
# Restart database connection
kubectl rollout restart deployment/backend-api -n backend-services

# Check database pod status
kubectl get pods -n storage | grep postgresql

# Increase connection pool size
# Update ConfigMap with larger pool settings

# Check database logs
kubectl logs deployment/postgresql -n storage
```

### 3. Authentication Failures

#### Symptoms
- HTTP 401 Unauthorized
- JWT token validation errors
- Session management issues

#### Diagnosis
```bash
# Check JWT token
curl -H "Authorization: Bearer <token>" http://api.aicorp.com/api/v1/user

# Verify JWT secret
kubectl get secret jwt-secret -n backend-services -o yaml

# Check authentication logs
kubectl logs deployment/backend-api -n backend-services | grep -i "auth"
```

#### Solutions
```bash
# Rotate JWT secret
kubectl create secret generic jwt-secret --from-literal=secret=<new-secret> -n backend-services

# Check token expiration
# Verify token TTL settings in ConfigMap

# Restart authentication service
kubectl rollout restart deployment/backend-api -n backend-services

# Verify CORS settings
kubectl get configmap backend-api-config -n backend-services -o yaml
```

### 4. API Rate Limiting Issues

#### Symptoms
- HTTP 429 Too Many Requests
- Rate limit exceeded errors
- Blocked requests

#### Diagnosis
```bash
# Check rate limit configuration
kubectl get configmap backend-api-config -n backend-services -o yaml | grep -A 10 rateLimit

# Monitor request rates
kubectl logs deployment/backend-api -n backend-services | grep -i "rate"

# Check Redis cache status
kubectl exec -it redis-0 -n storage -- redis-cli ping
```

#### Solutions
```bash
# Adjust rate limits
# Update ConfigMap with higher limits

# Clear rate limit cache
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHDB

# Scale backend services
kubectl scale deployment backend-api --replicas=5 -n backend-services

# Implement request queuing
# Add queue mechanism for high-traffic periods
```

### 5. Memory and CPU Issues

#### Symptoms
- Out of memory errors
- High CPU usage
- Pod restarts due to resource limits

#### Diagnosis
```bash
# Check resource usage
kubectl top pods -n backend-services

# Check resource limits
kubectl describe pod <pod-name> -n backend-services | grep -A 5 Limits

# Monitor memory usage
kubectl exec -it <pod-name> -n backend-services -- free -h
```

#### Solutions
```bash
# Increase resource limits
kubectl patch deployment backend-api -n backend-services -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend-api","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# Enable HPA
kubectl get hpa backend-api -n backend-services

# Check for memory leaks
kubectl logs deployment/backend-api -n backend-services | grep -i "memory"

# Optimize application code
# Review memory usage patterns
```

### 6. CQRS and Event Sourcing Issues

#### Symptoms
- Event processing delays
- Command/query inconsistencies
- Event store corruption

#### Diagnosis
```bash
# Check event bus status
kubectl logs deployment/backend-api -n backend-services | grep -i "event"

# Verify Kafka connectivity
kubectl exec -it kafka-0 -n messaging -- kafka-topics.sh --list --bootstrap-server localhost:9092

# Check event store health
kubectl exec -it <backend-pod> -n backend-services -- curl http://localhost:8080/events/health
```

#### Solutions
```bash
# Restart event processing
kubectl rollout restart deployment/backend-api -n backend-services

# Clear event cache
kubectl exec -it redis-0 -n storage -- redis-cli DEL "events:*"

# Rebuild read models
# Trigger read model reconstruction

# Check event ordering
# Verify event sequence numbers
```

### 7. Circuit Breaker Issues

#### Symptoms
- Circuit breaker open
- Cascading failures
- Service degradation

#### Diagnosis
```bash
# Check circuit breaker status
kubectl logs deployment/backend-api -n backend-services | grep -i "circuit"

# Monitor failure rates
curl http://backend-api:8080/metrics | grep circuit_breaker

# Check downstream services
kubectl get pods --all-namespaces | grep -v Running
```

#### Solutions
```bash
# Reset circuit breakers
kubectl exec -it <backend-pod> -n backend-services -- curl -X POST http://localhost:8080/circuit-breaker/reset

# Adjust circuit breaker thresholds
# Update ConfigMap with new thresholds

# Fix downstream services
kubectl get pods -n ai-services
kubectl get pods -n cms

# Implement fallback mechanisms
# Ensure graceful degradation
```

### 8. API Gateway Issues

#### Symptoms
- Kong gateway errors
- Routing failures
- Plugin configuration issues

#### Diagnosis
```bash
# Check Kong status
kubectl get pods -n api-gateway | grep kong

# Test Kong admin API
kubectl exec -it kong-<pod-id> -n api-gateway -- curl http://localhost:8001/status

# Check service registration
kubectl exec -it kong-<pod-id> -n api-gateway -- curl http://localhost:8001/services
```

#### Solutions
```bash
# Restart Kong
kubectl rollout restart deployment/kong -n api-gateway

# Reload Kong configuration
kubectl exec -it kong-<pod-id> -n api-gateway -- kong reload

# Check plugin configuration
kubectl get configmap kong-plugins -n api-gateway -o yaml

# Verify upstream services
kubectl exec -it kong-<pod-id> -n api-gateway -- curl http://backend-api.backend-services:80/health
```

### 9. Logging and Monitoring Issues

#### Symptoms
- Missing logs
- Metrics not collecting
- Alerting not working

#### Diagnosis
```bash
# Check log output
kubectl logs deployment/backend-api -n backend-services --tail=100

# Verify Prometheus scraping
curl http://prometheus:9090/api/v1/targets

# Check log forwarding
kubectl get pods -n observability | grep fluentd
```

#### Solutions
```bash
# Restart logging agents
kubectl rollout restart daemonset/fluentd -n observability

# Check log configuration
kubectl get configmap fluentd-config -n observability -o yaml

# Verify metrics endpoints
kubectl exec -it <backend-pod> -n backend-services -- curl http://localhost:8080/metrics

# Restart Prometheus
kubectl rollout restart deployment/prometheus -n observability
```

### 10. Data Consistency Issues

#### Symptoms
- Stale data in responses
- Cache inconsistencies
- Database synchronization issues

#### Diagnosis
```bash
# Check cache status
kubectl exec -it redis-0 -n storage -- redis-cli INFO

# Verify database replication
kubectl exec -it postgresql-primary-0 -n storage -- psql -c "SELECT * FROM pg_stat_replication;"

# Check data timestamps
kubectl logs deployment/backend-api -n backend-services | grep -i "cache"
```

#### Solutions
```bash
# Clear cache
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHALL

# Force cache refresh
kubectl exec -it <backend-pod> -n backend-services -- curl -X POST http://localhost:8080/cache/refresh

# Check database synchronization
kubectl exec -it postgresql-replica-0 -n storage -- psql -c "SELECT pg_last_wal_receive_lsn();"

# Restart cache layer
kubectl rollout restart deployment/redis -n storage
```

## Performance Optimization

### 1. Database Query Optimization

```bash
# Enable query logging
kubectl exec -it postgresql-0 -n storage -- psql -c "ALTER SYSTEM SET log_statement = 'all';"

# Analyze slow queries
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check index usage
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan;"
```

### 2. Caching Strategy

```bash
# Monitor cache hit rates
kubectl exec -it redis-0 -n storage -- redis-cli INFO stats | grep hit_rate

# Check cache memory usage
kubectl exec -it redis-0 -n storage -- redis-cli INFO memory

# Optimize cache TTL
# Update ConfigMap with optimal TTL values
```

### 3. Connection Pool Tuning

```bash
# Monitor connection pool
kubectl logs deployment/backend-api -n backend-services | grep -i "pool"

# Check active connections
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT count(*) FROM pg_stat_activity;"

# Optimize pool settings
# Update database configuration
```

## Health Checks and Monitoring

### Application Health Checks

```bash
# Test health endpoints
curl http://backend-api.backend-services:80/health
curl http://backend-api.backend-services:80/ready

# Check liveness probe
kubectl describe pod <pod-name> -n backend-services | grep -A 5 Liveness

# Check readiness probe
kubectl describe pod <pod-name> -n backend-services | grep -A 5 Readiness
```

### Metrics Collection

```bash
# Check metrics endpoint
curl http://backend-api.backend-services:80/metrics

# Verify Prometheus targets
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="backend-api")'

# Check custom metrics
curl http://prometheus:9090/api/v1/query?query=backend_api_requests_total
```

## Emergency Procedures

### Service Recovery

```bash
# Emergency restart
kubectl rollout restart deployment/backend-api -n backend-services

# Scale to zero and back
kubectl scale deployment backend-api --replicas=0 -n backend-services
kubectl scale deployment backend-api --replicas=3 -n backend-services

# Force pod recreation
kubectl delete pod -l app=backend-api -n backend-services
```

### Data Recovery

```bash
# Database backup restore
kubectl exec -it postgresql-0 -n storage -- pg_restore -d aic_production /backup/latest.dump

# Cache rebuild
kubectl exec -it <backend-pod> -n backend-services -- curl -X POST http://localhost:8080/cache/rebuild

# Event store recovery
kubectl exec -it <backend-pod> -n backend-services -- curl -X POST http://localhost:8080/events/rebuild
```

---

**Next**: [AI Services Issues](./ai-services.md)
