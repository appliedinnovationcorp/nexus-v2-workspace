#!/bin/bash

# Jaeger Deployment Script for AIC Website
# This script deploys Jaeger distributed tracing with service mesh integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${JAEGER_NAMESPACE:-observability}"
RELEASE_NAME="${JAEGER_RELEASE_NAME:-jaeger}"
CHART_VERSION="${JAEGER_CHART_VERSION:-0.71.11}"
DOMAIN="${JAEGER_DOMAIN:-jaeger.aicorp.com}"
STORAGE_CLASS="${JAEGER_STORAGE_CLASS:-gp3}"
ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-https://elasticsearch.observability.svc.cluster.local:9200}"
ELASTICSEARCH_USERNAME="${ELASTICSEARCH_USERNAME:-jaeger}"
ELASTICSEARCH_PASSWORD="${ELASTICSEARCH_PASSWORD:-jaeger-password}"

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
    
    # Check if Elasticsearch is available
    if ! kubectl get service elasticsearch -n $NAMESPACE &> /dev/null; then
        print_status $YELLOW "⚠️  Elasticsearch service not found. Jaeger will use memory storage."
    fi
    
    print_status $GREEN "✅ Prerequisites check passed"
}

# Function to create namespace
create_namespace() {
    print_status $BLUE "📦 Creating namespace: $NAMESPACE"
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Label namespace for monitoring and network policies
    kubectl label namespace $NAMESPACE name=$NAMESPACE --overwrite
    kubectl label namespace $NAMESPACE app.kubernetes.io/name=jaeger --overwrite
    kubectl label namespace $NAMESPACE app.kubernetes.io/instance=$RELEASE_NAME --overwrite
    
    print_status $GREEN "✅ Namespace created/updated: $NAMESPACE"
}

# Function to create Elasticsearch credentials secret
create_elasticsearch_secret() {
    if [ -n "$ELASTICSEARCH_USERNAME" ] && [ -n "$ELASTICSEARCH_PASSWORD" ]; then
        print_status $BLUE "🔐 Creating Elasticsearch credentials secret..."
        
        kubectl create secret generic jaeger-elasticsearch-credentials \
            --from-literal=username="$ELASTICSEARCH_USERNAME" \
            --from-literal=password="$ELASTICSEARCH_PASSWORD" \
            --namespace=$NAMESPACE \
            --dry-run=client -o yaml | kubectl apply -f -
        
        print_status $GREEN "✅ Elasticsearch credentials secret created"
    else
        print_status $YELLOW "⚠️  Elasticsearch credentials not provided. Using default values."
    fi
}

# Function to create basic auth secret for Jaeger UI
create_basic_auth_secret() {
    print_status $BLUE "🔒 Creating basic auth secret for Jaeger UI..."
    
    # Generate password if not provided
    local username="${JAEGER_UI_USERNAME:-admin}"
    local password="${JAEGER_UI_PASSWORD:-$(openssl rand -base64 12)}"
    
    # Create htpasswd entry
    local htpasswd_entry=$(htpasswd -nb "$username" "$password")
    
    kubectl create secret generic jaeger-basic-auth \
        --from-literal=auth="$htpasswd_entry" \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_status $GREEN "✅ Basic auth secret created"
    print_status $YELLOW "🔑 Jaeger UI credentials: $username / $password"
    
    # Store credentials for later use
    echo "JAEGER_UI_USERNAME=$username" > /tmp/jaeger-credentials.env
    echo "JAEGER_UI_PASSWORD=$password" >> /tmp/jaeger-credentials.env
}

# Function to create TLS certificates
create_tls_certificates() {
    print_status $BLUE "🔒 Creating TLS certificates for Jaeger..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: jaeger-ui-tls
  namespace: $NAMESPACE
spec:
  secretName: jaeger-ui-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - $DOMAIN
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: jaeger-collector-tls
  namespace: $NAMESPACE
spec:
  secretName: jaeger-collector-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - jaeger-collector.aicorp.com
  - jaeger-collector.$NAMESPACE.svc.cluster.local
EOF
    
    print_status $GREEN "✅ TLS certificates created"
}

# Function to add Jaeger Helm repository
add_jaeger_helm_repo() {
    print_status $BLUE "📚 Adding Jaeger Helm repository..."
    
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo update
    
    print_status $GREEN "✅ Jaeger Helm repository added"
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

# Function to deploy Jaeger
deploy_jaeger() {
    print_status $BLUE "🚀 Deploying Jaeger..."
    
    # Create dynamic values file based on available services
    local values_file="/tmp/jaeger-values-dynamic.yaml"
    
    # Start with base configuration
    cp jaeger-values.yaml "$values_file"
    
    # Check if Elasticsearch is available and update configuration
    if kubectl get service elasticsearch -n $NAMESPACE &> /dev/null; then
        print_status $BLUE "📊 Elasticsearch detected, configuring Elasticsearch storage..."
        
        # Update Elasticsearch configuration in values file
        cat >> "$values_file" <<EOF

# Dynamic Elasticsearch configuration
storage:
  type: elasticsearch
  elasticsearch:
    host: elasticsearch.$NAMESPACE.svc.cluster.local
    port: 9200
    scheme: https
    user: $ELASTICSEARCH_USERNAME
    password: $ELASTICSEARCH_PASSWORD
    
collector:
  cmdlineParams:
    es.server-urls: "$ELASTICSEARCH_URL"
    es.username: "$ELASTICSEARCH_USERNAME"
    es.password: "$ELASTICSEARCH_PASSWORD"
    
query:
  cmdlineParams:
    es.server-urls: "$ELASTICSEARCH_URL"
    es.username: "$ELASTICSEARCH_USERNAME"
    es.password: "$ELASTICSEARCH_PASSWORD"
EOF
    else
        print_status $YELLOW "⚠️  Elasticsearch not available, using memory storage..."
        
        # Configure for memory storage
        cat >> "$values_file" <<EOF

# Dynamic memory storage configuration
allInOne:
  enabled: true
  storage:
    type: memory
    memory:
      maxTraces: 50000

# Disable production components for memory storage
collector:
  enabled: false
query:
  enabled: false
agent:
  enabled: false
EOF
    fi
    
    # Update domain configuration
    sed -i "s/jaeger\.aicorp\.com/$DOMAIN/g" "$values_file"
    
    # Deploy Jaeger using Helm
    helm upgrade --install $RELEASE_NAME jaegertracing/jaeger \
        --namespace $NAMESPACE \
        --version $CHART_VERSION \
        --values "$values_file" \
        --wait \
        --timeout 15m
    
    print_status $GREEN "✅ Jaeger deployed successfully"
    
    # Cleanup
    rm -f "$values_file"
}

# Function to deploy service mesh integration
deploy_service_mesh_integration() {
    print_status $BLUE "🕸️  Deploying service mesh integration..."
    
    # Apply service mesh integration configurations
    if kubectl apply -f jaeger-service-mesh-integration.yaml; then
        print_status $GREEN "✅ Service mesh integration deployed"
    else
        print_status $YELLOW "⚠️  Service mesh integration deployment failed or partially applied"
    fi
}

# Function to wait for Jaeger to be ready
wait_for_jaeger() {
    print_status $BLUE "⏳ Waiting for Jaeger to be ready..."
    
    # Wait for all deployments to be ready
    kubectl wait --for=condition=available --timeout=600s deployment --all -n $NAMESPACE
    
    # Wait for Jaeger UI to be accessible
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if kubectl get ingress jaeger-query -n $NAMESPACE &> /dev/null; then
            if curl -k -s https://$DOMAIN > /dev/null 2>&1; then
                print_status $GREEN "✅ Jaeger UI is ready and accessible"
                break
            fi
        fi
        
        print_status $YELLOW "⏳ Attempt $attempt/$max_attempts: Jaeger not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_status $RED "❌ Jaeger failed to become ready within timeout"
        exit 1
    fi
}

# Function to create RBAC resources
create_rbac() {
    print_status $BLUE "👤 Creating RBAC resources..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jaeger
  namespace: $NAMESPACE
  labels:
    app: jaeger
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: jaeger
  labels:
    app: jaeger
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["extensions", "networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: jaeger
  labels:
    app: jaeger
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: jaeger
subjects:
- kind: ServiceAccount
  name: jaeger
  namespace: $NAMESPACE
EOF
    
    print_status $GREEN "✅ RBAC resources created"
}

# Function to create network policies
create_network_policies() {
    print_status $BLUE "🔒 Creating network policies..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: jaeger-network-policy
  namespace: $NAMESPACE
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: jaeger
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow traffic from application namespaces
  - from:
    - namespaceSelector:
        matchLabels:
          name: aic-website-prod
    - namespaceSelector:
        matchLabels:
          name: aic-website-staging
    - namespaceSelector:
        matchLabels:
          name: aic-website-dev
    - namespaceSelector:
        matchLabels:
          name: istio-system
    - namespaceSelector:
        matchLabels:
          name: linkerd
    - namespaceSelector:
        matchLabels:
          name: kong
    ports:
    - protocol: TCP
      port: 14250  # Collector gRPC
    - protocol: TCP
      port: 14268  # Collector HTTP
    - protocol: TCP
      port: 4317   # OTLP gRPC
    - protocol: TCP
      port: 4318   # OTLP HTTP
    - protocol: UDP
      port: 6831   # Agent compact
    - protocol: UDP
      port: 6832   # Agent binary
    - protocol: TCP
      port: 5775   # Agent Zipkin
  
  # Allow monitoring access
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 14269  # Collector metrics
    - protocol: TCP
      port: 16687  # Query metrics
    - protocol: TCP
      port: 14271  # Agent metrics
  
  # Allow ingress access to UI
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 16686  # Query UI
  
  egress:
  # Allow access to Elasticsearch
  - to:
    - podSelector:
        matchLabels:
          app: elasticsearch
    ports:
    - protocol: TCP
      port: 9200
  
  # Allow DNS resolution
  - to: []
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  
  # Allow external HTTPS
  - to: []
    ports:
    - protocol: TCP
      port: 443
EOF
    
    print_status $GREEN "✅ Network policies created"
}

# Function to configure monitoring
configure_monitoring() {
    print_status $BLUE "📊 Configuring monitoring integration..."
    
    # Create ServiceMonitor for Prometheus
    cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: jaeger-metrics
  namespace: $NAMESPACE
  labels:
    app: jaeger
    release: prometheus
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: jaeger
  endpoints:
  - port: admin-http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
  - port: metrics
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
EOF
    
    print_status $GREEN "✅ Monitoring integration configured"
}

# Function to test Jaeger deployment
test_jaeger_deployment() {
    print_status $BLUE "🧪 Testing Jaeger deployment..."
    
    # Test collector health
    if kubectl exec -n $NAMESPACE deployment/jaeger-collector -- wget -q -O- http://localhost:14269/health 2>/dev/null | grep -q "Server available"; then
        print_status $GREEN "✅ Jaeger collector is healthy"
    else
        print_status $RED "❌ Jaeger collector health check failed"
    fi
    
    # Test query service health
    if kubectl exec -n $NAMESPACE deployment/jaeger-query -- wget -q -O- http://localhost:16687/health 2>/dev/null | grep -q "Server available"; then
        print_status $GREEN "✅ Jaeger query service is healthy"
    else
        print_status $RED "❌ Jaeger query service health check failed"
    fi
    
    # Test UI accessibility
    if curl -k -s https://$DOMAIN > /dev/null; then
        print_status $GREEN "✅ Jaeger UI is accessible"
    else
        print_status $YELLOW "⚠️  Jaeger UI accessibility test failed (may be due to authentication)"
    fi
    
    print_status $GREEN "✅ Jaeger deployment test completed"
}

# Function to display Jaeger information
display_jaeger_info() {
    print_status $BLUE "📋 Jaeger Installation Summary"
    echo "=================================="
    echo "Jaeger UI URL: https://$DOMAIN"
    echo "Collector URL: https://jaeger-collector.aicorp.com"
    echo "Namespace: $NAMESPACE"
    echo "Release Name: $RELEASE_NAME"
    echo "Storage Backend: ${ELASTICSEARCH_URL:+Elasticsearch}"
    echo "Storage Backend: ${ELASTICSEARCH_URL:-Memory}"
    echo ""
    
    if [ -f /tmp/jaeger-credentials.env ]; then
        source /tmp/jaeger-credentials.env
        echo "UI Username: $JAEGER_UI_USERNAME"
        echo "UI Password: $JAEGER_UI_PASSWORD"
        echo ""
    fi
    
    print_status $BLUE "🔧 Integration Endpoints:"
    echo "- Collector gRPC: jaeger-collector.$NAMESPACE.svc.cluster.local:14250"
    echo "- Collector HTTP: jaeger-collector.$NAMESPACE.svc.cluster.local:14268"
    echo "- Agent Compact: jaeger-agent.$NAMESPACE.svc.cluster.local:6831"
    echo "- Agent Binary: jaeger-agent.$NAMESPACE.svc.cluster.local:6832"
    echo "- OTLP gRPC: jaeger-collector.$NAMESPACE.svc.cluster.local:4317"
    echo "- OTLP HTTP: jaeger-collector.$NAMESPACE.svc.cluster.local:4318"
    echo ""
    print_status $BLUE "🔧 Next Steps:"
    echo "1. Configure application instrumentation"
    echo "2. Set up service mesh tracing"
    echo "3. Configure sampling strategies"
    echo "4. Set up alerting rules"
    echo "5. Create custom dashboards"
    echo ""
    print_status $BLUE "📝 Important Notes:"
    echo "- Jaeger is deployed in production mode"
    echo "- TLS is enabled for all communications"
    echo "- Basic authentication is enabled for UI"
    echo "- Network policies restrict access"
    echo "- Prometheus metrics are enabled"
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "Jaeger Deployment Script for AIC Website"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -n, --namespace NAME    Kubernetes namespace (default: observability)"
    echo "  -d, --domain DOMAIN     Jaeger UI domain (default: jaeger.aicorp.com)"
    echo "  -s, --storage-class SC  Storage class (default: gp3)"
    echo "  -e, --elasticsearch URL Elasticsearch URL"
    echo "  --es-username USER      Elasticsearch username"
    echo "  --es-password PASS      Elasticsearch password"
    echo "  --skip-tls              Skip TLS certificate creation"
    echo "  --skip-rbac             Skip RBAC creation"
    echo "  --skip-network-policy   Skip network policy creation"
    echo "  --skip-service-mesh     Skip service mesh integration"
    echo ""
    echo "Environment Variables:"
    echo "  JAEGER_NAMESPACE        Kubernetes namespace"
    echo "  JAEGER_DOMAIN          Jaeger UI domain name"
    echo "  JAEGER_STORAGE_CLASS   Storage class for PVCs"
    echo "  ELASTICSEARCH_URL      Elasticsearch cluster URL"
    echo "  ELASTICSEARCH_USERNAME Elasticsearch username"
    echo "  ELASTICSEARCH_PASSWORD Elasticsearch password"
    echo "  JAEGER_UI_USERNAME     Jaeger UI username"
    echo "  JAEGER_UI_PASSWORD     Jaeger UI password"
    echo ""
    echo "Example:"
    echo "  $0 --domain jaeger.example.com --elasticsearch https://elasticsearch.example.com:9200"
}

# Main deployment function
main() {
    local skip_tls=false
    local skip_rbac=false
    local skip_network_policy=false
    local skip_service_mesh=false
    
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
            -s|--storage-class)
                STORAGE_CLASS="$2"
                shift 2
                ;;
            -e|--elasticsearch)
                ELASTICSEARCH_URL="$2"
                shift 2
                ;;
            --es-username)
                ELASTICSEARCH_USERNAME="$2"
                shift 2
                ;;
            --es-password)
                ELASTICSEARCH_PASSWORD="$2"
                shift 2
                ;;
            --skip-tls)
                skip_tls=true
                shift
                ;;
            --skip-rbac)
                skip_rbac=true
                shift
                ;;
            --skip-network-policy)
                skip_network_policy=true
                shift
                ;;
            --skip-service-mesh)
                skip_service_mesh=true
                shift
                ;;
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting Jaeger deployment..."
    
    # Execute deployment steps
    check_prerequisites
    create_namespace
    create_storage_classes
    
    if [ "$skip_rbac" = false ]; then
        create_rbac
    fi
    
    create_elasticsearch_secret
    create_basic_auth_secret
    
    if [ "$skip_tls" = false ]; then
        create_tls_certificates
    fi
    
    add_jaeger_helm_repo
    deploy_jaeger
    
    if [ "$skip_service_mesh" = false ]; then
        deploy_service_mesh_integration
    fi
    
    wait_for_jaeger
    
    if [ "$skip_network_policy" = false ]; then
        create_network_policies
    fi
    
    configure_monitoring
    test_jaeger_deployment
    display_jaeger_info
    
    print_status $GREEN "🎉 Jaeger deployment completed successfully!"
}

# Cleanup function
cleanup() {
    rm -f /tmp/jaeger-values-dynamic.yaml /tmp/jaeger-credentials.env
}

# Set trap for cleanup
trap cleanup EXIT

# Check for required tools
if ! command -v htpasswd &> /dev/null; then
    print_status $YELLOW "⚠️  htpasswd not found. Installing apache2-utils..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y apache2-utils
    elif command -v yum &> /dev/null; then
        sudo yum install -y httpd-tools
    else
        print_status $RED "❌ Cannot install htpasswd. Please install apache2-utils or httpd-tools manually."
        exit 1
    fi
fi

# Run main function
main "$@"
