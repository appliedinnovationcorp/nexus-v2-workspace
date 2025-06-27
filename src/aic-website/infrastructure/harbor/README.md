# Harbor Container Registry

This directory contains all the necessary files and scripts to set up and configure Harbor as the container registry for the AIC Website project.

## 📁 Files Overview

- **`harbor-values.yaml`** - Comprehensive Helm values for Harbor deployment
- **`deploy-harbor.sh`** - Automated Harbor deployment script
- **`configure-harbor-gitlab.sh`** - GitLab CI integration configuration script
- **`test-harbor-integration.sh`** - Harbor integration testing script
- **`harbor-setup.md`** - Detailed Harbor setup documentation
- **`README.md`** - This overview file

## 🚀 Quick Start

### 1. Deploy Harbor

```bash
# Set environment variables
export HARBOR_DOMAIN="harbor.aicorp.com"
export HARBOR_ADMIN_PASSWORD="YourSecurePassword123"
export HARBOR_NAMESPACE="harbor-system"

# Deploy Harbor with automated script
./deploy-harbor.sh --domain $HARBOR_DOMAIN --password $HARBOR_ADMIN_PASSWORD
```

### 2. Configure GitLab Integration

```bash
# Set GitLab credentials
export GITLAB_PROJECT_ID=12345
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
export HARBOR_URL="https://harbor.aicorp.com"

# Configure GitLab integration
./configure-harbor-gitlab.sh
```

### 3. Test Integration

```bash
# Set Harbor credentials (from robot account)
export HARBOR_USERNAME="robot\$gitlab-ci"
export HARBOR_PASSWORD="your-robot-password"

# Run integration tests
./test-harbor-integration.sh
```

## 📋 Prerequisites

### Infrastructure
- Kubernetes cluster (v1.20+)
- Helm 3.x installed
- kubectl configured
- Ingress controller (NGINX)
- cert-manager for TLS
- Persistent storage (100GB+)

### DNS & Certificates
- DNS records for `harbor.aicorp.com` and `notary.aicorp.com`
- Valid SSL certificates (Let's Encrypt recommended)

### Access Requirements
- Kubernetes cluster admin access
- GitLab project maintainer access
- Domain management access

## 🛠️ Installation Methods

### Method 1: Automated Installation (Recommended)

The `deploy-harbor.sh` script provides complete automation:

```bash
# Basic deployment
./deploy-harbor.sh

# Custom configuration
./deploy-harbor.sh \
  --domain harbor.example.com \
  --password MySecurePassword123 \
  --namespace harbor-system \
  --storage-class gp3

# Skip certain steps
./deploy-harbor.sh --skip-tls --skip-projects --skip-robot
```

**Features:**
- Prerequisites validation
- Namespace and secret creation
- TLS certificate setup
- Harbor deployment with Helm
- Project and robot account creation
- Health checks and validation

### Method 2: Manual Helm Installation

```bash
# Add Harbor Helm repository
helm repo add harbor https://helm.goharbor.io
helm repo update

# Create namespace
kubectl create namespace harbor-system

# Deploy with custom values
helm install harbor harbor/harbor \
  --namespace harbor-system \
  --values harbor-values.yaml \
  --version 1.13.0 \
  --wait \
  --timeout 15m
```

## ⚙️ Configuration

### Core Settings

The `harbor-values.yaml` file includes:

#### Ingress with TLS
```yaml
expose:
  type: ingress
  tls:
    enabled: true
    certSource: secret
  ingress:
    hosts:
      core: harbor.aicorp.com
      notary: notary.aicorp.com
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

#### High Availability
```yaml
core:
  replicas: 2
registry:
  replicas: 2
jobservice:
  replicas: 2
portal:
  replicas: 2
```

#### Security Features
```yaml
trivy:
  enabled: true
  vulnType: "os,library"
  severity: "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL"

notary:
  enabled: true
  server:
    replicas: 1
  signer:
    replicas: 1
```

#### Persistent Storage
```yaml
persistence:
  enabled: true
  persistentVolumeClaim:
    registry:
      storageClass: "gp3"
      size: 100Gi
    database:
      storageClass: "gp3"
      size: 20Gi
```

### Environment-Specific Configurations

#### Development
- Single replica for all components
- Smaller storage allocations
- Self-signed certificates acceptable
- Basic resource limits

#### Staging
- 2 replicas for core components
- Production-like storage
- Valid SSL certificates
- Moderate resource limits

#### Production
- High availability (2+ replicas)
- Large storage allocations
- Enterprise SSL certificates
- Optimized resource limits
- Backup and monitoring

## 🔗 GitLab CI Integration

### Automated Integration

The `configure-harbor-gitlab.sh` script provides:

1. **Harbor Project Creation**
   - Creates `aic-website` project
   - Configures security policies
   - Enables vulnerability scanning

2. **Robot Account Setup**
   - Creates `gitlab-ci` robot account
   - Sets appropriate permissions
   - Generates access credentials

3. **GitLab Variable Configuration**
   - Sets `HARBOR_REGISTRY_URL`
   - Sets `HARBOR_PROJECT`
   - Sets `HARBOR_USERNAME` (robot account)
   - Sets `HARBOR_PASSWORD` (robot secret)

4. **Webhook Configuration**
   - Creates Harbor webhooks
   - Triggers GitLab pipelines on events
   - Enables automated workflows

### Manual Integration Steps

#### 1. Create Harbor Project
```bash
curl -X POST "https://harbor.aicorp.com/api/v2.0/projects" \
  -H "Content-Type: application/json" \
  -u "admin:password" \
  -d '{
    "project_name": "aic-website",
    "metadata": {
      "public": "false",
      "enable_content_trust": "true",
      "prevent_vul": "true",
      "severity": "high",
      "auto_scan": "true"
    }
  }'
```

#### 2. Create Robot Account
```bash
curl -X POST "https://harbor.aicorp.com/api/v2.0/projects/1/robots" \
  -H "Content-Type: application/json" \
  -u "admin:password" \
  -d '{
    "name": "gitlab-ci",
    "description": "Robot account for GitLab CI",
    "duration": -1,
    "permissions": [
      {
        "kind": "project",
        "namespace": "aic-website",
        "access": [
          {"resource": "repository", "action": "push"},
          {"resource": "repository", "action": "pull"},
          {"resource": "artifact", "action": "delete"},
          {"resource": "scan", "action": "create"}
        ]
      }
    ]
  }'
```

#### 3. Configure GitLab Variables
Add these variables in GitLab (Settings > CI/CD > Variables):

| Variable | Value | Protected | Masked |
|----------|-------|-----------|--------|
| `HARBOR_REGISTRY_URL` | `harbor.aicorp.com` | ✅ | ❌ |
| `HARBOR_PROJECT` | `aic-website` | ✅ | ❌ |
| `HARBOR_USERNAME` | `robot$gitlab-ci` | ✅ | ✅ |
| `HARBOR_PASSWORD` | `<robot-secret>` | ✅ | ✅ |

#### 4. Update GitLab CI Pipeline
```yaml
variables:
  DOCKER_REGISTRY: $HARBOR_REGISTRY_URL
  DOCKER_IMAGE: $HARBOR_REGISTRY_URL/$HARBOR_PROJECT/aic-website

build:
  stage: build
  before_script:
    - docker login -u $HARBOR_USERNAME -p $HARBOR_PASSWORD $HARBOR_REGISTRY_URL
  script:
    - docker build -t $DOCKER_IMAGE:$CI_COMMIT_SHA .
    - docker build -t $DOCKER_IMAGE:latest .
    - docker push $DOCKER_IMAGE:$CI_COMMIT_SHA
    - docker push $DOCKER_IMAGE:latest
  after_script:
    - docker logout $HARBOR_REGISTRY_URL
```

## 🧪 Testing

### Automated Testing

Use the `test-harbor-integration.sh` script for comprehensive testing:

```bash
# Set credentials
export HARBOR_USERNAME="robot\$gitlab-ci"
export HARBOR_PASSWORD="your-robot-password"

# Run all tests
./test-harbor-integration.sh

# Run specific tests
./test-harbor-integration.sh --skip-scan --skip-webhooks

# Custom configuration
./test-harbor-integration.sh \
  --harbor-url https://harbor.example.com \
  --project my-project \
  --image-name test-app
```

**Test Coverage:**
- Harbor API connectivity
- Docker registry authentication
- Image push/pull operations
- Vulnerability scanning
- Webhook functionality
- Image metadata retrieval
- Image deletion

### Manual Testing

#### 1. Test Harbor Web UI
Navigate to `https://harbor.aicorp.com`:
- Login with admin credentials
- Verify project creation
- Check robot accounts
- Review security policies

#### 2. Test Docker Operations
```bash
# Login to Harbor
docker login harbor.aicorp.com -u robot$gitlab-ci

# Build and push test image
docker build -t harbor.aicorp.com/aic-website/test:latest .
docker push harbor.aicorp.com/aic-website/test:latest

# Pull image
docker pull harbor.aicorp.com/aic-website/test:latest
```

#### 3. Test API Access
```bash
# System information
curl -u robot$gitlab-ci:password \
  https://harbor.aicorp.com/api/v2.0/systeminfo

# Project repositories
curl -u robot$gitlab-ci:password \
  https://harbor.aicorp.com/api/v2.0/projects/aic-website/repositories
```

## 📊 Monitoring & Maintenance

### Health Monitoring

#### Harbor Components
```bash
# Check all Harbor pods
kubectl get pods -n harbor-system

# Check Harbor services
kubectl get svc -n harbor-system

# Check ingress
kubectl get ingress -n harbor-system
```

#### Harbor Metrics
```yaml
# Enable metrics in harbor-values.yaml
metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    additionalLabels:
      release: prometheus
```

### Log Management

#### View Harbor Logs
```bash
# Core service logs
kubectl logs -n harbor-system deployment/harbor-core

# Registry logs
kubectl logs -n harbor-system deployment/harbor-registry

# Job service logs
kubectl logs -n harbor-system deployment/harbor-jobservice

# Trivy scanner logs
kubectl logs -n harbor-system deployment/harbor-trivy
```

#### Log Aggregation
Configure log forwarding to ELK stack:
```yaml
# In harbor-values.yaml
logLevel: info
core:
  logRotateCount: 50
  logRotateSize: 200M
```

### Backup Procedures

#### Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/harbor/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Database backup
kubectl exec -n harbor-system harbor-database-0 -- \
  pg_dump -U postgres registry > $BACKUP_DIR/harbor-db.sql

# Configuration backup
kubectl get secret -n harbor-system harbor-core -o yaml > $BACKUP_DIR/harbor-config.yaml

# Compress backup
tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR
```

#### Registry Data Backup
```bash
# For PVC-based storage
kubectl exec -n harbor-system harbor-registry-0 -- \
  tar czf /tmp/registry-backup-$(date +%Y%m%d).tar.gz /storage

# For S3-based storage (automatic with S3 versioning)
```

### Performance Optimization

#### Resource Tuning
```yaml
# Optimize based on usage patterns
core:
  replicas: 2
  resources:
    requests:
      memory: 512Mi
      cpu: 200m
    limits:
      memory: 1Gi
      cpu: 1000m

registry:
  replicas: 2
  resources:
    requests:
      memory: 512Mi
      cpu: 200m
    limits:
      memory: 1Gi
      cpu: 1000m
```

#### Storage Optimization
- Use high-performance storage classes
- Implement image retention policies
- Configure garbage collection
- Monitor storage usage patterns

## 🔒 Security

### Access Control

#### RBAC Configuration
- Use least-privilege principles
- Regular access reviews
- Strong password policies
- Two-factor authentication

#### Robot Account Management
- Separate robot accounts per use case
- Regular credential rotation
- Audit robot account usage
- Implement expiration policies

### Image Security

#### Vulnerability Scanning
```yaml
trivy:
  enabled: true
  vulnType: "os,library"
  severity: "HIGH,CRITICAL"
  ignoreUnfixed: false
```

#### Content Trust
```yaml
notary:
  enabled: true
  # Enables image signing and verification
```

#### Security Policies
- Block vulnerable images
- Require image signing
- Implement CVE allowlists
- Regular security audits

### Network Security

#### TLS Configuration
- Use valid SSL certificates
- Enable HTTPS redirect
- Configure secure ciphers
- Regular certificate renewal

#### Network Policies
```yaml
networkPolicy:
  enabled: true
  ingress:
    ipBlock:
      cidr: 10.0.0.0/8  # Restrict to internal networks
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Harbor Not Accessible
**Symptoms:** Cannot access Harbor web UI
**Solutions:**
```bash
# Check ingress
kubectl describe ingress harbor-ingress -n harbor-system

# Check certificates
kubectl get certificates -n harbor-system

# Check DNS
nslookup harbor.aicorp.com

# Check pods
kubectl get pods -n harbor-system
```

#### 2. Image Push/Pull Failures
**Symptoms:** Docker operations fail
**Solutions:**
```bash
# Test authentication
docker login harbor.aicorp.com

# Check robot account permissions
curl -u robot$gitlab-ci:password \
  https://harbor.aicorp.com/api/v2.0/projects/aic-website

# Check network connectivity
telnet harbor.aicorp.com 443
```

#### 3. Vulnerability Scanning Issues
**Symptoms:** Trivy not working
**Solutions:**
```bash
# Check Trivy pod
kubectl get pods -n harbor-system -l app=harbor,component=trivy

# Check Trivy logs
kubectl logs -n harbor-system deployment/harbor-trivy

# Update vulnerability database
kubectl exec -n harbor-system deployment/harbor-trivy -- \
  trivy image --download-db-only
```

### Debug Commands

#### System Diagnostics
```bash
# Harbor system status
kubectl get all -n harbor-system

# Check persistent volumes
kubectl get pv,pvc -n harbor-system

# Check events
kubectl get events -n harbor-system --sort-by='.lastTimestamp'

# Network connectivity
kubectl exec -n harbor-system harbor-core-0 -- nslookup harbor.aicorp.com
```

#### Harbor API Debugging
```bash
# System information
curl -k -u admin:password https://harbor.aicorp.com/api/v2.0/systeminfo

# Health check
curl -k https://harbor.aicorp.com/api/v2.0/health

# Statistics
curl -k -u admin:password https://harbor.aicorp.com/api/v2.0/statistics
```

## 📈 Scaling & Performance

### Horizontal Scaling
```yaml
# Scale Harbor components
core:
  replicas: 3
registry:
  replicas: 3
jobservice:
  replicas: 2
portal:
  replicas: 2
```

### Vertical Scaling
```yaml
# Increase resource limits
core:
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 2000m
```

### Database Optimization
```yaml
database:
  internal:
    resources:
      requests:
        memory: 1Gi
        cpu: 500m
      limits:
        memory: 2Gi
        cpu: 1000m
```

## 💰 Cost Optimization

### Storage Management
- Implement retention policies
- Use image compression
- Regular garbage collection
- Monitor storage growth

### Resource Optimization
- Right-size resource requests/limits
- Use horizontal pod autoscaling
- Implement resource quotas
- Monitor resource utilization

## 📚 Additional Resources

### Documentation
- [Harbor Official Documentation](https://goharbor.io/docs/)
- [Harbor GitHub Repository](https://github.com/goharbor/harbor)
- [Harbor Helm Chart](https://github.com/goharbor/harbor-helm)

### Community
- [Harbor Community Forum](https://goharbor.io/community/)
- [Harbor Slack Channel](https://cloud-native.slack.com/channels/harbor)
- [Harbor Mailing List](https://lists.cncf.io/g/harbor-users)

### Support
- [Harbor Issue Tracker](https://github.com/goharbor/harbor/issues)
- [Harbor Security Advisories](https://github.com/goharbor/harbor/security/advisories)
- [CNCF Harbor Project](https://www.cncf.io/projects/harbor/)

---

## 🎯 Quick Reference

### Key Commands
```bash
# Deploy Harbor
./deploy-harbor.sh --domain harbor.example.com

# Configure GitLab integration
./configure-harbor-gitlab.sh

# Test integration
./test-harbor-integration.sh

# Check Harbor status
kubectl get pods -n harbor-system
```

### Important URLs
- **Harbor Web UI**: https://harbor.aicorp.com
- **Harbor API**: https://harbor.aicorp.com/api/v2.0
- **Notary Service**: https://notary.aicorp.com

### Default Credentials
- **Username**: admin
- **Password**: Harbor12345 (change immediately)

### Configuration Files
- **harbor-values.yaml**: Helm values configuration
- **deploy-harbor.sh**: Automated deployment script
- **configure-harbor-gitlab.sh**: GitLab integration script
- **test-harbor-integration.sh**: Integration testing script

---

**Next Steps**: After Harbor setup is complete, proceed to configure the complete GitLab CI/CD pipeline and test container image operations.
