# Configuration Issues Troubleshooting

## ConfigMap Issues

### 1. ConfigMap Not Found

#### Symptoms
- Pod startup failures
- Configuration not loading
- Environment variables missing

#### Diagnosis
```bash
# Check if ConfigMap exists
kubectl get configmap <configmap-name> -n <namespace>

# List all ConfigMaps in namespace
kubectl get configmaps -n <namespace>

# Check pod configuration
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 "Mounts:"

# Check deployment configuration
kubectl get deployment <deployment-name> -n <namespace> -o yaml | grep -A 10 configMap
```

#### Solutions
```bash
# Create missing ConfigMap
kubectl apply -f infrastructure/kubernetes/config/

# Validate ConfigMap creation
./scripts/config-management.sh validate

# Check ConfigMap content
kubectl get configmap <configmap-name> -n <namespace> -o yaml

# Restart deployment to pick up ConfigMap
kubectl rollout restart deployment/<deployment-name> -n <namespace>
```

### 2. ConfigMap Content Issues

#### Symptoms
- Invalid JSON/YAML in ConfigMap
- Configuration parsing errors
- Application startup failures

#### Diagnosis
```bash
# Check ConfigMap content
kubectl get configmap <configmap-name> -n <namespace> -o yaml

# Validate JSON content
kubectl get configmap <configmap-name> -n <namespace> -o jsonpath='{.data.app-config\.json}' | jq .

# Check application logs for parsing errors
kubectl logs deployment/<deployment-name> -n <namespace> | grep -i "config\|parse"

# Test configuration loading
kubectl exec -it <pod-name> -n <namespace> -- cat /app/config/app-config.json
```

#### Solutions
```bash
# Fix JSON syntax
kubectl patch configmap <configmap-name> -n <namespace> --patch-file=config-fix.yaml

# Validate configuration before applying
./scripts/config-management.sh validate

# Update ConfigMap with correct content
kubectl create configmap <configmap-name> --from-file=config.json --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to reload configuration
kubectl rollout restart deployment/<deployment-name> -n <namespace>
```

### 3. Environment-Specific Configuration Issues

#### Symptoms
- Wrong configuration for environment
- Development config in production
- Missing environment variables

#### Diagnosis
```bash
# Check current environment
kubectl get configmap shared-config -n backend-services -o yaml | grep environment

# Compare configurations between environments
./scripts/config-management.sh compare development production

# Check environment-specific ConfigMaps
kubectl get configmaps -n <namespace> | grep -E "development|staging|production"

# Verify environment variables in pods
kubectl exec -it <pod-name> -n <namespace> -- env | grep -E "ENV|ENVIRONMENT"
```

#### Solutions
```bash
# Apply correct environment configuration
./scripts/config-management.sh apply production

# Update environment-specific settings
kubectl patch configmap production-config -n <namespace> --patch-file=prod-updates.yaml

# Verify configuration deployment
kubectl get configmap production-config -n <namespace> -o yaml

# Restart services with new configuration
./scripts/config-management.sh restart production
```

## Secret Management Issues

### 1. Secret Not Found

#### Symptoms
- Authentication failures
- API key errors
- Database connection failures

#### Diagnosis
```bash
# Check if secret exists
kubectl get secret <secret-name> -n <namespace>

# List all secrets in namespace
kubectl get secrets -n <namespace>

# Check secret usage in deployments
kubectl get deployment <deployment-name> -n <namespace> -o yaml | grep -A 5 secretKeyRef

# Check pod events for secret errors
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 Events
```

#### Solutions
```bash
# Create missing secret
kubectl create secret generic <secret-name> \
  --from-literal=api-key=<value> \
  --from-literal=db-password=<value> \
  -n <namespace>

# Create secret from file
kubectl create secret generic <secret-name> --from-file=config.json -n <namespace>

# Update deployment to use secret
kubectl patch deployment <deployment-name> -n <namespace> --patch-file=secret-patch.yaml

# Verify secret creation
kubectl get secret <secret-name> -n <namespace> -o yaml
```

### 2. Secret Content Issues

#### Symptoms
- Invalid credentials
- Base64 encoding issues
- Corrupted secret data

#### Diagnosis
```bash
# Check secret content (be careful with sensitive data)
kubectl get secret <secret-name> -n <namespace> -o yaml

# Decode secret values
kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.api-key}' | base64 -d

# Test credentials
kubectl exec -it <pod-name> -n <namespace> -- curl -H "Authorization: Bearer $(kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.api-key}' | base64 -d)" https://api.example.com

# Check secret usage in application
kubectl logs deployment/<deployment-name> -n <namespace> | grep -i "auth\|credential"
```

#### Solutions
```bash
# Update secret with correct values
kubectl patch secret <secret-name> -n <namespace> -p '{"data":{"api-key":"'$(echo -n "new-api-key" | base64)'"}}'

# Recreate secret
kubectl delete secret <secret-name> -n <namespace>
kubectl create secret generic <secret-name> --from-literal=api-key=<new-value> -n <namespace>

# Restart pods to pick up new secret
kubectl rollout restart deployment/<deployment-name> -n <namespace>

# Verify secret update
kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.api-key}' | base64 -d
```

### 3. Secret Rotation Issues

#### Symptoms
- Expired certificates
- Rotated API keys not updated
- Authentication intermittently failing

#### Diagnosis
```bash
# Check certificate expiration
kubectl get secret <tls-secret> -n <namespace> -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -dates

# Check secret age
kubectl get secret <secret-name> -n <namespace> -o yaml | grep creationTimestamp

# Monitor authentication failures
kubectl logs deployment/<deployment-name> -n <namespace> | grep -i "401\|unauthorized\|expired"

# Check external service status
curl -H "Authorization: Bearer $(kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.api-key}' | base64 -d)" https://api.example.com/status
```

#### Solutions
```bash
# Rotate API keys
kubectl patch secret <secret-name> -n <namespace> -p '{"data":{"api-key":"'$(echo -n "new-rotated-key" | base64)'"}}'

# Update TLS certificates
kubectl create secret tls <tls-secret> --cert=new-cert.pem --key=new-key.pem -n <namespace> --dry-run=client -o yaml | kubectl apply -f -

# Implement automatic rotation
kubectl apply -f cert-manager/certificate.yaml

# Restart all services using the secret
kubectl get deployment -n <namespace> -o name | xargs -I {} kubectl rollout restart {} -n <namespace>
```

## Feature Flag Issues

### 1. Feature Flag Not Working

#### Symptoms
- Features not enabling/disabling
- Inconsistent behavior across instances
- Feature flag configuration ignored

#### Diagnosis
```bash
# Check feature flag configuration
kubectl get configmap shared-config -n backend-services -o yaml | grep -A 20 feature-flags

# Check application logs for feature flag loading
kubectl logs deployment/<deployment-name> -n <namespace> | grep -i "feature\|flag"

# Test feature flag endpoint
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/features

# Check feature flag cache
kubectl exec -it redis-0 -n storage -- redis-cli KEYS "features:*"
```

#### Solutions
```bash
# Update feature flags
kubectl patch configmap shared-config -n backend-services -p '{"data":{"feature-flags.json":"{\"enableAI\":true,\"enableAnalytics\":false}"}}'

# Clear feature flag cache
kubectl exec -it redis-0 -n storage -- redis-cli DEL "features:*"

# Restart services to reload feature flags
kubectl rollout restart deployment/<deployment-name> -n <namespace>

# Verify feature flag update
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/features | jq .
```

### 2. Feature Flag Synchronization Issues

#### Symptoms
- Different feature states across pods
- Feature flags not updating in real-time
- Inconsistent user experience

#### Diagnosis
```bash
# Check feature flag consistency across pods
kubectl get pods -n <namespace> -l app=<app-name> -o name | xargs -I {} kubectl exec {} -n <namespace> -- curl -s http://localhost:8080/features

# Check feature flag cache synchronization
kubectl exec -it redis-0 -n storage -- redis-cli GET "features:cache:timestamp"

# Monitor feature flag updates
kubectl logs deployment/<deployment-name> -n <namespace> -f | grep -i "feature.*update"

# Check configuration reload mechanism
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/config/reload
```

#### Solutions
```bash
# Force feature flag synchronization
kubectl exec -it <pod-name> -n <namespace> -- curl -X POST http://localhost:8080/features/sync

# Implement real-time feature flag updates
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"realtime-features":"true"}}'

# Clear and rebuild feature flag cache
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHDB
kubectl rollout restart deployment/<deployment-name> -n <namespace>

# Enable feature flag webhooks
kubectl apply -f feature-flags/webhook-config.yaml
```

## Application Configuration Issues

### 1. Database Configuration Problems

#### Symptoms
- Database connection failures
- Connection pool exhaustion
- Query timeout errors

#### Diagnosis
```bash
# Check database configuration
kubectl get configmap backend-api-config -n backend-services -o yaml | grep -A 20 database

# Test database connectivity
kubectl exec -it <app-pod> -n <namespace> -- pg_isready -h <db-host> -p <db-port>

# Check connection pool status
kubectl logs deployment/<deployment-name> -n <namespace> | grep -i "pool\|connection"

# Monitor database connections
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

#### Solutions
```bash
# Update database configuration
kubectl patch configmap backend-api-config -n backend-services --patch-file=db-config-update.yaml

# Increase connection pool size
kubectl patch configmap backend-api-config -n backend-services -p '{"data":{"database-config.json":"{\"poolSize\":20,\"connectionTimeout\":10000}"}}'

# Restart application with new database config
kubectl rollout restart deployment/backend-api -n backend-services

# Verify database configuration
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/health/database
```

### 2. API Configuration Issues

#### Symptoms
- CORS errors
- Rate limiting not working
- Authentication configuration problems

#### Diagnosis
```bash
# Check API configuration
kubectl get configmap backend-api-config -n backend-services -o yaml | grep -A 30 api-config

# Test CORS configuration
curl -H "Origin: https://example.com" -H "Access-Control-Request-Method: POST" -X OPTIONS http://api.aicorp.com/api/v1/test

# Check rate limiting
kubectl logs deployment/backend-api -n backend-services | grep -i "rate\|limit"

# Test authentication
curl -H "Authorization: Bearer invalid-token" http://api.aicorp.com/api/v1/protected
```

#### Solutions
```bash
# Update CORS configuration
kubectl patch configmap backend-api-config -n backend-services --patch '{"data":{"api-config.json":"{\"cors\":{\"allowedOrigins\":[\"https://aicorp.com\",\"https://www.aicorp.com\"]}}"}}'

# Fix rate limiting configuration
kubectl patch configmap backend-api-config -n backend-services --patch '{"data":{"api-config.json":"{\"rateLimit\":{\"enabled\":true,\"max\":100,\"windowMs\":900000}}"}}'

# Update authentication settings
kubectl patch configmap backend-api-config -n backend-services --patch-file=auth-config-update.yaml

# Restart API service
kubectl rollout restart deployment/backend-api -n backend-services
```

### 3. AI Services Configuration Issues

#### Symptoms
- AI provider connection failures
- Model loading errors
- Cost tracking not working

#### Diagnosis
```bash
# Check AI services configuration
kubectl get configmap ai-services-config -n ai-services -o yaml | grep -A 50 ai-config

# Test AI provider connectivity
kubectl exec -it <ai-pod> -n ai-services -- curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check model configuration
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/models/status

# Check cost tracking
kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/cost/status
```

#### Solutions
```bash
# Update AI provider configuration
kubectl patch configmap ai-services-config -n ai-services --patch-file=ai-provider-update.yaml

# Fix model configuration
kubectl patch configmap ai-services-config -n ai-services -p '{"data":{"model-config.json":"{\"chat\":{\"primary\":\"gpt-4-turbo-preview\",\"fallback\":\"llama3:8b\"}}"}}'

# Enable cost tracking
kubectl patch configmap ai-services-config -n ai-services -p '{"data":{"app-config.json":"{\"monitoring\":{\"trackCosts\":true,\"budgetLimits\":{\"daily\":100}}}"}}'

# Restart AI services
kubectl rollout restart deployment/ai-services -n ai-services
```

## Configuration Validation and Testing

### 1. Configuration Validation

```bash
# Validate all configurations
./scripts/config-management.sh validate

# Check YAML syntax
find infrastructure/kubernetes/config -name "*.yaml" -exec yamllint {} \;

# Validate JSON content in ConfigMaps
kubectl get configmap <configmap-name> -n <namespace> -o jsonpath='{.data.*}' | jq .

# Test configuration loading
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/config/validate
```

### 2. Configuration Testing

```bash
# Test database configuration
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/health/database

# Test external service connectivity
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/health/external

# Test feature flags
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/features/test

# Test authentication configuration
kubectl exec -it <app-pod> -n <namespace> -- curl -H "Authorization: Bearer test-token" http://localhost:8080/auth/test
```

### 3. Configuration Monitoring

```bash
# Monitor configuration changes
kubectl get events --field-selector reason=ConfigMapUpdated --all-namespaces

# Check configuration reload status
kubectl logs deployment/<deployment-name> -n <namespace> | grep -i "config.*reload"

# Monitor application health after config changes
kubectl get pods -n <namespace> --watch

# Check configuration-related metrics
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/metrics | grep config
```

## Emergency Configuration Recovery

### 1. Configuration Rollback

```bash
# Backup current configuration
./scripts/config-management.sh backup

# Rollback to previous configuration
kubectl rollout undo deployment/<deployment-name> -n <namespace>

# Restore from backup
kubectl apply -f backups/configmaps/latest/

# Verify rollback
kubectl get configmap <configmap-name> -n <namespace> -o yaml
```

### 2. Emergency Configuration Reset

```bash
# Reset to default configuration
kubectl delete configmap <configmap-name> -n <namespace>
kubectl apply -f infrastructure/kubernetes/config/development-config.yaml

# Clear configuration cache
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHDB

# Restart all affected services
kubectl rollout restart deployment --all -n <namespace>

# Verify system recovery
kubectl get pods -n <namespace>
```

### 3. Configuration Disaster Recovery

```bash
# Restore from Git repository
git checkout HEAD~1 -- infrastructure/kubernetes/config/
kubectl apply -f infrastructure/kubernetes/config/

# Rebuild configuration from templates
./scripts/config-management.sh generate --environment=production

# Verify configuration integrity
./scripts/config-management.sh validate

# Test system functionality
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/health
```

---

**Next**: [Monitoring Issues](./monitoring-issues.md)
