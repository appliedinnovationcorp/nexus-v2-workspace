# Production Deployment Guide

This guide outlines the steps to deploy the AIC API Gateway with Kong and Kuma in a production environment.

## Deployment Options

There are several options for deploying Kong and Kuma in production:

1. **Kubernetes Deployment** (Recommended)
2. **VM-based Deployment**
3. **Hybrid Deployment** (Kong on VMs, Kuma on Kubernetes)

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-managed)
- Helm 3+
- kubectl configured to access your cluster

### Step 1: Install Kong using Helm

```bash
# Add the Kong Helm repository
helm repo add kong https://charts.konghq.com
helm repo update

# Create namespace
kubectl create namespace kong

# Install Kong
helm install kong kong/kong -n kong \
  --set ingressController.installCRDs=false \
  --values kong-values.yaml
```

Example `kong-values.yaml`:

```yaml
env:
  database: "postgres"
  pg_host: "kong-database"
  pg_user: "kong"
  pg_password: "kong-password"

admin:
  enabled: true
  http:
    enabled: true
    servicePort: 8001
    containerPort: 8001
  tls:
    enabled: true
    servicePort: 8444
    containerPort: 8444

proxy:
  enabled: true
  type: LoadBalancer
  http:
    enabled: true
    servicePort: 80
    containerPort: 8000
  tls:
    enabled: true
    servicePort: 443
    containerPort: 8443

enterprise:
  enabled: false

postgresql:
  enabled: true
  postgresqlUsername: kong
  postgresqlPassword: kong-password
  postgresqlDatabase: kong
  service:
    port: 5432
```

### Step 2: Install Kuma using Helm

```bash
# Add the Kuma Helm repository
helm repo add kuma https://kumahq.github.io/charts
helm repo update

# Create namespace
kubectl create namespace kuma-system

# Install Kuma
helm install kuma kuma/kuma -n kuma-system \
  --values kuma-values.yaml
```

Example `kuma-values.yaml`:

```yaml
controlPlane:
  mode: standalone
  replicas: 3
  service:
    type: LoadBalancer
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

ingress:
  enabled: true

metrics:
  enabled: true
  prometheus:
    enabled: true

tracing:
  enabled: true
  zipkin:
    url: http://zipkin:9411/api/v2/spans
```

### Step 3: Configure Kong and Kuma Integration

1. Apply Kong configuration:

```bash
kubectl apply -f kong-config.yaml
```

2. Apply Kuma policies:

```bash
kubectl apply -f kuma-policies/
```

## VM-based Deployment

### Prerequisites

- Linux VMs (Ubuntu 20.04+ recommended)
- Docker and Docker Compose

### Step 1: Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/your-org/aic-api-gateway.git
cd aic-api-gateway
```

### Step 3: Configure Environment Variables

Create a `.env` file with production settings:

```
KONG_PG_PASSWORD=strong-password
KONG_ADMIN_PASSWORD=strong-admin-password
```

### Step 4: Deploy with Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

### TLS Configuration

1. **Enable HTTPS**: Configure TLS for all services
2. **Use Let's Encrypt**: Automatically provision certificates
3. **Configure Strong Ciphers**: Use modern, secure cipher suites

### Authentication and Authorization

1. **API Keys**: Use API keys for service-to-service communication
2. **JWT**: Use JWT for user authentication
3. **OAuth2**: Consider OAuth2 for more complex scenarios
4. **Rate Limiting**: Implement rate limiting to prevent abuse

### Network Security

1. **Network Policies**: Restrict communication between services
2. **mTLS**: Enable mutual TLS for all service-to-service communication
3. **IP Restrictions**: Limit admin access to trusted IPs

## Monitoring and Observability

### Prometheus and Grafana

1. Deploy Prometheus for metrics collection
2. Deploy Grafana for visualization
3. Import Kong and Kuma dashboards

### Logging

1. Configure centralized logging with ELK or similar
2. Set up log rotation and retention policies

### Alerting

1. Configure alerts for critical metrics
2. Set up on-call rotation and incident response

## Backup and Disaster Recovery

### Database Backups

1. Schedule regular backups of Kong's PostgreSQL database
2. Test restoration procedures

### Configuration Backups

1. Store Kong and Kuma configurations in version control
2. Implement GitOps workflows for configuration changes

## Scaling Considerations

### Horizontal Scaling

1. Deploy multiple Kong instances behind a load balancer
2. Use Kubernetes HPA for automatic scaling

### Database Scaling

1. Consider PostgreSQL replication for high availability
2. Implement connection pooling

## Upgrade Procedures

### Kong Upgrades

1. Always backup before upgrading
2. Follow Kong's version-specific upgrade notes
3. Consider blue-green deployments for zero downtime

### Kuma Upgrades

1. Follow Kuma's upgrade documentation
2. Test upgrades in a staging environment first
