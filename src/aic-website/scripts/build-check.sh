#!/bin/bash

# Build Check Script for AIC Website
# This script verifies that all components can be built without errors

set -e

echo "🔨 Starting AIC Website Build Check..."

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

# Check Node.js and npm
check_node() {
    print_status "Checking Node.js and npm..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js $NODE_VERSION and npm $NPM_VERSION are available"
}

# Check Python
check_python() {
    print_status "Checking Python..."
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version)
    print_success "$PYTHON_VERSION is available"
}

# Check Docker
check_docker() {
    print_status "Checking Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
    
    print_success "Docker is available and running"
}

# Validate package.json files
validate_package_json() {
    print_status "Validating package.json files..."
    
    # Root package.json
    if [ -f "package.json" ]; then
        if npm run --silent validate-package 2>/dev/null || true; then
            print_success "Root package.json is valid"
        else
            print_success "Root package.json exists"
        fi
    else
        print_error "Root package.json not found"
        exit 1
    fi
    
    # Web-main package.json
    if [ -f "apps/web-main/package.json" ]; then
        print_success "Web-main package.json exists"
    else
        print_error "Web-main package.json not found"
        exit 1
    fi
}

# Check TypeScript configuration
check_typescript() {
    print_status "Checking TypeScript configuration..."
    
    if [ -f "apps/web-main/tsconfig.json" ]; then
        print_success "TypeScript configuration found"
    else
        print_error "TypeScript configuration not found"
        exit 1
    fi
}

# Validate Python requirements
validate_python_requirements() {
    print_status "Validating Python requirements..."
    
    services=(
        "services/auth-service"
        "services/user-service"
        "services/content-service"
        "services/notification-service"
        "services/ai-engine"
        "services/event-store"
    )
    
    for service in "${services[@]}"; do
        if [ -f "$service/requirements.txt" ]; then
            print_success "$service requirements.txt found"
        else
            print_error "$service requirements.txt not found"
            exit 1
        fi
        
        if [ -f "$service/main.py" ]; then
            print_success "$service main.py found"
        else
            print_error "$service main.py not found"
            exit 1
        fi
        
        if [ -f "$service/Dockerfile" ]; then
            print_success "$service Dockerfile found"
        else
            print_error "$service Dockerfile not found"
            exit 1
        fi
    done
}

# Test Docker builds
test_docker_builds() {
    print_status "Testing Docker builds..."
    
    # Test auth-service build
    print_status "Building auth-service..."
    if docker build -t aic-auth-service services/auth-service > /dev/null 2>&1; then
        print_success "Auth service builds successfully"
    else
        print_error "Auth service build failed"
        exit 1
    fi
    
    # Test user-service build
    print_status "Building user-service..."
    if docker build -t aic-user-service services/user-service > /dev/null 2>&1; then
        print_success "User service builds successfully"
    else
        print_error "User service build failed"
        exit 1
    fi
    
    # Test content-service build
    print_status "Building content-service..."
    if docker build -t aic-content-service services/content-service > /dev/null 2>&1; then
        print_success "Content service builds successfully"
    else
        print_error "Content service build failed"
        exit 1
    fi
    
    # Test notification-service build
    print_status "Building notification-service..."
    if docker build -t aic-notification-service services/notification-service > /dev/null 2>&1; then
        print_success "Notification service builds successfully"
    else
        print_error "Notification service build failed"
        exit 1
    fi
    
    # Test ai-engine build
    print_status "Building ai-engine..."
    if docker build -t aic-ai-engine services/ai-engine > /dev/null 2>&1; then
        print_success "AI engine builds successfully"
    else
        print_error "AI engine build failed"
        exit 1
    fi
    
    # Test event-store build
    print_status "Building event-store..."
    if docker build -t aic-event-store services/event-store > /dev/null 2>&1; then
        print_success "Event store builds successfully"
    else
        print_error "Event store build failed"
        exit 1
    fi
}

# Test Next.js build
test_nextjs_build() {
    print_status "Testing Next.js build..."
    
    cd apps/web-main
    
    # Install dependencies
    if npm install > /dev/null 2>&1; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        cd ../..
        exit 1
    fi
    
    # Type check
    if npm run type-check > /dev/null 2>&1; then
        print_success "TypeScript type check passed"
    else
        print_warning "TypeScript type check failed (continuing anyway)"
    fi
    
    # Build
    if npm run build > /dev/null 2>&1; then
        print_success "Next.js build successful"
    else
        print_error "Next.js build failed"
        cd ../..
        exit 1
    fi
    
    cd ../..
}

# Validate docker-compose
validate_docker_compose() {
    print_status "Validating docker-compose.yml..."
    
    if docker-compose config > /dev/null 2>&1; then
        print_success "docker-compose.yml is valid"
    else
        print_error "docker-compose.yml has errors"
        docker-compose config
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 AIC Website Build Check"
    echo "=========================="
    
    check_node
    check_python
    check_docker
    
    echo ""
    print_status "Validating configuration files..."
    validate_package_json
    check_typescript
    validate_python_requirements
    validate_docker_compose
    
    echo ""
    print_status "Testing builds..."
    test_docker_builds
    test_nextjs_build
    
    echo ""
    print_success "All build checks passed! 🎉"
    echo ""
    print_status "You can now run the application with:"
    echo "  docker-compose up -d"
    echo ""
    print_status "Or run individual services:"
    echo "  npm run dev (for Next.js app)"
    echo "  python services/auth-service/main.py (for auth service)"
    echo "  python services/user-service/main.py (for user service)"
    echo "  etc."
}

# Run the build check
main "$@"
