#!/bin/bash

# AIC Website Configuration Management Script
# Manages ConfigMaps and environment-specific configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE_BACKEND="backend-services"
NAMESPACE_AI="ai-services"
NAMESPACE_CMS="cms"
NAMESPACE_OBSERVABILITY="observability"
NAMESPACE_SECURITY="security"

CONFIG_DIR="infrastructure/kubernetes/config"
SERVICES_DIR="infrastructure/kubernetes/services"

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

# Function to validate ConfigMap YAML files
validate_configmaps() {
    log_info "Validating ConfigMap YAML files..."
    
    local errors=0
    
    # Find all ConfigMap YAML files
    while IFS= read -r -d '' file; do
        log_info "Validating $file"
        
        # Check YAML syntax
        if ! kubectl --dry-run=client apply -f "$file" >/dev/null 2>&1; then
            log_error "Invalid YAML syntax in $file"
            ((errors++))
        fi
        
        # Check for required labels
        if ! grep -q "part-of: aic-website" "$file"; then
            log_warning "Missing 'part-of: aic-website' label in $file"
        fi
        
    done < <(find "$CONFIG_DIR" "$SERVICES_DIR" -name "*configmap*.yaml" -print0)
    
    if [ $errors -eq 0 ]; then
        log_success "All ConfigMaps are valid"
        return 0
    else
        log_error "Found $errors invalid ConfigMaps"
        return 1
    fi
}

# Function to apply ConfigMaps for a specific environment
apply_environment_config() {
    local environment=$1
    
    if [ -z "$environment" ]; then
        log_error "Environment not specified"
        return 1
    fi
    
    log_info "Applying $environment configuration..."
    
    # Apply shared configuration first
    kubectl apply -f "$CONFIG_DIR/shared-config.yaml"
    
    # Apply environment-specific configuration
    if [ -f "$CONFIG_DIR/${environment}-config.yaml" ]; then
        kubectl apply -f "$CONFIG_DIR/${environment}-config.yaml"
        log_success "Applied $environment configuration"
    else
        log_error "Configuration file for $environment not found"
        return 1
    fi
    
    # Apply service-specific ConfigMaps
    kubectl apply -f "$SERVICES_DIR/backend/configmap.yaml"
    kubectl apply -f "$SERVICES_DIR/backend/advanced-configmap.yaml"
    kubectl apply -f "$SERVICES_DIR/ai/ai-services-configmap.yaml"
    kubectl apply -f "$SERVICES_DIR/cms/ghost-configmap.yaml"
    
    log_success "All ConfigMaps applied successfully"
}

# Function to backup current ConfigMaps
backup_configmaps() {
    local backup_dir="backups/configmaps/$(date +%Y%m%d_%H%M%S)"
    
    log_info "Creating ConfigMap backup in $backup_dir"
    mkdir -p "$backup_dir"
    
    # Backup ConfigMaps from all namespaces
    for namespace in $NAMESPACE_BACKEND $NAMESPACE_AI $NAMESPACE_CMS $NAMESPACE_OBSERVABILITY $NAMESPACE_SECURITY; do
        log_info "Backing up ConfigMaps from namespace: $namespace"
        
        kubectl get configmaps -n "$namespace" -o yaml > "$backup_dir/${namespace}-configmaps.yaml"
    done
    
    log_success "ConfigMaps backed up to $backup_dir"
}

# Function to compare ConfigMaps between environments
compare_environments() {
    local env1=$1
    local env2=$2
    
    if [ -z "$env1" ] || [ -z "$env2" ]; then
        log_error "Two environments must be specified for comparison"
        return 1
    fi
    
    log_info "Comparing configurations between $env1 and $env2"
    
    if [ -f "$CONFIG_DIR/${env1}-config.yaml" ] && [ -f "$CONFIG_DIR/${env2}-config.yaml" ]; then
        diff -u "$CONFIG_DIR/${env1}-config.yaml" "$CONFIG_DIR/${env2}-config.yaml" || true
    else
        log_error "Configuration files not found for comparison"
        return 1
    fi
}

# Function to generate configuration documentation
generate_docs() {
    local docs_file="docs/configuration.md"
    
    log_info "Generating configuration documentation..."
    
    cat > "$docs_file" << EOF
# AIC Website Configuration Documentation

Generated on: $(date)

## ConfigMaps Overview

### Shared Configuration
- **File**: \`infrastructure/kubernetes/config/shared-config.yaml\`
- **Purpose**: Application-wide constants and shared settings
- **Namespaces**: All

### Environment-Specific Configuration

#### Development
- **File**: \`infrastructure/kubernetes/config/development-config.yaml\`
- **Purpose**: Development environment settings
- **Features**: Debug mode, local services, relaxed security

#### Staging  
- **File**: \`infrastructure/kubernetes/config/staging-config.yaml\`
- **Purpose**: Staging environment settings
- **Features**: Production-like with monitoring, cost tracking

#### Production
- **File**: \`infrastructure/kubernetes/config/production-config.yaml\`
- **Purpose**: Production environment settings
- **Features**: High security, performance optimization, full monitoring

### Service-Specific Configuration

#### Backend Services
- **Basic Config**: \`infrastructure/kubernetes/services/backend/configmap.yaml\`
- **Advanced Config**: \`infrastructure/kubernetes/services/backend/advanced-configmap.yaml\`
- **Features**: CQRS, Saga patterns, Circuit breakers

#### AI Services
- **Config**: \`infrastructure/kubernetes/services/ai/ai-services-configmap.yaml\`
- **Features**: Multi-provider AI, caching, rate limiting, cost tracking

#### CMS (Ghost)
- **Config**: \`infrastructure/kubernetes/services/cms/ghost-configmap.yaml\`
- **Features**: Performance optimization, caching, metrics for HPA

## Configuration Management

### Validation
\`\`\`bash
./scripts/config-management.sh validate
\`\`\`

### Apply Environment Configuration
\`\`\`bash
./scripts/config-management.sh apply <environment>
\`\`\`

### Backup ConfigMaps
\`\`\`bash
./scripts/config-management.sh backup
\`\`\`

### Compare Environments
\`\`\`bash
./scripts/config-management.sh compare <env1> <env2>
\`\`\`

## Best Practices

1. **Always validate** ConfigMaps before applying
2. **Backup** before making changes
3. **Use environment-specific** configurations
4. **Follow naming conventions** for consistency
5. **Include proper labels** for resource management
6. **Document changes** in version control

EOF

    log_success "Configuration documentation generated: $docs_file"
}

# Function to restart deployments after ConfigMap changes
restart_deployments() {
    local environment=$1
    
    log_info "Restarting deployments to pick up new configuration..."
    
    # Restart backend services
    kubectl rollout restart deployment/backend-api -n $NAMESPACE_BACKEND
    
    # Restart AI services
    kubectl rollout restart deployment/ai-services -n $NAMESPACE_AI
    
    # Restart CMS
    kubectl rollout restart deployment/ghost-cms -n $NAMESPACE_CMS
    
    log_success "All deployments restarted"
}

# Main script logic
case "$1" in
    validate)
        validate_configmaps
        ;;
    apply)
        if [ -z "$2" ]; then
            log_error "Usage: $0 apply <environment>"
            exit 1
        fi
        apply_environment_config "$2"
        ;;
    backup)
        backup_configmaps
        ;;
    compare)
        if [ -z "$2" ] || [ -z "$3" ]; then
            log_error "Usage: $0 compare <env1> <env2>"
            exit 1
        fi
        compare_environments "$2" "$3"
        ;;
    docs)
        generate_docs
        ;;
    restart)
        restart_deployments "$2"
        ;;
    *)
        echo "Usage: $0 {validate|apply|backup|compare|docs|restart}"
        echo ""
        echo "Commands:"
        echo "  validate              - Validate all ConfigMap YAML files"
        echo "  apply <environment>   - Apply configuration for specific environment"
        echo "  backup               - Backup current ConfigMaps"
        echo "  compare <env1> <env2> - Compare configurations between environments"
        echo "  docs                 - Generate configuration documentation"
        echo "  restart <environment> - Restart deployments after config changes"
        echo ""
        echo "Examples:"
        echo "  $0 validate"
        echo "  $0 apply production"
        echo "  $0 compare development production"
        exit 1
        ;;
esac
