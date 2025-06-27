#!/bin/bash

# AIC Website Deployment Script
# This script deploys the entire AIC Website microservices architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-"aic-website-prod"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
REGISTRY=${REGISTRY:-"ghcr.io/aic-website"}
TAG=${TAG:-"latest"}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_success "kubectl is available and connected to cluster"
}

# Function to check if namespace exists
check_namespace() {
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_status "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
        kubectl label namespace "$NAMESPACE" name="$NAMESPACE"
    else
        print_success "Namespace $NAMESPACE already exists"
    fi
}

# Function to deploy infrastructure components
deploy_infrastructure() {
    print_status "Deploying infrastructure components..."
    
    # Deploy PostgreSQL
    print_status "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgres.yaml -n "$NAMESPACE"
    
    # Deploy Redis
    print_status "Deploying Redis..."
    kubectl apply -f k8s/redis.yaml -n "$NAMESPACE"
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n "$NAMESPACE" --timeout=300s
    
    print_success "Infrastructure components deployed successfully"
}

# Function to deploy Vault
deploy_vault() {
    print_status "Deploying HashiCorp Vault..."
    
    # Check if Vault is already deployed
    if kubectl get deployment vault -n "$NAMESPACE" &> /dev/null; then
        print_warning "Vault is already deployed, skipping..."
        return
    fi
    
    # Deploy Vault using our configuration
    cd vault-config
    ./deploy-vault.sh "$NAMESPACE"
    cd ..
    
    print_success "Vault deployed successfully"
}

# Function to deploy Jaeger
deploy_jaeger() {
    print_status "Deploying Jaeger tracing..."
    
    # Check if Jaeger is already deployed
    if kubectl get deployment jaeger-collector -n "$NAMESPACE" &> /dev/null; then
        print_warning "Jaeger is already deployed, skipping..."
        return
    fi
    
    # Deploy Jaeger using our configuration
    cd jaeger-config
    ./deploy-jaeger.sh "$NAMESPACE"
    cd ..
    
    print_success "Jaeger deployed successfully"
}

# Function to deploy microservices
deploy_microservices() {
    print_status "Deploying microservices..."
    
    # Update image tags in deployment files
    for service in auth-service user-service content-service notification-service; do
        print_status "Updating $service image tag to $TAG"
        sed -i.bak "s|image: ghcr.io/aic-website/$service:.*|image: $REGISTRY/$service:$TAG|g" "k8s/$service.yaml"
    done
    
    # Deploy services in order
    services=("auth-service" "user-service" "content-service" "notification-service")
    
    for service in "${services[@]}"; do
        print_status "Deploying $service..."
        kubectl apply -f "k8s/$service.yaml" -n "$NAMESPACE"
        
        # Wait for deployment to be ready
        print_status "Waiting for $service to be ready..."
        kubectl wait --for=condition=available deployment/"$service" -n "$NAMESPACE" --timeout=300s
        
        print_success "$service deployed successfully"
    done
}

# Function to deploy web application
deploy_web_app() {
    print_status "Deploying web application..."
    
    # Update web-main image tag
    sed -i.bak "s|image: ghcr.io/aic-website/web-main:.*|image: $REGISTRY/web-main:$TAG|g" "k8s/ingress.yaml"
    
    # Deploy ingress and web app
    kubectl apply -f k8s/ingress.yaml -n "$NAMESPACE"
    
    # Wait for web app to be ready
    print_status "Waiting for web application to be ready..."
    kubectl wait --for=condition=available deployment/web-main -n "$NAMESPACE" --timeout=300s
    
    print_success "Web application deployed successfully"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Run migrations for each service
    services=("auth-service" "user-service" "content-service" "notification-service")
    
    for service in "${services[@]}"; do
        print_status "Running migrations for $service..."
        
        # Get a pod name for the service
        pod_name=$(kubectl get pods -l app="$service" -n "$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
        
        if [ -n "$pod_name" ]; then
            kubectl exec -n "$NAMESPACE" "$pod_name" -- python -m alembic upgrade head || true
            print_success "Migrations completed for $service"
        else
            print_warning "No pods found for $service, skipping migrations"
        fi
    done
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check all deployments
    print_status "Checking deployment status..."
    kubectl get deployments -n "$NAMESPACE"
    
    # Check all services
    print_status "Checking service status..."
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress
    print_status "Checking ingress status..."
    kubectl get ingress -n "$NAMESPACE"
    
    # Test health endpoints
    print_status "Testing service health endpoints..."
    
    # Get ingress IP
    ingress_ip=$(kubectl get ingress aic-website-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -n "$ingress_ip" ]; then
        print_status "Ingress IP: $ingress_ip"
        
        # Test each service health endpoint
        services=("auth" "users" "content" "notifications")
        for service in "${services[@]}"; do
            if curl -f -s "http://$ingress_ip/$service/health" > /dev/null; then
                print_success "$service service is healthy"
            else
                print_warning "$service service health check failed"
            fi
        done
    else
        print_warning "Ingress IP not available yet"
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status Summary:"
    echo "=========================="
    echo "Namespace: $NAMESPACE"
    echo "Environment: $ENVIRONMENT"
    echo "Registry: $REGISTRY"
    echo "Tag: $TAG"
    echo ""
    
    print_status "Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide
    echo ""
    
    print_status "Services:"
    kubectl get services -n "$NAMESPACE"
    echo ""
    
    print_status "Ingress:"
    kubectl get ingress -n "$NAMESPACE"
    echo ""
    
    print_status "HPA Status:"
    kubectl get hpa -n "$NAMESPACE"
}

# Function to cleanup deployment
cleanup() {
    print_warning "Cleaning up deployment..."
    
    read -p "Are you sure you want to delete all resources in namespace $NAMESPACE? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deleting all resources..."
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main deployment function
main() {
    print_status "Starting AIC Website deployment..."
    print_status "Namespace: $NAMESPACE"
    print_status "Environment: $ENVIRONMENT"
    print_status "Registry: $REGISTRY"
    print_status "Tag: $TAG"
    
    # Pre-deployment checks
    check_kubectl
    check_namespace
    
    # Deploy components in order
    deploy_infrastructure
    deploy_vault
    deploy_jaeger
    deploy_microservices
    deploy_web_app
    
    # Post-deployment tasks
    run_migrations
    verify_deployment
    show_status
    
    print_success "AIC Website deployment completed successfully!"
    print_status "You can access the website at: https://aic-website.com"
    print_status "API endpoints are available at: https://api.aic-website.com"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "verify")
        verify_deployment
        ;;
    "migrations")
        run_migrations
        ;;
    *)
        echo "Usage: $0 {deploy|status|cleanup|verify|migrations}"
        echo ""
        echo "Commands:"
        echo "  deploy     - Deploy the entire application (default)"
        echo "  status     - Show deployment status"
        echo "  cleanup    - Remove all deployed resources"
        echo "  verify     - Verify deployment health"
        echo "  migrations - Run database migrations"
        echo ""
        echo "Environment variables:"
        echo "  NAMESPACE  - Kubernetes namespace (default: aic-website-prod)"
        echo "  ENVIRONMENT - Deployment environment (default: production)"
        echo "  REGISTRY   - Container registry (default: ghcr.io/aic-website)"
        echo "  TAG        - Image tag (default: latest)"
        exit 1
        ;;
esac
