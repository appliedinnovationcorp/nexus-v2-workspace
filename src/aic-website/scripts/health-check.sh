#!/bin/bash

# Health Check Script for AIC Website
# This script checks if all services are running correctly

set -e

echo "🔍 Starting AIC Website Health Check..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if docker-compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Validate docker-compose.yml
validate_compose() {
    print_status "Validating docker-compose.yml..."
    if docker-compose config > /dev/null 2>&1; then
        print_success "docker-compose.yml is valid"
    else
        print_error "docker-compose.yml has errors"
        docker-compose config
        exit 1
    fi
}

# Check if services are running
check_services() {
    print_status "Checking running services..."
    
    services=(
        "postgres:5432"
        "redis:6379"
        "mongodb:27017"
        "meilisearch:7700"
        "auth-service:8000"
        "user-service:8001"
        "content-service:8002"
        "notification-service:8003"
        "ai-engine:8004"
        "event-store:8005"
        "web-main:3000"
        "jaeger:16686"
        "prometheus:9090"
        "grafana:3001"
    )
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)
        
        if curl -f -s "http://localhost:$port" > /dev/null 2>&1 || \
           curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$service_name is responding on port $port"
        else
            print_warning "$service_name is not responding on port $port"
        fi
    done
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test auth service
    if curl -f -s "http://localhost:8000/health" > /dev/null; then
        print_success "Auth service health check passed"
    else
        print_warning "Auth service health check failed"
    fi
    
    # Test user service
    if curl -f -s "http://localhost:8001/health" > /dev/null; then
        print_success "User service health check passed"
    else
        print_warning "User service health check failed"
    fi
    
    # Test content service
    if curl -f -s "http://localhost:8002/health" > /dev/null; then
        print_success "Content service health check passed"
    else
        print_warning "Content service health check failed"
    fi
    
    # Test notification service
    if curl -f -s "http://localhost:8003/health" > /dev/null; then
        print_success "Notification service health check passed"
    else
        print_warning "Notification service health check failed"
    fi
    
    # Test AI engine
    if curl -f -s "http://localhost:8004/health" > /dev/null; then
        print_success "AI engine health check passed"
    else
        print_warning "AI engine health check failed"
    fi
    
    # Test event store
    if curl -f -s "http://localhost:8005/health" > /dev/null; then
        print_success "Event store health check passed"
    else
        print_warning "Event store health check failed"
    fi
    
    # Test web main
    if curl -f -s "http://localhost:3000" > /dev/null; then
        print_success "Web main is responding"
    else
        print_warning "Web main is not responding"
    fi
}

# Main execution
main() {
    echo "🚀 AIC Website Health Check"
    echo "=========================="
    
    check_docker
    check_docker_compose
    validate_compose
    
    echo ""
    print_status "If services are not running, start them with: docker-compose up -d"
    echo ""
    
    check_services
    test_api_endpoints
    
    echo ""
    print_success "Health check completed!"
    echo ""
    print_status "Access points:"
    echo "  - Main Website: http://localhost:3000"
    echo "  - Auth Service: http://localhost:8000"
    echo "  - User Service: http://localhost:8001"
    echo "  - Content Service: http://localhost:8002"
    echo "  - Notification Service: http://localhost:8003"
    echo "  - AI Engine: http://localhost:8004"
    echo "  - Event Store: http://localhost:8005"
    echo "  - Jaeger UI: http://localhost:16686"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
}

# Run the health check
main "$@"
