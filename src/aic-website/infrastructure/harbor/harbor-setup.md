# Harbor Container Registry Setup

This document provides comprehensive instructions for setting up Harbor as a container registry for the AIC Website project.

## Overview

Harbor is an open-source container registry that provides:
- Container image storage and distribution
- Vulnerability scanning with Trivy
- Content trust and image signing
- Role-based access control (RBAC)
- Replication across registries
- Helm chart repository
- REST API for automation

## Prerequisites

Before setting up Harbor, ensure you have:

### Infrastructure Requirements
- Kubernetes cluster (v1.20+)
- Helm 3.x installed
- kubectl configured
- Ingress controller (NGINX recommended)
- cert-manager for TLS certificates
- Persistent storage (100GB+ recommended)

### DNS Configuration
Configure DNS records for:
- `harbor.aicorp.com` → Load balancer IP
- `notary.aicorp.com` → Load balancer IP (for content trust)

### SSL Certificates
Harbor requires valid SSL certificates. Options:
1. **Let's Encrypt** (recommended for production)
2. **Self-signed certificates** (development only)
3. **Corporate CA certificates**

## Quick Start

### 1. Automated Harbor Deployment

Use the provided deployment script for complete Harbor setup:

```bash
# Set environment variables
export HARBOR_DOMAIN="harbor.aicorp.com"
export HARBOR_ADMIN_PASSWORD="YourSecurePassword123"
export HARBOR_NAMESPACE="harbor-system"
export HARBOR_STORAGE_CLASS="gp3"

# Deploy Harbor
./deploy-harbor.sh --domain $HARBOR_DOMAIN --password $HARBOR_ADMIN_PASSWORD
```

### 2. Configure GitLab Integration

After Harbor deployment, configure GitLab CI integration:

```bash
# Set GitLab credentials
export GITLAB_PROJECT_ID=12345
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
export HARBOR_URL="https://harbor.aicorp.com"

# Configure GitLab integration
./configure-harbor-gitlab.sh
```
      kubernetes.io/ingress.class: "nginx"
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/proxy-body-size: "0"

# External URL
externalURL: https://harbor.aicorp.com

# Persistence configuration
persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      storageClass: "encrypted-ssd"
      size: 100Gi
    chartmuseum:
      storageClass: "encrypted-ssd"
      size: 10Gi
    jobservice:
      storageClass: "encrypted-ssd"
      size: 5Gi
    database:
      storageClass: "encrypted-ssd"
      size: 20Gi
    redis:
      storageClass: "encrypted-ssd"
      size: 5Gi
    trivy:
      storageClass: "encrypted-ssd"
      size: 10Gi

# Database configuration (external PostgreSQL)
database:
  type: external
  external:
    host: "postgresql.storage.svc.cluster.local"
    port: "5432"
    username: "harbor"
    password: "HARBOR_DB_PASSWORD"
    coreDatabase: "harbor_core"
    notaryServerDatabase: "harbor_notary_server"
    notarySignerDatabase: "harbor_notary_signer"
    sslmode: "require"

# Redis configuration (external Redis)
redis:
  type: external
  external:
    addr: "redis.storage.svc.cluster.local:6379"
    password: "REDIS_PASSWORD"
    database: "1"

# Harbor core configuration
harborAdminPassword: "HARBOR_ADMIN_PASSWORD"

# Security settings
secretKey: "HARBOR_SECRET_KEY"

# Trivy scanner configuration
trivy:
  enabled: true
  image:
    repository: goharbor/trivy-adapter-photon
    tag: v2.9.0
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

# Notary configuration
notary:
  enabled: true
  server:
    image:
      repository: goharbor/notary-server-photon
      tag: v2.9.0
  signer:
    image:
      repository: goharbor/notary-signer-photon
      tag: v2.9.0

# ChartMuseum configuration
chartmuseum:
  enabled: true
  image:
    repository: goharbor/chartmuseum-photon
    tag: v2.9.0

# Core service configuration
core:
  image:
    repository: goharbor/harbor-core
    tag: v2.9.0
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 1000m
      memory: 2Gi

# Registry configuration
registry:
  image:
    repository: goharbor/registry-photon
    tag: v2.9.0
  resources:
    requests:
      cpu: 500m
      memory: 1Gi
    limits:
      cpu: 1000m
      memory: 2Gi

# Portal configuration
portal:
  image:
    repository: goharbor/harbor-portal
    tag: v2.9.0
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

# Job service configuration
jobservice:
  image:
    repository: goharbor/harbor-jobservice
    tag: v2.9.0
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

# Metrics configuration
metrics:
  enabled: true
  core:
    path: /metrics
    port: 8001
  registry:
    path: /metrics
    port: 8001
  jobservice:
    path: /metrics
    port: 8001

# Security context
securityContext:
  runAsNonRoot: true
  runAsUser: 10000
  fsGroup: 10000
EOF
```

#### 3. Create Secrets

```bash
# Create TLS certificate secret
kubectl create secret tls harbor-tls \
  --cert=harbor.aicorp.com.crt \
  --key=harbor.aicorp.com.key \
  -n harbor

kubectl create secret tls notary-tls \
  --cert=notary.aicorp.com.crt \
  --key=notary.aicorp.com.key \
  -n harbor

# Create database password secret
kubectl create secret generic harbor-database \
  --from-literal=password=<secure-database-password> \
  -n harbor

# Create Redis password secret
kubectl create secret generic harbor-redis \
  --from-literal=password=<secure-redis-password> \
  -n harbor
```

#### 4. Install Harbor

```bash
# Install Harbor using Helm
helm install harbor harbor/harbor \
  -n harbor \
  -f harbor-values.yaml \
  --version 1.13.0

# Wait for Harbor to be ready
kubectl wait --for=condition=ready pod -l app=harbor -n harbor --timeout=600s
```

### Post-Installation Configuration

#### 1. Access Harbor UI

```bash
# Get Harbor admin password
kubectl get secret harbor-core -n harbor -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 -d

# Access Harbor at https://harbor.aicorp.com
# Username: admin
# Password: <decoded-password>
```

#### 2. Create Projects

```bash
# Create AIC Website project via Harbor API
curl -X POST "https://harbor.aicorp.com/api/v2.0/projects" \
  -H "Content-Type: application/json" \
  -u "admin:<password>" \
  -d '{
    "project_name": "aic-website",
    "public": false,
    "metadata": {
      "auto_scan": "true",
      "severity": "high",
      "reuse_sys_cve_allowlist": "true"
    }
  }'

# Create additional projects
curl -X POST "https://harbor.aicorp.com/api/v2.0/projects" \
  -H "Content-Type: application/json" \
  -u "admin:<password>" \
  -d '{
    "project_name": "aic-infrastructure",
    "public": false,
    "metadata": {
      "auto_scan": "true",
      "severity": "critical"
    }
  }'
```

#### 3. Configure Security Policies

```bash
# Set vulnerability scanning policy
curl -X PUT "https://harbor.aicorp.com/api/v2.0/projects/aic-website" \
  -H "Content-Type: application/json" \
  -u "admin:<password>" \
  -d '{
    "metadata": {
      "auto_scan": "true",
      "severity": "high",
      "prevent_vul": "true",
      "reuse_sys_cve_allowlist": "false"
    }
  }'

# Configure image retention policy
curl -X POST "https://harbor.aicorp.com/api/v2.0/projects/aic-website/scanner/policies" \
  -H "Content-Type: application/json" \
  -u "admin:<password>" \
  -d '{
    "rules": [
      {
        "disabled": false,
        "action": "retain",
        "template": "latestPushedK",
        "params": {
          "latestPushedK": 10
        },
        "tag_selectors": [
          {
            "kind": "doublestar",
            "decoration": "matches",
            "pattern": "**"
          }
        ],
        "scope_selectors": {
          "repository": [
            {
              "kind": "doublestar",
              "decoration": "matches",
              "pattern": "**"
            }
          ]
        }
      }
    ],
    "trigger": {
      "kind": "Schedule",
      "settings": {
        "cron": "0 2 * * *"
      }
    }
  }'
```

## GitLab CI Integration

### 1. Create Harbor Service Account

```bash
# Create robot account for GitLab CI
curl -X POST "https://harbor.aicorp.com/api/v2.0/projects/aic-website/robots" \
  -H "Content-Type: application/json" \
  -u "admin:<password>" \
  -d '{
    "name": "gitlab-ci",
    "description": "GitLab CI robot account",
    "duration": -1,
    "level": "project",
    "permissions": [
      {
        "kind": "project",
        "namespace": "aic-website",
        "access": [
          {
            "resource": "repository",
            "action": "push"
          },
          {
            "resource": "repository",
            "action": "pull"
          },
          {
            "resource": "artifact",
            "action": "delete"
          }
        ]
      }
    ]
  }'
```

### 2. Configure GitLab Variables

Add these variables to your GitLab project:

```bash
# Harbor registry configuration
HARBOR_REGISTRY_URL=harbor.aicorp.com
HARBOR_USERNAME=robot$gitlab-ci
HARBOR_PASSWORD=<robot-account-token>
HARBOR_PROJECT=aic-website
```

### 3. Test Integration

```bash
# Test Docker login
echo $HARBOR_PASSWORD | docker login $HARBOR_REGISTRY_URL -u $HARBOR_USERNAME --password-stdin

# Test image push
docker tag nginx:latest harbor.aicorp.com/aic-website/test:latest
docker push harbor.aicorp.com/aic-website/test:latest

# Verify in Harbor UI
curl -X GET "https://harbor.aicorp.com/api/v2.0/projects/aic-website/repositories" \
  -u "admin:<password>"
```

## Harbor Configuration Scripts

### Harbor Setup Automation Script

```bash
#!/bin/bash

# Harbor Setup Automation Script
set -e

HARBOR_NAMESPACE="harbor"
HARBOR_DOMAIN="harbor.aicorp.com"
NOTARY_DOMAIN="notary.aicorp.com"

echo "Setting up Harbor registry for AIC Website..."

# Create namespace
kubectl create namespace $HARBOR_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Generate TLS certificates (using cert-manager)
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: harbor-tls
  namespace: $HARBOR_NAMESPACE
spec:
  secretName: harbor-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: $HARBOR_DOMAIN
  dnsNames:
  - $HARBOR_DOMAIN
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: notary-tls
  namespace: $HARBOR_NAMESPACE
spec:
  secretName: notary-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: $NOTARY_DOMAIN
  dnsNames:
  - $NOTARY_DOMAIN
EOF

# Wait for certificates
echo "Waiting for TLS certificates..."
kubectl wait --for=condition=ready certificate harbor-tls -n $HARBOR_NAMESPACE --timeout=300s
kubectl wait --for=condition=ready certificate notary-tls -n $HARBOR_NAMESPACE --timeout=300s

# Install Harbor
helm repo add harbor https://helm.goharbor.io
helm repo update

helm upgrade --install harbor harbor/harbor \
  -n $HARBOR_NAMESPACE \
  -f harbor-values.yaml \
  --version 1.13.0 \
  --wait \
  --timeout 10m

echo "Harbor installation completed!"
echo "Access Harbor at: https://$HARBOR_DOMAIN"
echo "Default admin credentials:"
echo "Username: admin"
echo "Password: $(kubectl get secret harbor-core -n $HARBOR_NAMESPACE -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 -d)"
```

### Harbor Project Setup Script

```bash
#!/bin/bash

# Harbor Project Setup Script
set -e

HARBOR_URL="https://harbor.aicorp.com"
HARBOR_ADMIN_USER="admin"
HARBOR_ADMIN_PASS="<admin-password>"

# Function to create Harbor project
create_project() {
    local project_name=$1
    local public=${2:-false}
    local auto_scan=${3:-true}
    local severity=${4:-high}
    
    echo "Creating Harbor project: $project_name"
    
    curl -X POST "$HARBOR_URL/api/v2.0/projects" \
      -H "Content-Type: application/json" \
      -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASS" \
      -d "{
        \"project_name\": \"$project_name\",
        \"public\": $public,
        \"metadata\": {
          \"auto_scan\": \"$auto_scan\",
          \"severity\": \"$severity\",
          \"reuse_sys_cve_allowlist\": \"true\",
          \"prevent_vul\": \"true\"
        }
      }"
}

# Function to create robot account
create_robot_account() {
    local project_name=$1
    local robot_name=$2
    local description=$3
    
    echo "Creating robot account: $robot_name for project: $project_name"
    
    curl -X POST "$HARBOR_URL/api/v2.0/projects/$project_name/robots" \
      -H "Content-Type: application/json" \
      -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASS" \
      -d "{
        \"name\": \"$robot_name\",
        \"description\": \"$description\",
        \"duration\": -1,
        \"level\": \"project\",
        \"permissions\": [
          {
            \"kind\": \"project\",
            \"namespace\": \"$project_name\",
            \"access\": [
              {
                \"resource\": \"repository\",
                \"action\": \"push\"
              },
              {
                \"resource\": \"repository\",
                \"action\": \"pull\"
              },
              {
                \"resource\": \"artifact\",
                \"action\": \"delete\"
              }
            ]
          }
        ]
      }"
}

# Create projects
create_project "aic-website" false true "high"
create_project "aic-infrastructure" false true "critical"
create_project "aic-development" false true "medium"

# Create robot accounts
create_robot_account "aic-website" "gitlab-ci" "GitLab CI robot account"
create_robot_account "aic-website" "kubernetes" "Kubernetes deployment robot account"

echo "Harbor project setup completed!"
```

## Monitoring and Maintenance

### Harbor Health Checks

```bash
#!/bin/bash

# Harbor Health Check Script
HARBOR_URL="https://harbor.aicorp.com"

# Check Harbor API health
echo "Checking Harbor API health..."
curl -f "$HARBOR_URL/api/v2.0/health" || echo "Harbor API health check failed"

# Check Harbor services
echo "Checking Harbor services..."
kubectl get pods -n harbor

# Check Harbor storage usage
echo "Checking Harbor storage usage..."
kubectl exec -n harbor deployment/harbor-core -- df -h /storage

# Check Harbor database connectivity
echo "Checking Harbor database connectivity..."
kubectl exec -n harbor deployment/harbor-core -- pg_isready -h postgresql.storage.svc.cluster.local

# Check Harbor registry functionality
echo "Testing Harbor registry functionality..."
docker pull alpine:latest
docker tag alpine:latest harbor.aicorp.com/aic-website/health-check:latest
echo $HARBOR_PASSWORD | docker login harbor.aicorp.com -u $HARBOR_USERNAME --password-stdin
docker push harbor.aicorp.com/aic-website/health-check:latest
docker rmi harbor.aicorp.com/aic-website/health-check:latest alpine:latest
```

### Harbor Backup Script

```bash
#!/bin/bash

# Harbor Backup Script
set -e

BACKUP_DIR="/backup/harbor/$(date +%Y%m%d-%H%M%S)"
HARBOR_NAMESPACE="harbor"

echo "Creating Harbor backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Harbor database
kubectl exec -n storage postgresql-0 -- pg_dump -U harbor harbor_core > $BACKUP_DIR/harbor_core.sql
kubectl exec -n storage postgresql-0 -- pg_dump -U harbor harbor_notary_server > $BACKUP_DIR/harbor_notary_server.sql
kubectl exec -n storage postgresql-0 -- pg_dump -U harbor harbor_notary_signer > $BACKUP_DIR/harbor_notary_signer.sql

# Backup Harbor configuration
kubectl get secret harbor-core -n $HARBOR_NAMESPACE -o yaml > $BACKUP_DIR/harbor-core-secret.yaml
kubectl get configmap harbor-core -n $HARBOR_NAMESPACE -o yaml > $BACKUP_DIR/harbor-core-configmap.yaml

# Backup Harbor registry data (if using local storage)
kubectl exec -n $HARBOR_NAMESPACE deployment/harbor-registry -- tar -czf - /storage/docker > $BACKUP_DIR/registry-data.tar.gz

# Create backup manifest
cat > $BACKUP_DIR/backup-manifest.txt <<EOF
Harbor Backup Manifest
=====================
Backup Date: $(date)
Harbor Version: $(kubectl get deployment harbor-core -n $HARBOR_NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}')
Backup Contents:
- harbor_core.sql (Core database)
- harbor_notary_server.sql (Notary server database)
- harbor_notary_signer.sql (Notary signer database)
- harbor-core-secret.yaml (Core secrets)
- harbor-core-configmap.yaml (Core configuration)
- registry-data.tar.gz (Registry data)
EOF

echo "Harbor backup completed: $BACKUP_DIR"
```

---

**Next Step**: [Setup Jenkins Deploy Job](./jenkins-setup.md)
