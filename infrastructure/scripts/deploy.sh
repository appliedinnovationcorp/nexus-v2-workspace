#!/bin/bash

# AIC Platform Deployment Script
# This script deploys the complete AIC platform infrastructure and applications

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"

# Default values
ENVIRONMENT="${ENVIRONMENT:-production}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-aws}"
REGION="${REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-aic-platform}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_INFRA="${SKIP_INFRA:-false}"
SKIP_APPS="${SKIP_APPS:-false}"

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

# Help function
show_help() {
    cat << EOF
AIC Platform Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENVIRONMENT    Environment to deploy (production, staging, development)
    -c, --cloud-provider PROVIDER    Cloud provider (aws, azure, gcp)
    -r, --region REGION             Cloud region
    -n, --cluster-name NAME         Kubernetes cluster name
    --dry-run                       Show what would be deployed without executing
    --skip-infra                    Skip infrastructure deployment
    --skip-apps                     Skip application deployment
    -h, --help                      Show this help message

Environment Variables:
    ENVIRONMENT                     Same as --environment
    CLOUD_PROVIDER                  Same as --cloud-provider
    REGION                          Same as --region
    CLUSTER_NAME                    Same as --cluster-name
    DRY_RUN                         Same as --dry-run
    SKIP_INFRA                      Same as --skip-infra
    SKIP_APPS                       Same as --skip-apps

Examples:
    # Deploy to production on AWS
    $0 --environment production --cloud-provider aws --region us-east-1

    # Deploy to staging on Azure
    $0 --environment staging --cloud-provider azure --region eastus

    # Dry run deployment
    $0 --dry-run

    # Deploy only applications (skip infrastructure)
    $0 --skip-infra
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--cloud-provider)
            CLOUD_PROVIDER="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -n|--cluster-name)
            CLUSTER_NAME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --skip-infra)
            SKIP_INFRA="true"
            shift
            ;;
        --skip-apps)
            SKIP_APPS="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validation
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    
    # Cloud-specific tools
    case $CLOUD_PROVIDER in
        aws)
            command -v aws >/dev/null 2>&1 || missing_tools+=("aws-cli")
            ;;
        azure)
            command -v az >/dev/null 2>&1 || missing_tools+=("azure-cli")
            ;;
        gcp)
            command -v gcloud >/dev/null 2>&1 || missing_tools+=("gcloud")
            ;;
    esac
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and try again."
        exit 1
    fi
    
    # Validate environment values
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: production, staging, development"
        exit 1
    fi
    
    if [[ ! "$CLOUD_PROVIDER" =~ ^(aws|azure|gcp)$ ]]; then
        log_error "Invalid cloud provider: $CLOUD_PROVIDER. Must be one of: aws, azure, gcp"
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Deploy infrastructure
deploy_infrastructure() {
    if [[ "$SKIP_INFRA" == "true" ]]; then
        log_info "Skipping infrastructure deployment"
        return 0
    fi
    
    log_info "Deploying infrastructure for $ENVIRONMENT environment on $CLOUD_PROVIDER..."
    
    cd "$INFRA_DIR/terraform"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would run: terraform init"
    else
        terraform init
    fi
    
    # Plan deployment
    log_info "Planning infrastructure deployment..."
    local plan_args=(
        -var="environment=$ENVIRONMENT"
        -var="cloud_provider=$CLOUD_PROVIDER"
        -var="region=$REGION"
        -var="cluster_name=$CLUSTER_NAME"
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would run: terraform plan ${plan_args[*]}"
    else
        terraform plan "${plan_args[@]}"
        
        # Apply if not dry run
        log_info "Applying infrastructure changes..."
        terraform apply -auto-approve "${plan_args[@]}"
    fi
    
    log_success "Infrastructure deployment completed"
}

# Configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl..."
    
    case $CLOUD_PROVIDER in
        aws)
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would run: aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME-$ENVIRONMENT"
            else
                aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME-$ENVIRONMENT"
            fi
            ;;
        azure)
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would run: az aks get-credentials --resource-group $CLUSTER_NAME-$ENVIRONMENT-rg --name $CLUSTER_NAME-$ENVIRONMENT"
            else
                az aks get-credentials --resource-group "$CLUSTER_NAME-$ENVIRONMENT-rg" --name "$CLUSTER_NAME-$ENVIRONMENT"
            fi
            ;;
        gcp)
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would run: gcloud container clusters get-credentials $CLUSTER_NAME-$ENVIRONMENT --region $REGION"
            else
                gcloud container clusters get-credentials "$CLUSTER_NAME-$ENVIRONMENT" --region "$REGION"
            fi
            ;;
    esac
    
    log_success "kubectl configured"
}

# Deploy Kubernetes applications
deploy_applications() {
    if [[ "$SKIP_APPS" == "true" ]]; then
        log_info "Skipping application deployment"
        return 0
    fi
    
    log_info "Deploying Kubernetes applications..."
    
    cd "$INFRA_DIR/kubernetes"
    
    # Create namespace and apply base configurations
    log_info "Creating namespace and base configurations..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply Kubernetes manifests"
    else
        kubectl apply -f namespace.yaml
        kubectl apply -f ../environments/${ENVIRONMENT}.yaml
    fi
    
    # Deploy secrets management
    log_info "Deploying secrets management..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy External Secrets Operator"
    else
        helm repo add external-secrets https://charts.external-secrets.io
        helm repo update
        helm upgrade --install external-secrets external-secrets/external-secrets \
            --namespace external-secrets-system \
            --create-namespace \
            --set installCRDs=true
        
        # Apply secret store configurations
        kubectl apply -f ../secrets/secrets-manager.yaml
    fi
    
    # Deploy database
    log_info "Deploying database..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy PostgreSQL"
    else
        kubectl apply -f database.yaml
    fi
    
    # Deploy Redis
    log_info "Deploying Redis..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy Redis"
    else
        kubectl apply -f redis.yaml
    fi
    
    # Deploy main application
    log_info "Deploying main application..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy AIC website application"
    else
        kubectl apply -f main-application.yaml
    fi
    
    # Deploy monitoring stack
    if [[ "$ENVIRONMENT" != "development" ]]; then
        log_info "Deploying monitoring stack..."
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would deploy monitoring stack"
        else
            kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
            kubectl apply -f ../monitoring/prometheus.yaml
            
            # Deploy Grafana
            helm repo add grafana https://grafana.github.io/helm-charts
            helm repo update
            helm upgrade --install grafana grafana/grafana \
                --namespace monitoring \
                --set persistence.enabled=true \
                --set persistence.size=10Gi \
                --set adminPassword="$(openssl rand -base64 16)" \
                --set service.type=ClusterIP
        fi
    fi
    
    # Apply security policies
    log_info "Applying security policies..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would apply security policies"
    else
        kubectl apply -f ../security/pod-security-policies.yaml
    fi
    
    log_success "Application deployment completed"
}

# Wait for deployments
wait_for_deployments() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would wait for deployments to be ready"
        return 0
    fi
    
    log_info "Waiting for deployments to be ready..."
    
    # Wait for main application
    kubectl wait --for=condition=available --timeout=600s deployment/aic-website -n aic-platform
    
    # Wait for database
    kubectl wait --for=condition=ready --timeout=600s statefulset/postgresql-primary -n aic-platform
    
    # Wait for Redis
    kubectl wait --for=condition=ready --timeout=600s statefulset/redis-master -n aic-platform
    
    log_success "All deployments are ready"
}

# Verify deployment
verify_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would verify deployment"
        return 0
    fi
    
    log_info "Verifying deployment..."
    
    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n aic-platform
    
    # Check services
    log_info "Checking services..."
    kubectl get services -n aic-platform
    
    # Check ingress
    log_info "Checking ingress..."
    kubectl get ingress -n aic-platform || true
    
    # Run health checks
    log_info "Running health checks..."
    local website_pod=$(kubectl get pods -n aic-platform -l app=aic-website -o jsonpath='{.items[0].metadata.name}')
    if [[ -n "$website_pod" ]]; then
        kubectl exec -n aic-platform "$website_pod" -- curl -f http://localhost:3000/api/health || log_warning "Health check failed"
    fi
    
    log_success "Deployment verification completed"
}

# Main deployment function
main() {
    log_info "Starting AIC Platform deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Cloud Provider: $CLOUD_PROVIDER"
    log_info "Region: $REGION"
    log_info "Cluster Name: $CLUSTER_NAME"
    log_info "Dry Run: $DRY_RUN"
    
    validate_prerequisites
    deploy_infrastructure
    configure_kubectl
    deploy_applications
    wait_for_deployments
    verify_deployment
    
    log_success "AIC Platform deployment completed successfully!"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        log_info "Access URLs:"
        log_info "  Main Site: https://aicorp.com"
        log_info "  SMB Portal: https://smb.aicorp.com"
        log_info "  Enterprise: https://enterprise.aicorp.com"
        log_info "  Nexus: https://nexus.aicorp.com"
        log_info "  Investors: https://investors.aicorp.com"
        log_info "  Admin: https://admin.aicorp.com"
        
        if [[ "$ENVIRONMENT" != "development" ]]; then
            log_info "  Prometheus: https://prometheus.$ENVIRONMENT.aicorp.com"
            log_info "  Grafana: https://grafana.$ENVIRONMENT.aicorp.com"
        fi
    fi
}

# Run main function
main "$@"
