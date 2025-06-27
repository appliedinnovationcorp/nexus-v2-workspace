#!/bin/bash

# AIC Website Troubleshooting Script
# Automated diagnostics and fixes for common issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
NAMESPACES=("backend-services" "ai-services" "cms" "storage" "observability" "api-gateway")
DEPLOYMENTS=("backend-api" "ai-services" "ghost-cms" "postgresql" "redis" "mongodb" "prometheus" "grafana" "kong")

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

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

# Function to check system health
check_system_health() {
    log_info "Checking system health..."
    
    # Check cluster connectivity
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    # Check nodes
    local not_ready_nodes=$(kubectl get nodes --no-headers | grep -v Ready | wc -l)
    if [ "$not_ready_nodes" -gt 0 ]; then
        log_warning "$not_ready_nodes nodes are not ready"
        kubectl get nodes | grep -v Ready
    else
        log_success "All nodes are ready"
    fi
    
    # Check critical namespaces
    for namespace in "${NAMESPACES[@]}"; do
        if ! kubectl get namespace "$namespace" >/dev/null 2>&1; then
            log_error "Namespace $namespace does not exist"
        fi
    done
    
    # Check pod status
    local failing_pods=$(kubectl get pods --all-namespaces --no-headers | grep -v Running | grep -v Completed | wc -l)
    if [ "$failing_pods" -gt 0 ]; then
        log_warning "$failing_pods pods are not running"
        kubectl get pods --all-namespaces | grep -v Running | grep -v Completed
    else
        log_success "All pods are running"
    fi
}

# Function to check specific service
check_service() {
    local service=$1
    local namespace=$2
    
    log_info "Checking service: $service in namespace: $namespace"
    
    # Check deployment
    if kubectl get deployment "$service" -n "$namespace" >/dev/null 2>&1; then
        local ready_replicas=$(kubectl get deployment "$service" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
        local desired_replicas=$(kubectl get deployment "$service" -n "$namespace" -o jsonpath='{.spec.replicas}')
        
        if [ "$ready_replicas" = "$desired_replicas" ]; then
            log_success "$service: $ready_replicas/$desired_replicas replicas ready"
        else
            log_warning "$service: $ready_replicas/$desired_replicas replicas ready"
            kubectl describe deployment "$service" -n "$namespace" | tail -10
        fi
    else
        log_warning "Deployment $service not found in namespace $namespace"
    fi
    
    # Check service endpoints
    if kubectl get service "$service" -n "$namespace" >/dev/null 2>&1; then
        local endpoints=$(kubectl get endpoints "$service" -n "$namespace" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
        if [ "$endpoints" -gt 0 ]; then
            log_success "$service: $endpoints endpoints available"
        else
            log_error "$service: No endpoints available"
        fi
    fi
}

# Function to check database connectivity
check_databases() {
    log_info "Checking database connectivity..."
    
    # PostgreSQL
    if kubectl get pod postgresql-0 -n storage >/dev/null 2>&1; then
        if kubectl exec -it postgresql-0 -n storage -- pg_isready >/dev/null 2>&1; then
            log_success "PostgreSQL is ready"
        else
            log_error "PostgreSQL is not ready"
        fi
    fi
    
    # Redis
    if kubectl get pod redis-0 -n storage >/dev/null 2>&1; then
        if kubectl exec -it redis-0 -n storage -- redis-cli ping | grep -q PONG; then
            log_success "Redis is ready"
        else
            log_error "Redis is not ready"
        fi
    fi
    
    # MongoDB
    if kubectl get pod mongodb-0 -n storage >/dev/null 2>&1; then
        if kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            log_success "MongoDB is ready"
        else
            log_error "MongoDB is not ready"
        fi
    fi
}

# Function to check AI services
check_ai_services() {
    log_info "Checking AI services..."
    
    if kubectl get deployment ai-services -n ai-services >/dev/null 2>&1; then
        # Check AI service health
        local ai_pod=$(kubectl get pods -n ai-services -l app=ai-services -o jsonpath='{.items[0].metadata.name}')
        if [ -n "$ai_pod" ]; then
            if kubectl exec -it "$ai_pod" -n ai-services -- curl -s http://localhost:8080/health >/dev/null 2>&1; then
                log_success "AI services health check passed"
            else
                log_error "AI services health check failed"
            fi
            
            # Check AI providers
            log_info "Checking AI provider connectivity..."
            if kubectl exec -it "$ai_pod" -n ai-services -- curl -s https://api.openai.com >/dev/null 2>&1; then
                log_success "OpenAI connectivity OK"
            else
                log_warning "OpenAI connectivity issues"
            fi
        fi
    fi
}

# Function to check monitoring stack
check_monitoring() {
    log_info "Checking monitoring stack..."
    
    # Prometheus
    if kubectl get deployment prometheus -n observability >/dev/null 2>&1; then
        local prom_pod=$(kubectl get pods -n observability -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
        if [ -n "$prom_pod" ]; then
            if kubectl exec -it "$prom_pod" -n observability -- curl -s http://localhost:9090/-/healthy >/dev/null 2>&1; then
                log_success "Prometheus is healthy"
            else
                log_error "Prometheus health check failed"
            fi
        fi
    fi
    
    # Grafana
    if kubectl get deployment grafana -n observability >/dev/null 2>&1; then
        local grafana_pod=$(kubectl get pods -n observability -l app=grafana -o jsonpath='{.items[0].metadata.name}')
        if [ -n "$grafana_pod" ]; then
            if kubectl exec -it "$grafana_pod" -n observability -- curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
                log_success "Grafana is healthy"
            else
                log_error "Grafana health check failed"
            fi
        fi
    fi
}

# Function to check configuration
check_configuration() {
    log_info "Checking configuration..."
    
    # Check ConfigMaps
    local missing_configmaps=0
    for namespace in "${NAMESPACES[@]}"; do
        local configmaps=$(kubectl get configmaps -n "$namespace" --no-headers 2>/dev/null | wc -l)
        if [ "$configmaps" -eq 0 ]; then
            log_warning "No ConfigMaps found in namespace $namespace"
            ((missing_configmaps++))
        fi
    done
    
    if [ "$missing_configmaps" -eq 0 ]; then
        log_success "Configuration check passed"
    else
        log_warning "$missing_configmaps namespaces missing ConfigMaps"
    fi
    
    # Validate configuration syntax
    if command -v ./scripts/config-management.sh >/dev/null 2>&1; then
        if ./scripts/config-management.sh validate >/dev/null 2>&1; then
            log_success "Configuration validation passed"
        else
            log_error "Configuration validation failed"
        fi
    fi
}

# Function to fix common issues
fix_common_issues() {
    log_info "Attempting to fix common issues..."
    
    # Restart failed pods
    local failed_pods=$(kubectl get pods --all-namespaces --no-headers | grep -E "Error|CrashLoopBackOff|ImagePullBackOff" | awk '{print $2 " " $1}')
    if [ -n "$failed_pods" ]; then
        log_info "Restarting failed pods..."
        echo "$failed_pods" | while read -r pod namespace; do
            log_info "Deleting pod $pod in namespace $namespace"
            kubectl delete pod "$pod" -n "$namespace" --force --grace-period=0
        done
    fi
    
    # Clear Redis cache if needed
    if kubectl get pod redis-0 -n storage >/dev/null 2>&1; then
        log_info "Clearing Redis cache..."
        kubectl exec -it redis-0 -n storage -- redis-cli FLUSHDB >/dev/null 2>&1 || true
    fi
    
    # Restart deployments with issues
    for namespace in "${NAMESPACES[@]}"; do
        local deployments=$(kubectl get deployments -n "$namespace" --no-headers 2>/dev/null | awk '$2 != $3 {print $1}')
        if [ -n "$deployments" ]; then
            echo "$deployments" | while read -r deployment; do
                log_info "Restarting deployment $deployment in namespace $namespace"
                kubectl rollout restart deployment/"$deployment" -n "$namespace"
            done
        fi
    done
}

# Function to collect diagnostic information
collect_diagnostics() {
    local output_dir="diagnostics/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$output_dir"
    
    log_info "Collecting diagnostic information to $output_dir..."
    
    # Cluster information
    kubectl cluster-info > "$output_dir/cluster-info.txt" 2>&1
    kubectl get nodes -o wide > "$output_dir/nodes.txt" 2>&1
    kubectl get pods --all-namespaces -o wide > "$output_dir/pods.txt" 2>&1
    kubectl get services --all-namespaces > "$output_dir/services.txt" 2>&1
    kubectl get ingress --all-namespaces > "$output_dir/ingress.txt" 2>&1
    
    # Events
    kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp > "$output_dir/events.txt" 2>&1
    
    # Resource usage
    kubectl top nodes > "$output_dir/node-usage.txt" 2>&1
    kubectl top pods --all-namespaces > "$output_dir/pod-usage.txt" 2>&1
    
    # Configuration
    kubectl get configmaps --all-namespaces > "$output_dir/configmaps.txt" 2>&1
    kubectl get secrets --all-namespaces > "$output_dir/secrets.txt" 2>&1
    
    # Logs from critical services
    for namespace in "${NAMESPACES[@]}"; do
        mkdir -p "$output_dir/logs/$namespace"
        kubectl get pods -n "$namespace" --no-headers | awk '{print $1}' | while read -r pod; do
            kubectl logs "$pod" -n "$namespace" --tail=100 > "$output_dir/logs/$namespace/$pod.log" 2>&1
        done
    done
    
    log_success "Diagnostics collected in $output_dir"
}

# Function to run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    # Test API endpoints
    local endpoints=(
        "http://backend-api.backend-services/health"
        "http://ai-services.ai-services/health"
        "http://ghost-cms.cms/ghost/api/v3/admin/site/"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        if kubectl run curl-test --image=curlimages/curl:latest --rm -i --restart=Never -- curl -s -w "Time: %{time_total}s\nStatus: %{http_code}\n" "$endpoint" 2>/dev/null; then
            log_success "Endpoint test passed: $endpoint"
        else
            log_error "Endpoint test failed: $endpoint"
        fi
    done
}

# Function to check security
check_security() {
    log_info "Checking security configuration..."
    
    # Check for pods running as root
    local root_pods=$(kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{" "}{.spec.securityContext.runAsUser}{"\n"}{end}' | grep " 0$" | wc -l)
    if [ "$root_pods" -gt 0 ]; then
        log_warning "$root_pods pods running as root"
    else
        log_success "No pods running as root"
    fi
    
    # Check for privileged containers
    local privileged_pods=$(kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.securityContext.privileged}{"\n"}{end}{end}' | grep -c true || echo 0)
    if [ "$privileged_pods" -gt 0 ]; then
        log_warning "$privileged_pods privileged containers found"
    else
        log_success "No privileged containers found"
    fi
    
    # Check network policies
    local network_policies=$(kubectl get networkpolicy --all-namespaces --no-headers | wc -l)
    if [ "$network_policies" -gt 0 ]; then
        log_success "$network_policies network policies configured"
    else
        log_warning "No network policies found"
    fi
}

# Function to generate health report
generate_health_report() {
    local report_file="health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    log_info "Generating health report: $report_file"
    
    {
        echo "AIC Website Health Report"
        echo "Generated: $(date)"
        echo "=========================="
        echo
        
        echo "Cluster Information:"
        kubectl cluster-info
        echo
        
        echo "Node Status:"
        kubectl get nodes
        echo
        
        echo "Namespace Status:"
        for namespace in "${NAMESPACES[@]}"; do
            echo "Namespace: $namespace"
            kubectl get pods -n "$namespace" 2>/dev/null || echo "  Namespace not found"
            echo
        done
        
        echo "Service Status:"
        kubectl get services --all-namespaces
        echo
        
        echo "Recent Events:"
        kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp | tail -20
        
    } > "$report_file"
    
    log_success "Health report generated: $report_file"
}

# Main function
main() {
    local command=${1:-"check"}
    
    case $command in
        "check")
            log_info "Running comprehensive health check..."
            check_system_health
            check_databases
            check_ai_services
            check_monitoring
            check_configuration
            check_security
            ;;
        "fix")
            log_info "Running automated fixes..."
            fix_common_issues
            ;;
        "service")
            if [ -z "$2" ] || [ -z "$3" ]; then
                log_error "Usage: $0 service <service-name> <namespace>"
                exit 1
            fi
            check_service "$2" "$3"
            ;;
        "diagnostics")
            collect_diagnostics
            ;;
        "performance")
            run_performance_tests
            ;;
        "report")
            generate_health_report
            ;;
        "all")
            log_info "Running complete troubleshooting suite..."
            check_system_health
            check_databases
            check_ai_services
            check_monitoring
            check_configuration
            check_security
            collect_diagnostics
            generate_health_report
            ;;
        *)
            echo "Usage: $0 {check|fix|service|diagnostics|performance|report|all}"
            echo ""
            echo "Commands:"
            echo "  check        - Run health checks"
            echo "  fix          - Attempt to fix common issues"
            echo "  service      - Check specific service"
            echo "  diagnostics  - Collect diagnostic information"
            echo "  performance  - Run performance tests"
            echo "  report       - Generate health report"
            echo "  all          - Run complete troubleshooting suite"
            echo ""
            echo "Examples:"
            echo "  $0 check"
            echo "  $0 fix"
            echo "  $0 service backend-api backend-services"
            echo "  $0 diagnostics"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
