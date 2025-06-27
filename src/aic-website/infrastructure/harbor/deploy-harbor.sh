#!/bin/bash

# Harbor Deployment Script for AIC Website
# This script deploys Harbor container registry to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${HARBOR_NAMESPACE:-harbor-system}"
RELEASE_NAME="${HARBOR_RELEASE_NAME:-harbor}"
CHART_VERSION="${HARBOR_CHART_VERSION:-1.13.0}"
DOMAIN="${HARBOR_DOMAIN:-harbor.aicorp.com}"
ADMIN_PASSWORD="${HARBOR_ADMIN_PASSWORD:-Harbor12345}"
STORAGE_CLASS="${HARBOR_STORAGE_CLASS:-gp3}"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_status $BLUE "🔍 Checking prerequisites..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        print_status $RED "❌ kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is available
    if ! command -v helm &> /dev/null; then
        print_status $RED "❌ Helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we can connect to Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_status $RED "❌ Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if cert-manager is installed
    if ! kubectl get crd certificates.cert-manager.io &> /dev/null; then
        print_status $YELLOW "⚠️  cert-manager CRDs not found. TLS certificates may not work."
    fi
    
    print_status $GREEN "✅ Prerequisites check passed"
}

# Function to create namespace
create_namespace() {
    print_status $BLUE "📦 Creating namespace: $NAMESPACE"
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Label namespace for monitoring
    kubectl label namespace $NAMESPACE name=$NAMESPACE --overwrite
    kubectl label namespace $NAMESPACE app.kubernetes.io/name=harbor --overwrite
    kubectl label namespace $NAMESPACE app.kubernetes.io/instance=$RELEASE_NAME --overwrite
    
    print_status $GREEN "✅ Namespace created/updated: $NAMESPACE"
}

# Function to create Harbor admin password secret
create_admin_secret() {
    print_status $BLUE "🔐 Creating Harbor admin password secret..."
    
    kubectl create secret generic harbor-admin-password \
        --from-literal=password="$ADMIN_PASSWORD" \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_status $GREEN "✅ Harbor admin password secret created"
}

# Function to create TLS certificate
create_tls_certificate() {
    print_status $BLUE "🔒 Creating TLS certificate for Harbor..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: harbor-tls-cert
  namespace: $NAMESPACE
spec:
  secretName: harbor-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - $DOMAIN
  - notary.$DOMAIN
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: harbor-notary-tls-cert
  namespace: $NAMESPACE
spec:
  secretName: harbor-notary-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - notary.$DOMAIN
EOF
    
    print_status $GREEN "✅ TLS certificates created"
}

# Function to add Harbor Helm repository
add_helm_repo() {
    print_status $BLUE "📚 Adding Harbor Helm repository..."
    
    helm repo add harbor https://helm.goharbor.io
    helm repo update
    
    print_status $GREEN "✅ Harbor Helm repository added"
}

# Function to create storage classes if needed
create_storage_classes() {
    print_status $BLUE "💾 Checking storage classes..."
    
    if ! kubectl get storageclass $STORAGE_CLASS &> /dev/null; then
        print_status $YELLOW "⚠️  Storage class $STORAGE_CLASS not found. Creating default gp3 storage class..."
        
        cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF
        
        print_status $GREEN "✅ Storage class gp3 created"
    else
        print_status $GREEN "✅ Storage class $STORAGE_CLASS exists"
    fi
}

# Function to deploy Harbor
deploy_harbor() {
    print_status $BLUE "🚀 Deploying Harbor..."
    
    # Create values file with dynamic configuration
    cat > /tmp/harbor-values.yaml <<EOF
expose:
  type: ingress
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: harbor-tls-cert
      notarySecretName: harbor-notary-tls-cert
  ingress:
    hosts:
      core: $DOMAIN
      notary: notary.$DOMAIN
    controller: default
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/proxy-body-size: "0"
      nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
      nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
      nginx.ingress.kubernetes.io/proxy-request-buffering: "off"

externalURL: https://$DOMAIN

harborAdminPassword: "$ADMIN_PASSWORD"

persistence:
  enabled: true
  resourcePolicy: "keep"
  persistentVolumeClaim:
    registry:
      storageClass: "$STORAGE_CLASS"
      accessMode: ReadWriteOnce
      size: 100Gi
    chartmuseum:
      storageClass: "$STORAGE_CLASS"
      accessMode: ReadWriteOnce
      size: 10Gi
    jobservice:
      jobLog:
        storageClass: "$STORAGE_CLASS"
        accessMode: ReadWriteOnce
        size: 5Gi
    database:
      storageClass: "$STORAGE_CLASS"
      accessMode: ReadWriteOnce
      size: 20Gi
    redis:
      storageClass: "$STORAGE_CLASS"
      accessMode: ReadWriteOnce
      size: 5Gi
    trivy:
      storageClass: "$STORAGE_CLASS"
      accessMode: ReadWriteOnce
      size: 10Gi

core:
  replicas: 2
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 500m

jobservice:
  replicas: 2
  maxJobWorkers: 10
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 500m

registry:
  replicas: 2
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 500m

portal:
  replicas: 2
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 500m

trivy:
  enabled: true
  replicas: 1
  vulnType: "os,library"
  severity: "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL"
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

notary:
  enabled: true

metrics:
  enabled: true
  serviceMonitor:
    enabled: true

database:
  internal:
    resources:
      requests:
        memory: 256Mi
        cpu: 100m
      limits:
        memory: 512Mi
        cpu: 500m

redis:
  internal:
    resources:
      requests:
        memory: 256Mi
        cpu: 100m
      limits:
        memory: 512Mi
        cpu: 500m
EOF
    
    # Deploy Harbor using Helm
    helm upgrade --install $RELEASE_NAME harbor/harbor \
        --namespace $NAMESPACE \
        --version $CHART_VERSION \
        --values /tmp/harbor-values.yaml \
        --wait \
        --timeout 15m
    
    print_status $GREEN "✅ Harbor deployed successfully"
}

# Function to wait for Harbor to be ready
wait_for_harbor() {
    print_status $BLUE "⏳ Waiting for Harbor to be ready..."
    
    # Wait for all deployments to be ready
    kubectl wait --for=condition=available --timeout=600s deployment --all -n $NAMESPACE
    
    # Wait for Harbor core to be accessible
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -s https://$DOMAIN/api/v2.0/systeminfo > /dev/null 2>&1; then
            print_status $GREEN "✅ Harbor is ready and accessible"
            break
        fi
        
        print_status $YELLOW "⏳ Attempt $attempt/$max_attempts: Harbor not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_status $RED "❌ Harbor failed to become ready within timeout"
        exit 1
    fi
}

# Function to configure Harbor projects
configure_harbor_projects() {
    print_status $BLUE "🏗️  Configuring Harbor projects..."
    
    # Get Harbor admin credentials
    local harbor_url="https://$DOMAIN"
    local admin_user="admin"
    local admin_pass="$ADMIN_PASSWORD"
    
    # Create aic-website project
    curl -k -X POST "$harbor_url/api/v2.0/projects" \
        -H "Content-Type: application/json" \
        -u "$admin_user:$admin_pass" \
        -d '{
            "project_name": "aic-website",
            "metadata": {
                "public": "false",
                "enable_content_trust": "true",
                "prevent_vul": "true",
                "severity": "high",
                "auto_scan": "true"
            }
        }' || true
    
    # Create library project (if not exists)
    curl -k -X POST "$harbor_url/api/v2.0/projects" \
        -H "Content-Type: application/json" \
        -u "$admin_user:$admin_pass" \
        -d '{
            "project_name": "library",
            "metadata": {
                "public": "true",
                "enable_content_trust": "false",
                "prevent_vul": "false",
                "auto_scan": "true"
            }
        }' || true
    
    print_status $GREEN "✅ Harbor projects configured"
}

# Function to create GitLab CI robot account
create_gitlab_robot() {
    print_status $BLUE "🤖 Creating GitLab CI robot account..."
    
    local harbor_url="https://$DOMAIN"
    local admin_user="admin"
    local admin_pass="$ADMIN_PASSWORD"
    
    # Create robot account for GitLab CI
    local robot_response=$(curl -k -s -X POST "$harbor_url/api/v2.0/projects/1/robots" \
        -H "Content-Type: application/json" \
        -u "$admin_user:$admin_pass" \
        -d '{
            "name": "gitlab-ci",
            "description": "Robot account for GitLab CI/CD pipeline",
            "duration": -1,
            "level": "project",
            "permissions": [
                {
                    "kind": "project",
                    "namespace": "aic-website",
                    "access": [
                        {"resource": "repository", "action": "push"},
                        {"resource": "repository", "action": "pull"},
                        {"resource": "artifact", "action": "delete"},
                        {"resource": "helm-chart", "action": "read"},
                        {"resource": "helm-chart-version", "action": "create"},
                        {"resource": "helm-chart-version", "action": "delete"}
                    ]
                }
            ]
        }')
    
    if echo "$robot_response" | grep -q "name"; then
        local robot_name=$(echo "$robot_response" | jq -r '.name')
        local robot_secret=$(echo "$robot_response" | jq -r '.secret')
        
        print_status $GREEN "✅ GitLab CI robot account created: $robot_name"
        print_status $YELLOW "🔑 Robot secret (save this): $robot_secret"
        
        # Save robot credentials to a secret
        kubectl create secret generic harbor-robot-credentials \
            --from-literal=username="$robot_name" \
            --from-literal=password="$robot_secret" \
            --namespace=$NAMESPACE \
            --dry-run=client -o yaml | kubectl apply -f -
        
        print_status $GREEN "✅ Robot credentials saved to Kubernetes secret"
    else
        print_status $YELLOW "⚠️  Robot account may already exist or creation failed"
    fi
}

# Function to display Harbor information
display_harbor_info() {
    print_status $BLUE "📋 Harbor Installation Summary"
    echo "=================================="
    echo "Harbor URL: https://$DOMAIN"
    echo "Admin Username: admin"
    echo "Admin Password: $ADMIN_PASSWORD"
    echo "Namespace: $NAMESPACE"
    echo "Release Name: $RELEASE_NAME"
    echo ""
    print_status $BLUE "📦 Projects Created:"
    echo "- aic-website (private, vulnerability scanning enabled)"
    echo "- library (public, for base images)"
    echo ""
    print_status $BLUE "🤖 Robot Accounts:"
    echo "- gitlab-ci (for GitLab CI/CD pipeline)"
    echo ""
    print_status $BLUE "🔧 Next Steps:"
    echo "1. Update GitLab CI variables with Harbor credentials"
    echo "2. Configure Docker clients to trust Harbor certificate"
    echo "3. Test image push/pull operations"
    echo "4. Set up Harbor backup procedures"
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "Harbor Deployment Script for AIC Website"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -n, --namespace NAME    Kubernetes namespace (default: harbor-system)"
    echo "  -d, --domain DOMAIN     Harbor domain (default: harbor.aicorp.com)"
    echo "  -p, --password PASS     Admin password (default: Harbor12345)"
    echo "  -s, --storage-class SC  Storage class (default: gp3)"
    echo "  --skip-tls              Skip TLS certificate creation"
    echo "  --skip-projects         Skip project configuration"
    echo "  --skip-robot            Skip robot account creation"
    echo ""
    echo "Environment Variables:"
    echo "  HARBOR_NAMESPACE        Kubernetes namespace"
    echo "  HARBOR_DOMAIN          Harbor domain name"
    echo "  HARBOR_ADMIN_PASSWORD  Harbor admin password"
    echo "  HARBOR_STORAGE_CLASS   Storage class for PVCs"
    echo ""
    echo "Example:"
    echo "  $0 --domain harbor.example.com --password MySecurePassword123"
}

# Main deployment function
main() {
    local skip_tls=false
    local skip_projects=false
    local skip_robot=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -p|--password)
                ADMIN_PASSWORD="$2"
                shift 2
                ;;
            -s|--storage-class)
                STORAGE_CLASS="$2"
                shift 2
                ;;
            --skip-tls)
                skip_tls=true
                shift
                ;;
            --skip-projects)
                skip_projects=true
                shift
                ;;
            --skip-robot)
                skip_robot=true
                shift
                ;;
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting Harbor deployment..."
    
    # Execute deployment steps
    check_prerequisites
    create_namespace
    create_admin_secret
    create_storage_classes
    
    if [ "$skip_tls" = false ]; then
        create_tls_certificate
    fi
    
    add_helm_repo
    deploy_harbor
    wait_for_harbor
    
    if [ "$skip_projects" = false ]; then
        configure_harbor_projects
    fi
    
    if [ "$skip_robot" = false ]; then
        create_gitlab_robot
    fi
    
    display_harbor_info
    
    print_status $GREEN "🎉 Harbor deployment completed successfully!"
}

# Cleanup function
cleanup() {
    rm -f /tmp/harbor-values.yaml
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"
