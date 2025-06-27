#!/bin/bash

# Enhanced Saga Orchestrator Deployment Script
# Comprehensive deployment automation for production environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${ENVIRONMENT:-production}"
NAMESPACE="${NAMESPACE:-saga-system}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-your-registry.com}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
error_exit() {
    log_error "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    local required_tools=("docker" "kubectl" "helm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "$tool is required but not installed"
        fi
    done
    
    # Check Kubernetes connection
    if ! kubectl cluster-info &> /dev/null; then
        error_exit "Cannot connect to Kubernetes cluster"
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running"
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    local image_name="${REGISTRY}/saga-orchestrator:${IMAGE_TAG}"
    local build_args=(
        "--build-arg" "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
        "--build-arg" "VERSION=${IMAGE_TAG}"
        "--build-arg" "VCS_REF=$(git rev-parse --short HEAD)"
        "--target" "production"
        "--tag" "$image_name"
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would build image: $image_name"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    docker build "${build_args[@]}" .
    
    log_success "Docker image built: $image_name"
}

# Push Docker image
push_image() {
    log_info "Pushing Docker image..."
    
    local image_name="${REGISTRY}/saga-orchestrator:${IMAGE_TAG}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would push image: $image_name"
        return 0
    fi
    
    docker push "$image_name"
    log_success "Docker image pushed: $image_name"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create namespace: $NAMESPACE"
        return 0
    fi
    
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    log_success "Namespace created/updated: $NAMESPACE"
}

# Deploy PostgreSQL
deploy_postgresql() {
    log_info "Deploying PostgreSQL..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy PostgreSQL"
        return 0
    fi
    
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    helm upgrade --install postgresql bitnami/postgresql \
        --namespace "$NAMESPACE" \
        --set auth.postgresPassword=saga123 \
        --set auth.username=saga \
        --set auth.password=saga123 \
        --set auth.database=saga_orchestrator \
        --set primary.persistence.size=20Gi \
        --set metrics.enabled=true \
        --wait
    
    log_success "PostgreSQL deployed"
}

# Deploy Redis
deploy_redis() {
    log_info "Deploying Redis..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy Redis"
        return 0
    fi
    
    helm upgrade --install redis bitnami/redis \
        --namespace "$NAMESPACE" \
        --set auth.enabled=false \
        --set master.persistence.size=10Gi \
        --set replica.replicaCount=2 \
        --set metrics.enabled=true \
        --wait
    
    log_success "Redis deployed"
}

# Deploy Jaeger
deploy_jaeger() {
    log_info "Deploying Jaeger..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy Jaeger"
        return 0
    fi
    
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo update
    
    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace "$NAMESPACE" \
        --set provisionDataStore.cassandra=false \
        --set storage.type=memory \
        --set agent.enabled=false \
        --set collector.enabled=true \
        --set query.enabled=true \
        --wait
    
    log_success "Jaeger deployed"
}

# Deploy Prometheus
deploy_prometheus() {
    log_info "Deploying Prometheus..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy Prometheus"
        return 0
    fi
    
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace "$NAMESPACE" \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set grafana.adminPassword=admin123 \
        --wait
    
    log_success "Prometheus deployed"
}

# Apply Kubernetes manifests
apply_manifests() {
    log_info "Applying Kubernetes manifests..."
    
    local manifests_dir="$PROJECT_ROOT/k8s"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would apply manifests from: $manifests_dir"
        kubectl apply --dry-run=client -f "$manifests_dir/" -n "$NAMESPACE"
        return 0
    fi
    
    # Update image in deployment
    sed -i.bak "s|saga-orchestrator:.*|${REGISTRY}/saga-orchestrator:${IMAGE_TAG}|g" \
        "$manifests_dir/deployment.yaml"
    
    kubectl apply -f "$manifests_dir/" -n "$NAMESPACE"
    
    # Restore original file
    mv "$manifests_dir/deployment.yaml.bak" "$manifests_dir/deployment.yaml"
    
    log_success "Kubernetes manifests applied"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would wait for deployment"
        return 0
    fi
    
    kubectl rollout status deployment/saga-orchestrator -n "$NAMESPACE" --timeout=600s
    log_success "Deployment is ready"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run health checks"
        return 0
    fi
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=saga-orchestrator -n "$NAMESPACE" --timeout=300s
    
    # Test health endpoint
    local service_url
    service_url=$(kubectl get service saga-orchestrator -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    if kubectl run health-check --rm -i --restart=Never --image=curlimages/curl -- \
        curl -f "http://$service_url/health" > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        return 1
    fi
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run smoke tests"
        return 0
    fi
    
    # Port forward for testing
    kubectl port-forward service/saga-orchestrator 8080:80 -n "$NAMESPACE" &
    local port_forward_pid=$!
    
    # Wait for port forward
    sleep 5
    
    # Run basic API tests
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log_success "Basic API test passed"
    else
        log_error "Basic API test failed"
        kill $port_forward_pid
        return 1
    fi
    
    # Test metrics endpoint
    if curl -f http://localhost:8080/metrics > /dev/null 2>&1; then
        log_success "Metrics endpoint test passed"
    else
        log_warning "Metrics endpoint test failed"
    fi
    
    # Cleanup
    kill $port_forward_pid
    
    log_success "Smoke tests completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Kill any background processes
    jobs -p | xargs -r kill
    
    log_success "Cleanup completed"
}

# Main deployment function
deploy() {
    log_info "Starting Enhanced Saga Orchestrator deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Registry: $REGISTRY"
    log_info "Dry Run: $DRY_RUN"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    build_image
    push_image
    create_namespace
    deploy_postgresql
    deploy_redis
    deploy_jaeger
    deploy_prometheus
    apply_manifests
    wait_for_deployment
    run_health_checks
    run_smoke_tests
    
    log_success "Enhanced Saga Orchestrator deployment completed successfully!"
    
    # Display access information
    echo ""
    log_info "Access Information:"
    echo "  - Saga Orchestrator API: kubectl port-forward service/saga-orchestrator 8080:80 -n $NAMESPACE"
    echo "  - Grafana Dashboard: kubectl port-forward service/prometheus-grafana 3000:80 -n $NAMESPACE"
    echo "  - Jaeger UI: kubectl port-forward service/jaeger-query 16686:16686 -n $NAMESPACE"
    echo "  - Prometheus UI: kubectl port-forward service/prometheus-kube-prometheus-prometheus 9090:9090 -n $NAMESPACE"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --namespace|-n)
            NAMESPACE="$2"
            shift 2
            ;;
        --image-tag|-t)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry|-r)
            REGISTRY="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment    Environment (default: production)"
            echo "  -n, --namespace      Kubernetes namespace (default: saga-system)"
            echo "  -t, --image-tag      Docker image tag (default: latest)"
            echo "  -r, --registry       Docker registry (default: your-registry.com)"
            echo "      --dry-run        Perform a dry run without making changes"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Run deployment
deploy
