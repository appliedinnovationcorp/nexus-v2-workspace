# Jaeger Distributed Tracing

This directory contains comprehensive Jaeger distributed tracing configuration for the AIC Website project, providing end-to-end observability with service mesh integration.

## 📁 Files Overview

- **`jaeger-values.yaml`** - Comprehensive Helm chart values for Jaeger deployment
- **`jaeger-service-mesh-integration.yaml`** - Service mesh integration configurations
- **`deploy-jaeger.sh`** - Automated Jaeger deployment script
- **`README.md`** - This documentation file

## 🚀 Quick Start

### 1. Deploy Jaeger

```bash
# Set environment variables
export JAEGER_DOMAIN="jaeger.aicorp.com"
export JAEGER_NAMESPACE="observability"
export ELASTICSEARCH_URL="https://elasticsearch.observability.svc.cluster.local:9200"

# Deploy Jaeger with automated script
./deploy-jaeger.sh --domain $JAEGER_DOMAIN --elasticsearch $ELASTICSEARCH_URL
```

### 2. Configure Service Mesh Integration

```bash
# Apply service mesh integration
kubectl apply -f jaeger-service-mesh-integration.yaml
```

### 3. Access Jaeger UI

Navigate to `https://jaeger.aicorp.com` with the credentials provided during deployment.

## ⚙️ Configuration Details

### Production Deployment Strategy

The configuration uses a production-ready deployment with separate components:

#### Jaeger Agent (DaemonSet)
```yaml
agent:
  enabled: true
  strategy: DaemonSet
  resources:
    requests:
      memory: 128Mi
      cpu: 100m
    limits:
      memory: 256Mi
      cpu: 200m
```

#### Jaeger Collector (Deployment)
```yaml
collector:
  enabled: true
  replicaCount: 3
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 2Gi
      cpu: 1000m
  
  # Auto-scaling configuration
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
```

#### Jaeger Query (Deployment)
```yaml
query:
  enabled: true
  replicaCount: 2
  resources:
    requests:
      memory: 256Mi
      cpu: 200m
    limits:
      memory: 1Gi
      cpu: 500m
```

### Storage Configuration

#### Elasticsearch Storage (Production)
```yaml
storage:
  type: elasticsearch
  elasticsearch:
    host: elasticsearch.observability.svc.cluster.local
    port: 9200
    scheme: https
    user: jaeger
    password: jaeger-password
    
    # Index configuration
    indexPrefix: jaeger
    numShards: 3
    numReplicas: 1
    maxSpanAge: 72h0m0s
    
    # Performance tuning
    bulkSize: 5000000
    bulkWorkers: 1
    bulkActions: 1000
    bulkFlushInterval: 200ms
```

#### Memory Storage (Development)
```yaml
allInOne:
  enabled: true
  storage:
    type: memory
    memory:
      maxTraces: 50000
```

### Sampling Strategies

Comprehensive sampling configuration for different services:

```yaml
samplingConfig: |
  {
    "service_strategies": [
      {
        "service": "aic-website-frontend",
        "type": "probabilistic",
        "param": 0.5,
        "max_traces_per_second": 100,
        "operation_strategies": [
          {
            "operation": "GET /health",
            "type": "probabilistic",
            "param": 0.01
          },
          {
            "operation": "POST /api/auth/login",
            "type": "probabilistic",
            "param": 1.0
          }
        ]
      },
      {
        "service": "aic-website-api",
        "type": "probabilistic",
        "param": 0.8,
        "max_traces_per_second": 200
      }
    ],
    "default_strategy": {
      "type": "probabilistic",
      "param": 0.1,
      "max_traces_per_second": 50
    }
  }
```

### UI Configuration

Enhanced UI with custom menu and features:

```yaml
uiConfig: |
  {
    "monitor": {
      "menuEnabled": true
    },
    "dependencies": {
      "menuEnabled": true
    },
    "archiveEnabled": true,
    "menu": [
      {
        "label": "AIC Website Docs",
        "url": "https://docs.aicorp.com",
        "newWindow": true
      },
      {
        "label": "Grafana",
        "url": "https://grafana.aicorp.com",
        "newWindow": true
      }
    ],
    "criticalPathEnabled": true,
    "deepDependencies": {
      "menuEnabled": true
    }
  }
```

## 🕸️ Service Mesh Integration

### Istio Integration

#### Telemetry Configuration
```yaml
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: jaeger-tracing
  namespace: istio-system
spec:
  tracing:
  - providers:
      jaeger:
        service: jaeger-collector.observability.svc.cluster.local
        port: 14268
  - randomSamplingPercentage: 10.0
  - customTags:
      cluster_name:
        literal:
          value: "aic-website"
      environment:
        environment:
          name: ENVIRONMENT
          defaultValue: "production"
```

#### Extension Provider
```yaml
extensionProviders:
- name: jaeger
  envoyOtelAls:
    service: jaeger-collector.observability.svc.cluster.local
    port: 4317
- name: jaeger-http
  envoyHttpAls:
    service: jaeger-collector.observability.svc.cluster.local
    port: 14268
    path: "/api/traces"
```

### Linkerd Integration

#### TraceCollector Configuration
```yaml
apiVersion: linkerd.io/v1alpha2
kind: TraceCollector
metadata:
  name: jaeger
  namespace: linkerd
spec:
  collectorSvcAddr: jaeger-collector.observability.svc.cluster.local:14268
  collectorSvcAccount: jaeger
  samplingRate: 0.1
```

### Kong Integration

#### OpenTracing Plugin
```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jaeger-tracing
  namespace: kong
plugin: opentracing
config:
  http_endpoint: "http://jaeger-collector.observability.svc.cluster.local:14268/api/traces"
  sample_ratio: 0.1
  tags:
    cluster: "aic-website"
    environment: "production"
    gateway: "kong"
```

## 📊 OpenTelemetry Integration

### OpenTelemetry Collector

Comprehensive OTEL collector configuration for trace aggregation:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
      thrift_http:
        endpoint: 0.0.0.0:14268

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  resource:
    attributes:
    - key: cluster.name
      value: "aic-website"
      action: upsert
  probabilistic_sampler:
    sampling_percentage: 10.0

exporters:
  jaeger:
    endpoint: jaeger-collector.observability.svc.cluster.local:14250
```

## 🔧 Application Instrumentation

### Node.js Instrumentation

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://jaeger-collector.observability.svc.cluster.local:14268/api/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'aic-website',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
  }),
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Python Instrumentation

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Configure Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger-agent.observability.svc.cluster.local",
    agent_port=6831,
)

# Configure span processor
span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)
```

### Java Instrumentation

```properties
# OpenTelemetry Java Agent configuration
otel.service.name=aic-website
otel.service.version=1.0.0
otel.resource.attributes=deployment.environment=production,cluster.name=aic-website

# Jaeger exporter configuration
otel.exporter.jaeger.endpoint=http://jaeger-collector.observability.svc.cluster.local:14268/api/traces
otel.traces.sampler=parentbased_traceidratio
otel.traces.sampler.arg=0.1
```

## 🔒 Security Configuration

### Network Policies

Secure communication between Jaeger components and applications:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: jaeger-network-policy
  namespace: observability
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: jaeger
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow traffic from application namespaces
  - from:
    - namespaceSelector:
        matchLabels:
          name: aic-website-prod
    ports:
    - protocol: TCP
      port: 14250  # Collector gRPC
    - protocol: TCP
      port: 14268  # Collector HTTP
```

### TLS Configuration

End-to-end TLS encryption:

```yaml
# TLS certificates for Jaeger UI and Collector
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: jaeger-ui-tls
  namespace: observability
spec:
  secretName: jaeger-ui-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - jaeger.aicorp.com
```

### Authentication

Basic authentication for Jaeger UI:

```yaml
# Ingress with basic auth
annotations:
  nginx.ingress.kubernetes.io/auth-type: basic
  nginx.ingress.kubernetes.io/auth-secret: jaeger-basic-auth
  nginx.ingress.kubernetes.io/auth-realm: "Jaeger Authentication Required"
```

## 📊 Monitoring Integration

### Prometheus Metrics

ServiceMonitor configuration for Prometheus:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: jaeger-metrics
  namespace: observability
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: jaeger
  endpoints:
  - port: admin-http
    path: /metrics
    interval: 30s
```

### Key Metrics

Important Jaeger metrics to monitor:

- **jaeger_collector_spans_received_total**: Total spans received
- **jaeger_collector_spans_saved_total**: Total spans saved
- **jaeger_collector_queue_length**: Collector queue length
- **jaeger_query_requests_total**: Query service requests
- **jaeger_agent_spans_received_total**: Agent spans received

### Grafana Dashboards

Pre-configured dashboards for Jaeger monitoring:

1. **Jaeger Overview**: High-level metrics and health status
2. **Service Performance**: Service-specific trace analysis
3. **Error Analysis**: Error rate and failure patterns
4. **Dependency Graph**: Service dependency visualization

## 🚨 Alerting Rules

### Prometheus Alerting Rules

```yaml
groups:
- name: jaeger.rules
  rules:
  - alert: JaegerCollectorDown
    expr: up{job="jaeger-collector"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Jaeger collector is down"
      description: "Jaeger collector has been down for more than 5 minutes"

  - alert: JaegerHighErrorRate
    expr: rate(jaeger_collector_spans_rejected_total[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High Jaeger span rejection rate"
      description: "Jaeger is rejecting {{ $value }} spans per second"

  - alert: JaegerQueueFull
    expr: jaeger_collector_queue_length > 1000
    for: 1m
    labels:
      severity: warning
    annotations:
      summary: "Jaeger collector queue is full"
      description: "Jaeger collector queue length is {{ $value }}"
```

## 🔧 Performance Tuning

### Resource Optimization

#### Collector Tuning
```yaml
collector:
  cmdlineParams:
    collector.num-workers: 50
    collector.queue-size: 2000
    collector.grpc-server.max-message-size: 4194304
  
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 2Gi
      cpu: 1000m
```

#### Query Service Tuning
```yaml
query:
  cmdlineParams:
    query.max-clock-skew-adjustment: 0s
    query.bearer-token-propagation: true
  
  resources:
    requests:
      memory: 256Mi
      cpu: 200m
    limits:
      memory: 1Gi
      cpu: 500m
```

### Elasticsearch Optimization

#### Index Management
```yaml
elasticsearch:
  # Sharding and replication
  numShards: 3
  numReplicas: 1
  
  # Performance tuning
  bulkSize: 5000000
  bulkWorkers: 1
  bulkActions: 1000
  bulkFlushInterval: 200ms
  
  # Retention policy
  maxSpanAge: 72h0m0s
  maxNumSpans: 10000000
```

#### Index Templates
```json
{
  "index_patterns": ["jaeger-*"],
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "30s",
    "index.mapping.total_fields.limit": 2000
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Traces Not Appearing
**Symptoms**: No traces visible in Jaeger UI
**Solutions**:
```bash
# Check collector health
kubectl exec -n observability deployment/jaeger-collector -- wget -q -O- http://localhost:14269/health

# Check agent connectivity
kubectl logs -n observability daemonset/jaeger-agent

# Verify sampling configuration
kubectl get configmap jaeger-sampling-strategies -n observability -o yaml
```

#### 2. High Memory Usage
**Symptoms**: Jaeger components consuming excessive memory
**Solutions**:
```bash
# Check collector queue size
kubectl exec -n observability deployment/jaeger-collector -- wget -q -O- http://localhost:14269/metrics | grep queue

# Adjust batch processor settings
# Reduce batch size and increase flush interval

# Scale collector replicas
kubectl scale deployment jaeger-collector --replicas=5 -n observability
```

#### 3. Elasticsearch Connection Issues
**Symptoms**: Spans not being stored in Elasticsearch
**Solutions**:
```bash
# Check Elasticsearch connectivity
kubectl exec -n observability deployment/jaeger-collector -- curl -k https://elasticsearch.observability.svc.cluster.local:9200/_cluster/health

# Verify credentials
kubectl get secret jaeger-elasticsearch-credentials -n observability -o yaml

# Check Elasticsearch logs
kubectl logs -n observability statefulset/elasticsearch
```

### Debug Commands

```bash
# Check Jaeger components status
kubectl get pods -n observability -l app.kubernetes.io/name=jaeger

# View collector logs
kubectl logs -n observability deployment/jaeger-collector

# View query service logs
kubectl logs -n observability deployment/jaeger-query

# Check agent logs
kubectl logs -n observability daemonset/jaeger-agent

# Test trace ingestion
curl -X POST http://jaeger-collector.observability.svc.cluster.local:14268/api/traces \
  -H "Content-Type: application/json" \
  -d '{"data": [{"traceID": "test", "spans": []}]}'
```

## 📈 Scaling and High Availability

### Horizontal Scaling

#### Auto-scaling Configuration
```yaml
collector:
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
```

#### Manual Scaling
```bash
# Scale collector
kubectl scale deployment jaeger-collector --replicas=5 -n observability

# Scale query service
kubectl scale deployment jaeger-query --replicas=3 -n observability
```

### Load Balancing

#### Service Configuration
```yaml
service:
  type: ClusterIP
  sessionAffinity: None
  externalTrafficPolicy: Cluster
```

#### Ingress Load Balancing
```yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/upstream-hash-by: "$request_id"
    nginx.ingress.kubernetes.io/load-balance: "round_robin"
```

## 💰 Cost Optimization

### Storage Management
- Implement retention policies for old traces
- Use index lifecycle management in Elasticsearch
- Configure appropriate sampling rates
- Archive old traces to cheaper storage

### Resource Optimization
- Right-size resource requests and limits
- Use horizontal pod autoscaling
- Implement resource quotas
- Monitor and optimize sampling strategies

## 🎯 Best Practices

### Sampling Strategy
1. **Start Conservative**: Begin with low sampling rates (1-10%)
2. **Service-Specific**: Configure different rates per service
3. **Operation-Specific**: Sample critical operations at 100%
4. **Health Checks**: Sample health checks at very low rates (0.01%)

### Instrumentation
1. **Automatic Instrumentation**: Use auto-instrumentation when possible
2. **Custom Spans**: Add custom spans for business logic
3. **Span Attributes**: Include relevant metadata
4. **Error Handling**: Properly mark error spans

### Performance
1. **Batch Processing**: Use batch span processors
2. **Async Export**: Export spans asynchronously
3. **Resource Limits**: Set appropriate resource limits
4. **Queue Management**: Monitor and tune queue sizes

---

## 🎯 Quick Reference

### Key Commands
```bash
# Deploy Jaeger
./deploy-jaeger.sh --domain jaeger.example.com

# Check Jaeger status
kubectl get pods -n observability -l app.kubernetes.io/name=jaeger

# View traces
curl -s "http://jaeger-query.observability.svc.cluster.local:16686/api/traces?service=aic-website"

# Test trace ingestion
curl -X POST http://jaeger-collector.observability.svc.cluster.local:14268/api/traces
```

### Important URLs
- **Jaeger UI**: https://jaeger.aicorp.com
- **Collector API**: https://jaeger-collector.aicorp.com
- **Health Check**: http://jaeger-collector.observability.svc.cluster.local:14269/health

### Integration Endpoints
- **Collector gRPC**: jaeger-collector.observability.svc.cluster.local:14250
- **Collector HTTP**: jaeger-collector.observability.svc.cluster.local:14268
- **Agent Compact**: jaeger-agent.observability.svc.cluster.local:6831
- **OTLP gRPC**: jaeger-collector.observability.svc.cluster.local:4317

---

**Next Steps**: After Jaeger setup is complete, proceed to instrument applications and configure service mesh tracing integration.
