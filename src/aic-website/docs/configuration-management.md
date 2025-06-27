# AIC Website Configuration Management

## Overview

The AIC Website platform uses a comprehensive configuration management system with environment-specific ConfigMaps, granular service configuration, and automated management tools.

## Configuration Architecture

### 1. Shared Configuration
- **File**: `infrastructure/kubernetes/config/shared-config.yaml`
- **Purpose**: Application-wide constants, feature flags, service discovery
- **Scope**: All namespaces and services

### 2. Environment-Specific Configuration
- **Development**: `infrastructure/kubernetes/config/development-config.yaml`
- **Staging**: `infrastructure/kubernetes/config/staging-config.yaml`
- **Production**: `infrastructure/kubernetes/config/production-config.yaml`

### 3. Service-Specific Configuration

#### Backend Services
- **Basic**: `infrastructure/kubernetes/services/backend/configmap.yaml`
- **Advanced**: `infrastructure/kubernetes/services/backend/advanced-configmap.yaml`
- **Features**: CQRS, Saga patterns, Circuit breakers, Performance tuning

#### AI Services
- **File**: `infrastructure/kubernetes/services/ai/ai-services-configmap.yaml`
- **Features**: Multi-provider AI, caching, rate limiting, cost tracking, model configuration

#### CMS (Ghost)
- **File**: `infrastructure/kubernetes/services/cms/ghost-configmap.yaml`
- **Features**: Performance optimization, caching, metrics for HPA

### 4. Specialized Configuration
- **Observability**: Prometheus, Grafana, alerting rules
- **Security**: Policies, CSP, encryption settings
- **Performance**: Caching strategies, connection pooling

## Configuration Features

### ✅ Completed Enhancements

1. **AI Services ConfigMap** - Complete configuration for AI providers, caching, and monitoring
2. **Ghost CMS HPA** - Horizontal Pod Autoscaler with custom metrics
3. **Environment-Specific Settings** - Development, staging, and production configurations
4. **Granular Configuration Management** - Service-specific and shared configurations
5. **Advanced Backend Configuration** - CQRS, Saga, Circuit breaker patterns
6. **Configuration Validation** - Automated validation and management scripts

### Configuration Hierarchy

```
Shared Config (Base)
├── Environment Config (Override)
│   ├── Development
│   ├── Staging
│   └── Production
└── Service Config (Specific)
    ├── Backend Services
    ├── AI Services
    ├── CMS
    ├── Observability
    └── Security
```

## Configuration Management

### Validation
```bash
./scripts/config-management.sh validate
```

### Apply Environment Configuration
```bash
# Apply development configuration
./scripts/config-management.sh apply development

# Apply production configuration
./scripts/config-management.sh apply production
```

### Backup ConfigMaps
```bash
./scripts/config-management.sh backup
```

### Compare Environments
```bash
./scripts/config-management.sh compare development production
```

### Restart Deployments
```bash
./scripts/config-management.sh restart production
```

## Environment Configurations

### Development Environment
- **Debug Mode**: Enabled
- **Logging**: Debug level
- **AI Services**: Local Ollama, mock responses
- **Database**: Local instances, query logging
- **Security**: Relaxed for development
- **Rate Limiting**: Disabled

### Staging Environment
- **Debug Mode**: Disabled
- **Logging**: Info level
- **AI Services**: Limited OpenAI, cost tracking
- **Database**: Staging clusters with SSL
- **Security**: Production-like
- **Rate Limiting**: Moderate limits
- **Monitoring**: Full observability

### Production Environment
- **Debug Mode**: Disabled
- **Logging**: Warn level
- **AI Services**: Full providers, budget limits
- **Database**: HA clusters, read replicas
- **Security**: Maximum security
- **Rate Limiting**: Strict limits
- **Monitoring**: Full observability with alerting

## Service Configuration Details

### AI Services Configuration

#### Providers
- **OpenAI**: GPT-4, embeddings, vision models
- **Ollama**: Local LLaMA, code models
- **Anthropic**: Claude models (optional)

#### Features
- **Fallback System**: Automatic provider switching
- **Caching**: Multi-level with Redis
- **Rate Limiting**: Token and request limits
- **Cost Tracking**: Budget monitoring and alerts
- **Performance Monitoring**: Latency and usage metrics

### Backend Services Configuration

#### CQRS Pattern
- **Command Bus**: Validation, authorization, logging
- **Query Bus**: Caching, performance optimization
- **Event Bus**: Kafka integration with topics
- **Event Store**: PostgreSQL with snapshots

#### Saga Orchestration
- **User Registration**: Multi-step workflow
- **Content Publication**: Complex publishing pipeline
- **Compensation**: Automatic rollback on failures

#### Circuit Breakers
- **Database**: Fast failure detection
- **AI Services**: Timeout and retry handling
- **External APIs**: Resilience patterns

### Ghost CMS Configuration

#### Performance
- **Clustering**: Multi-worker support
- **Caching**: Redis integration
- **CDN**: Asset optimization
- **Compression**: Response compression

#### Autoscaling (HPA)
- **CPU Scaling**: 60% threshold
- **Memory Scaling**: 70% threshold
- **Custom Metrics**: Requests per second
- **Scaling Behavior**: Controlled scale up/down

## Configuration Best Practices

### 1. Environment Separation
- Use environment-specific ConfigMaps
- Never share secrets between environments
- Validate configurations before deployment

### 2. Configuration Validation
- Always validate YAML syntax
- Check for required labels and metadata
- Test configuration changes in staging first

### 3. Version Control
- Track all configuration changes
- Use meaningful commit messages
- Review configuration changes

### 4. Security
- Store secrets separately from ConfigMaps
- Use least privilege access
- Encrypt sensitive configuration data

### 5. Monitoring
- Monitor configuration changes
- Set up alerts for configuration errors
- Track configuration drift

## Troubleshooting

### Common Issues

1. **ConfigMap Not Found**
   ```bash
   kubectl get configmaps -n <namespace>
   kubectl describe configmap <name> -n <namespace>
   ```

2. **Configuration Not Applied**
   ```bash
   kubectl rollout restart deployment/<name> -n <namespace>
   ```

3. **Invalid Configuration**
   ```bash
   ./scripts/config-management.sh validate
   ```

### Debugging Configuration

1. **Check ConfigMap Contents**
   ```bash
   kubectl get configmap <name> -n <namespace> -o yaml
   ```

2. **Verify Pod Configuration**
   ```bash
   kubectl exec -it <pod-name> -n <namespace> -- env | grep CONFIG
   ```

3. **Check Application Logs**
   ```bash
   kubectl logs <pod-name> -n <namespace> | grep -i config
   ```

## Configuration Schema

### Required Labels
```yaml
labels:
  app: <service-name>
  part-of: aic-website
  environment: <env-name>
  component: <component-type>
```

### Configuration Structure
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <service>-config
  namespace: <namespace>
  labels:
    # Required labels
data:
  # JSON configuration files
  app-config.json: |
    {
      # Application configuration
    }
  
  # Feature flags
  feature-flags.json: |
    {
      # Feature toggles
    }
  
  # Environment variables
  LOG_LEVEL: "info"
  DEBUG_MODE: "false"
```

## Integration with Deployment

### ConfigMap Volume Mounts
```yaml
volumes:
  - name: config
    configMap:
      name: <service>-config
      
volumeMounts:
  - name: config
    mountPath: /app/config
    readOnly: true
```

### Environment Variables
```yaml
env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: <service>-config
        key: LOG_LEVEL
```

This comprehensive configuration management system provides:
- ✅ **Environment-specific configurations**
- ✅ **Granular service configuration**
- ✅ **Automated validation and management**
- ✅ **Production-ready scaling (HPA)**
- ✅ **Advanced architectural patterns**
- ✅ **Complete observability integration**
