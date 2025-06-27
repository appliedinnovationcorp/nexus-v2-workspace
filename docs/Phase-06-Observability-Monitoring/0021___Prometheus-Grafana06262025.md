Prometheus and Grafana have been configured in this codebase as part of the 
Observability Stack implementation. Here's what has been implemented:

### Prometheus Configuration
1. Helm Values:
   • Created comprehensive Prometheus configuration in 
/home/oss/Business/workspaces/nexus-v2-workspace/src/aic-website/infrastructure/helm/prometheus-values.yaml
   • Configured Prometheus server settings with replicas, retention period, and 
resource allocations
   • Set up storage using Longhorn persistent volumes
   • Added service monitor selectors and additional scrape configurations

2. Scrape Configurations:
   • Added specific scrape configurations for Kong API Gateway
   • Configured Kuma dataplane metrics collection
   • Set up service discovery for Kubernetes services

3. AlertManager:
   • Configured AlertManager with replication and storage
   • Set up routing rules for different alert severities
   • Added receivers for Slack and PagerDuty notifications

4. Service Annotations:
   • Added Prometheus annotations to service deployments (e.g., 
prometheus.io/scrape: "true")
   • Specified metrics paths and ports for scraping

### Grafana Configuration
1. Dashboards:
   • Included pre-configured dashboards for Kong, Kuma, and Kubernetes
   • Set up dashboard providers and data sources
   • Added dashboard sidecar for automatic discovery

2. Data Sources:
   • Configured Prometheus as the primary data source
   • Added Elasticsearch for log visualization
   • Set up Jaeger for distributed tracing visualization

3. Settings:
   • Configured high availability with multiple replicas
   • Set up persistent storage for dashboard configurations
   • Added resource requests and limits

4. Deployment:
   • Included in the core components deployment script at 
/home/oss/Business/workspaces/nexus-v2-workspace/src/aic-website/infrastructure/helm/deploy-core.sh
   • Configured as part of the kube-prometheus-stack Helm chart

The Prometheus and Grafana configuration provides comprehensive monitoring 
capabilities for the entire MACH architecture, including:
• Infrastructure metrics
• Service-level metrics
• API Gateway performance
• Service Mesh telemetry
• Custom application metrics

This observability setup enables real-time monitoring, alerting, and 
visualization of the system's health and performance.