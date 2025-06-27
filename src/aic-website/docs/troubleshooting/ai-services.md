# AI Services Troubleshooting

## Common AI Service Issues

### 1. AI Provider Connectivity Issues

#### Symptoms
- OpenAI API connection failures
- Ollama service unreachable
- Provider timeout errors

#### Diagnosis
```bash
# Test OpenAI connectivity
kubectl exec -it <ai-pod> -n ai-services -- curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test Ollama connectivity
kubectl exec -it <ai-pod> -n ai-services -- curl http://ollama:11434/api/tags

# Check AI service logs
kubectl logs deployment/ai-services -n ai-services | grep -i "provider"
```

#### Solutions
```bash
# Verify API keys
kubectl get secret openai-secret -n ai-services -o yaml

# Check network policies
kubectl get networkpolicy -n ai-services

# Restart AI services
kubectl rollout restart deployment/ai-services -n ai-services

# Test provider fallback
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/ai/health
```

### 2. Model Inference Failures

#### Symptoms
- Model loading errors
- Inference timeouts
- Memory allocation failures

#### Diagnosis
```bash
# Check model status
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/models/status

# Monitor memory usage
kubectl top pods -n ai-services

# Check model logs
kubectl logs deployment/ai-services -n ai-services | grep -i "model"
```

#### Solutions
```bash
# Increase memory limits
kubectl patch deployment ai-services -n ai-services -p '{"spec":{"template":{"spec":{"containers":[{"name":"ai-services","resources":{"limits":{"memory":"4Gi"}}}]}}}}'

# Restart model loading
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/models/reload

# Clear model cache
kubectl exec -it redis-0 -n storage -- redis-cli DEL "models:*"

# Check GPU availability (if applicable)
kubectl describe node | grep -i gpu
```

### 3. Rate Limiting Issues

#### Symptoms
- HTTP 429 Too Many Requests
- Provider rate limit exceeded
- Token quota exhausted

#### Diagnosis
```bash
# Check rate limit status
kubectl logs deployment/ai-services -n ai-services | grep -i "rate"

# Monitor token usage
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/metrics | grep token_usage

# Check provider quotas
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/usage
```

#### Solutions
```bash
# Adjust rate limits
kubectl get configmap ai-services-config -n ai-services -o yaml

# Implement request queuing
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/queue/enable

# Switch to fallback provider
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/provider/fallback

# Scale AI services
kubectl scale deployment ai-services --replicas=5 -n ai-services
```

### 4. Cost Management Issues

#### Symptoms
- Unexpected high costs
- Budget alerts triggered
- Cost tracking failures

#### Diagnosis
```bash
# Check cost metrics
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/metrics | grep cost

# Review usage patterns
kubectl logs deployment/ai-services -n ai-services | grep -i "cost"

# Check budget configuration
kubectl get configmap ai-services-config -n ai-services -o yaml | grep -A 10 budget
```

#### Solutions
```bash
# Enable cost optimization
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/cost/optimize

# Set stricter budgets
# Update ConfigMap with lower budget limits

# Implement cost alerts
kubectl apply -f monitoring/cost-alerts.yaml

# Switch to cheaper models
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/models/switch-to-cheaper
```

### 5. Vector Store Issues

#### Symptoms
- Meilisearch connection failures
- Vector search errors
- Index corruption

#### Diagnosis
```bash
# Check Meilisearch status
kubectl exec -it meilisearch-0 -n storage -- curl http://localhost:7700/health

# Test vector search
kubectl exec -it <ai-pod> -n ai-services -- curl http://meilisearch:7700/indexes

# Check index status
kubectl exec -it meilisearch-0 -n storage -- curl http://localhost:7700/indexes/aic_documents/stats
```

#### Solutions
```bash
# Restart Meilisearch
kubectl rollout restart deployment/meilisearch -n storage

# Rebuild indexes
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/search/rebuild

# Clear corrupted indexes
kubectl exec -it meilisearch-0 -n storage -- curl -X DELETE http://localhost:7700/indexes/aic_documents

# Increase Meilisearch memory
kubectl patch deployment meilisearch -n storage -p '{"spec":{"template":{"spec":{"containers":[{"name":"meilisearch","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

### 6. Caching Issues

#### Symptoms
- Cache misses
- Stale cached responses
- Cache memory exhaustion

#### Diagnosis
```bash
# Check cache hit rates
kubectl exec -it redis-0 -n storage -- redis-cli INFO stats | grep hit_rate

# Monitor cache memory
kubectl exec -it redis-0 -n storage -- redis-cli INFO memory

# Check AI cache keys
kubectl exec -it redis-0 -n storage -- redis-cli KEYS "ai:*"
```

#### Solutions
```bash
# Clear AI cache
kubectl exec -it redis-0 -n storage -- redis-cli DEL "ai:*"

# Adjust cache TTL
kubectl get configmap ai-services-config -n ai-services -o yaml

# Increase cache memory
kubectl patch deployment redis -n storage -p '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"1Gi"}}}]}}}}'

# Optimize cache strategy
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/cache/optimize
```

### 7. Prompt Engineering Issues

#### Symptoms
- Inconsistent AI responses
- Poor response quality
- Prompt injection vulnerabilities

#### Diagnosis
```bash
# Check prompt templates
kubectl get configmap ai-services-config -n ai-services -o yaml | grep -A 20 prompts

# Review response quality metrics
kubectl logs deployment/ai-services -n ai-services | grep -i "quality"

# Test prompt variations
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/prompts/test
```

#### Solutions
```bash
# Update prompt templates
kubectl patch configmap ai-services-config -n ai-services --patch-file=prompts-update.yaml

# Enable prompt validation
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/prompts/validate

# Implement A/B testing
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/prompts/ab-test

# Restart AI services to reload prompts
kubectl rollout restart deployment/ai-services -n ai-services
```

### 8. Model Performance Issues

#### Symptoms
- Slow inference times
- High latency responses
- Model accuracy degradation

#### Diagnosis
```bash
# Check inference metrics
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/metrics | grep inference_time

# Monitor model performance
kubectl logs deployment/ai-services -n ai-services | grep -i "performance"

# Test model accuracy
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/models/test
```

#### Solutions
```bash
# Optimize model parameters
kubectl get configmap ai-services-config -n ai-services -o yaml

# Enable model caching
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/models/cache/enable

# Switch to faster models
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/models/switch-to-faster

# Scale inference workers
kubectl scale deployment ai-services --replicas=8 -n ai-services
```

### 9. Security and Compliance Issues

#### Symptoms
- Data privacy violations
- Unauthorized access to AI services
- Audit trail gaps

#### Diagnosis
```bash
# Check access logs
kubectl logs deployment/ai-services -n ai-services | grep -i "access"

# Verify authentication
kubectl exec -it <ai-pod> -n ai-services -- curl -H "Authorization: Bearer invalid" http://localhost:8080/ai/chat

# Check data sanitization
kubectl logs deployment/ai-services -n ai-services | grep -i "sanitize"
```

#### Solutions
```bash
# Enable audit logging
kubectl patch configmap ai-services-config -n ai-services --patch '{"data":{"audit-enabled":"true"}}'

# Implement data sanitization
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/security/sanitize/enable

# Rotate API keys
kubectl create secret generic openai-secret --from-literal=api-key=<new-key> -n ai-services

# Enable request filtering
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/security/filter/enable
```

### 10. Integration Issues

#### Symptoms
- Backend service integration failures
- API gateway routing issues
- Service mesh connectivity problems

#### Diagnosis
```bash
# Test service connectivity
kubectl exec -it <ai-pod> -n ai-services -- curl http://backend-api.backend-services:80/health

# Check service mesh status
kubectl get pods -n kuma-system

# Verify API gateway routing
kubectl exec -it kong-<pod> -n api-gateway -- curl http://localhost:8001/services/ai-services
```

#### Solutions
```bash
# Restart service mesh
kubectl rollout restart deployment/kuma-control-plane -n kuma-system

# Update API gateway routes
kubectl apply -f api-gateway/ai-services-routes.yaml

# Check network policies
kubectl get networkpolicy -n ai-services

# Test end-to-end connectivity
kubectl exec -it <backend-pod> -n backend-services -- curl http://ai-services.ai-services:80/health
```

## AI-Specific Monitoring

### Model Performance Metrics

```bash
# Check model accuracy
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/metrics | grep model_accuracy

# Monitor inference latency
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/metrics | grep inference_duration

# Track token usage
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/metrics | grep token_count
```

### Cost Monitoring

```bash
# Daily cost tracking
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/cost/daily

# Provider cost breakdown
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/cost/by-provider

# Budget utilization
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/cost/budget-status
```

### Quality Assurance

```bash
# Response quality metrics
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/quality/metrics

# A/B test results
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/ab-test/results

# User satisfaction scores
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/satisfaction/scores
```

## Emergency Procedures

### AI Service Recovery

```bash
# Emergency fallback to local models
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/emergency/local-only

# Disable expensive operations
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/emergency/cost-limit

# Enable degraded mode
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/emergency/degraded-mode
```

### Cost Control

```bash
# Emergency cost shutdown
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/emergency/cost-shutdown

# Switch to free tier only
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/emergency/free-tier-only

# Implement request throttling
kubectl exec -it <ai-pod> -n ai-services -- curl -X POST http://localhost:8080/emergency/throttle
```

## Best Practices

### Cost Optimization
- Monitor usage patterns regularly
- Implement intelligent caching
- Use appropriate model sizes
- Set up budget alerts
- Optimize prompt efficiency

### Performance Tuning
- Cache frequent requests
- Use model-specific optimizations
- Implement request batching
- Monitor inference latency
- Scale based on demand

### Security Measures
- Sanitize all inputs
- Implement rate limiting
- Use secure API keys
- Enable audit logging
- Monitor for abuse patterns

---

**Next**: [Infrastructure Issues](./infrastructure.md)
