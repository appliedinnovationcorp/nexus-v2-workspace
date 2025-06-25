#!/bin/bash

# AIC Website Local Setup Script
# Quick setup for local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info "🚀 Setting up AIC Website for local development..."

# Check prerequisites
log_info "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed."; exit 1; }

# Navigate to project root
cd "$PROJECT_ROOT"

# Install dependencies
log_info "Installing dependencies..."
npm install

# Setup environment variables
log_info "Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    log_success "Created .env.local from template"
    log_warning "Please update .env.local with your actual API keys and configuration"
else
    log_info ".env.local already exists, skipping..."
fi

# Start infrastructure services
log_info "Starting infrastructure services (databases, search, etc.)..."
docker-compose up -d postgres mongodb redis meilisearch ollama prometheus grafana

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 15

# Check if services are running
log_info "Checking service health..."
if docker-compose ps | grep -q "Up"; then
    log_success "Infrastructure services are running"
else
    log_error "Some services failed to start. Check docker-compose logs for details."
    exit 1
fi

# Initialize databases
log_info "Initializing databases..."
# Wait a bit more for databases to be fully ready
sleep 10

# Run database migrations (if any)
log_info "Running database setup..."
npm run db:setup 2>/dev/null || log_warning "Database setup skipped (command not found)"

# Seed initial content
log_info "Seeding initial content..."
npm run seed 2>/dev/null || log_warning "Content seeding skipped (command not found)"

# Build the applications
log_info "Building applications..."
npm run build

log_success "🎉 Local setup completed successfully!"

echo ""
log_info "📋 Next steps:"
echo "1. Update .env.local with your API keys (OpenAI, etc.)"
echo "2. Run 'npm run dev' to start the development servers"
echo "3. Access the applications at:"
echo "   • Main Website: http://localhost:3000"
echo "   • SMB Portal: http://localhost:3001"
echo "   • Enterprise Portal: http://localhost:3002"
echo "   • Nexus Portal: http://localhost:3003"
echo "   • Investor Portal: http://localhost:3004"
echo "   • Admin Dashboard: http://localhost:3005"
echo ""
log_info "🔧 Development tools:"
echo "   • Grafana (Monitoring): http://localhost:3007 (admin/admin)"
echo "   • Meilisearch: http://localhost:7700"
echo "   • Prometheus: http://localhost:9090"
echo ""
log_info "📚 Useful commands:"
echo "   • npm run dev          - Start development servers"
echo "   • npm run test         - Run test suite"
echo "   • npm run lint         - Run linter"
echo "   • npm run build        - Build for production"
echo "   • docker-compose logs  - View service logs"
echo ""
log_success "Happy coding! 🚀"
