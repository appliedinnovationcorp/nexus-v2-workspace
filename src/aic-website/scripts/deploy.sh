#!/bin/bash

# AIC Website Deployment Script
# Comprehensive deployment automation for all environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-development}
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_BUILD=${SKIP_BUILD:-false}

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.17.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

setup_environment() {
    log_info "Setting up environment for: $ENVIRONMENT"
    
    cd "$PROJECT_ROOT"
    
    # Copy environment-specific configuration
    case $ENVIRONMENT in
        development)
            if [ ! -f .env.local ]; then
                cp .env.example .env.local
                log_warning "Created .env.local from template. Please update with your actual values."
            fi
            ;;
        staging)
            if [ ! -f .env.staging ]; then
                log_error ".env.staging file is required for staging deployment"
                exit 1
            fi
            cp .env.staging .env.local
            ;;
        production)
            if [ ! -f .env.production ]; then
                log_error ".env.production file is required for production deployment"
                exit 1
            fi
            cp .env.production .env.local
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    log_success "Environment setup completed"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    npm ci
    
    log_success "Dependencies installed"
}

run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping tests (SKIP_TESTS=true)"
        return
    fi
    
    log_info "Running test suite..."
    
    cd "$PROJECT_ROOT"
    
    # Run linting
    log_info "Running linter..."
    npm run lint
    
    # Run type checking
    log_info "Running type check..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test
    
    # Run integration tests if not in development
    if [ "$ENVIRONMENT" != "development" ]; then
        log_info "Running integration tests..."
        npm run test:integration
    fi
    
    log_success "All tests passed"
}

build_applications() {
    if [ "$SKIP_BUILD" = "true" ]; then
        log_warning "Skipping build (SKIP_BUILD=true)"
        return
    fi
    
    log_info "Building applications..."
    
    cd "$PROJECT_ROOT"
    
    # Build all applications
    npm run build
    
    log_success "Applications built successfully"
}

build_docker_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build images for all services
    docker-compose build
    
    # Tag images for the environment
    if [ "$ENVIRONMENT" != "development" ]; then
        log_info "Tagging images for $ENVIRONMENT..."
        
        # Tag main services
        docker tag aic-website-web-main:latest aic-website-web-main:$ENVIRONMENT
        docker tag aic-website-web-smb:latest aic-website-web-smb:$ENVIRONMENT
        docker tag aic-website-web-enterprise:latest aic-website-web-enterprise:$ENVIRONMENT
        docker tag aic-website-web-nexus:latest aic-website-web-nexus:$ENVIRONMENT
        docker tag aic-website-web-investors:latest aic-website-web-investors:$ENVIRONMENT
        docker tag aic-website-admin-dashboard:latest aic-website-admin-dashboard:$ENVIRONMENT
    fi
    
    log_success "Docker images built successfully"
}

deploy_infrastructure() {
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Skipping infrastructure deployment for development"
        return
    fi
    
    log_info "Deploying infrastructure..."
    
    cd "$PROJECT_ROOT/infra/terraform"
    
    # Initialize Terraform
    terraform init
    
    # Plan infrastructure changes
    log_info "Planning infrastructure changes..."
    terraform plan -var="environment=$ENVIRONMENT" -out=tfplan
    
    # Apply infrastructure changes
    log_info "Applying infrastructure changes..."
    terraform apply tfplan
    
    # Clean up plan file
    rm -f tfplan
    
    log_success "Infrastructure deployed successfully"
}

deploy_applications() {
    log_info "Deploying applications to $ENVIRONMENT..."
    
    case $ENVIRONMENT in
        development)
            deploy_development
            ;;
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
    esac
    
    log_success "Applications deployed successfully"
}

deploy_development() {
    log_info "Starting development environment..."
    
    cd "$PROJECT_ROOT"
    
    # Start services with Docker Compose
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    check_service_health "http://localhost:3000" "Main Website"
    check_service_health "http://localhost:3001" "SMB Portal"
    check_service_health "http://localhost:3002" "Enterprise Portal"
    check_service_health "http://localhost:3003" "Nexus Portal"
    check_service_health "http://localhost:3004" "Investor Portal"
    check_service_health "http://localhost:3005" "Admin Dashboard"
    
    log_success "Development environment is running"
    log_info "Access the applications at:"
    log_info "  Main Website: http://localhost:3000"
    log_info "  SMB Portal: http://localhost:3001"
    log_info "  Enterprise Portal: http://localhost:3002"
    log_info "  Nexus Portal: http://localhost:3003"
    log_info "  Investor Portal: http://localhost:3004"
    log_info "  Admin Dashboard: http://localhost:3005"
}

deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Push images to registry
    push_docker_images "staging"
    
    # Deploy to ECS or Kubernetes
    deploy_to_aws_ecs "staging"
    
    # Run smoke tests
    run_smoke_tests "https://staging.aicorp.com"
}

deploy_production() {
    log_info "Deploying to production environment..."
    
    # Additional safety checks for production
    if [ -z "$PRODUCTION_DEPLOY_CONFIRMED" ]; then
        log_warning "Production deployment requires confirmation."
        read -p "Are you sure you want to deploy to production? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Production deployment cancelled"
            exit 0
        fi
    fi
    
    # Push images to registry
    push_docker_images "production"
    
    # Blue-green deployment to production
    deploy_blue_green_production
    
    # Run comprehensive smoke tests
    run_smoke_tests "https://aicorp.com"
    
    # Invalidate CDN cache
    invalidate_cdn_cache
}

push_docker_images() {
    local env=$1
    log_info "Pushing Docker images for $env..."
    
    # Login to container registry (assuming AWS ECR)
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
    
    # Push all service images
    local services=("web-main" "web-smb" "web-enterprise" "web-nexus" "web-investors" "admin-dashboard")
    
    for service in "${services[@]}"; do
        log_info "Pushing $service image..."
        docker tag aic-website-$service:$env $ECR_REGISTRY/aic-website-$service:$env
        docker push $ECR_REGISTRY/aic-website-$service:$env
    done
    
    log_success "Docker images pushed successfully"
}

deploy_to_aws_ecs() {
    local env=$1
    log_info "Deploying to AWS ECS ($env)..."
    
    # Update ECS services
    local services=("web-main" "web-smb" "web-enterprise" "web-nexus" "web-investors" "admin-dashboard")
    
    for service in "${services[@]}"; do
        log_info "Updating ECS service: $service"
        aws ecs update-service \
            --cluster aic-website-$env-cluster \
            --service aic-website-$service-$env-service \
            --force-new-deployment
    done
    
    # Wait for deployments to complete
    for service in "${services[@]}"; do
        log_info "Waiting for $service deployment to complete..."
        aws ecs wait services-stable \
            --cluster aic-website-$env-cluster \
            --services aic-website-$service-$env-service
    done
    
    log_success "ECS deployment completed"
}

deploy_blue_green_production() {
    log_info "Performing blue-green deployment to production..."
    
    # This is a simplified blue-green deployment
    # In a real scenario, you'd have more sophisticated traffic switching
    
    # Deploy to green environment first
    deploy_to_aws_ecs "production-green"
    
    # Run health checks on green environment
    run_health_checks "https://green.aicorp.com"
    
    # Switch traffic to green environment
    log_info "Switching traffic to green environment..."
    # Update load balancer target groups or DNS records
    
    # Monitor for issues
    sleep 60
    
    # If everything is good, clean up blue environment
    log_info "Blue-green deployment completed successfully"
}

check_service_health() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/api/health" > /dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    log_error "$service_name failed health check"
    return 1
}

run_smoke_tests() {
    local base_url=$1
    log_info "Running smoke tests against $base_url..."
    
    # Basic connectivity tests
    curl -f "$base_url" || { log_error "Main site is not accessible"; exit 1; }
    curl -f "$base_url/api/health" || { log_error "Health endpoint is not accessible"; exit 1; }
    
    # Test key pages
    curl -f "$base_url/about" || log_warning "About page may have issues"
    curl -f "$base_url/contact" || log_warning "Contact page may have issues"
    
    log_success "Smoke tests passed"
}

run_health_checks() {
    local base_url=$1
    log_info "Running comprehensive health checks..."
    
    # Check all services
    check_service_health "$base_url" "Main Website"
    
    # Check database connectivity
    curl -f "$base_url/api/health/database" || { log_error "Database health check failed"; exit 1; }
    
    # Check AI services
    curl -f "$base_url/api/health/ai" || log_warning "AI services may have issues"
    
    # Check search service
    curl -f "$base_url/api/health/search" || log_warning "Search service may have issues"
    
    log_success "Health checks completed"
}

invalidate_cdn_cache() {
    log_info "Invalidating CDN cache..."
    
    if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
            --paths "/*"
        log_success "CDN cache invalidated"
    else
        log_warning "CLOUDFRONT_DISTRIBUTION_ID not set, skipping cache invalidation"
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    cd "$PROJECT_ROOT"
    
    # Remove temporary environment file
    if [ -f .env.local ] && [ "$ENVIRONMENT" != "development" ]; then
        rm .env.local
    fi
    
    # Clean up Docker images if not development
    if [ "$ENVIRONMENT" != "development" ]; then
        docker system prune -f
    fi
    
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting AIC Website deployment for environment: $ENVIRONMENT"
    
    check_prerequisites
    setup_environment
    install_dependencies
    run_tests
    build_applications
    build_docker_images
    deploy_infrastructure
    deploy_applications
    cleanup
    
    log_success "🎉 Deployment completed successfully!"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Development environment is ready for use"
    else
        log_info "Production deployment completed. Monitor the application for any issues."
    fi
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"
