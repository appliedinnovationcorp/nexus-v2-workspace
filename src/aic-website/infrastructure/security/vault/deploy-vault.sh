#!/bin/bash

# Vault Deployment Script for AIC Website
# This script deploys HashiCorp Vault with HA configuration and Kubernetes integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${VAULT_NAMESPACE:-vault-system}"
RELEASE_NAME="${VAULT_RELEASE_NAME:-vault}"
CHART_VERSION="${VAULT_CHART_VERSION:-0.27.0}"
DOMAIN="${VAULT_DOMAIN:-vault.aicorp.com}"
STORAGE_CLASS="${VAULT_STORAGE_CLASS:-gp3}"
AWS_REGION="${AWS_REGION:-us-west-2}"
AWS_KMS_KEY_ID="${AWS_KMS_KEY_ID:-}"

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
    
    # Check if cert-manager is installed
    if ! kubectl get crd certificates.cert-manager.io &> /dev/null; then
        print_status $YELLOW "⚠️  cert-manager CRDs not found. TLS certificates may not work."
    fi
    
    # Check AWS credentials for KMS auto-unseal
    if [ -z "$AWS_KMS_KEY_ID" ]; then
        print_status $YELLOW "⚠️  AWS KMS Key ID not provided. Auto-unseal will be disabled."
    fi
    
    print_status $GREEN "✅ Prerequisites check passed"
}

# Function to create namespace
create_namespace() {
    print_status $BLUE "📦 Creating namespace: $NAMESPACE"
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Label namespace for monitoring and network policies
    kubectl label namespace $NAMESPACE name=$NAMESPACE --overwrite
    kubectl label namespace $NAMESPACE app.kubernetes.io/name=vault --overwrite
    kubectl label namespace $NAMESPACE app.kubernetes.io/instance=$RELEASE_NAME --overwrite
    
    print_status $GREEN "✅ Namespace created/updated: $NAMESPACE"
}

# Function to create AWS credentials secret
create_aws_credentials() {
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        print_status $BLUE "☁️  Creating AWS credentials secret..."
        
        kubectl create secret generic vault-aws-credentials \
            --from-literal=access_key_id="$AWS_ACCESS_KEY_ID" \
            --from-literal=secret_access_key="$AWS_SECRET_ACCESS_KEY" \
            --namespace=$NAMESPACE \
            --dry-run=client -o yaml | kubectl apply -f -
        
        print_status $GREEN "✅ AWS credentials secret created"
    else
        print_status $YELLOW "⚠️  AWS credentials not provided. Skipping AWS credentials secret."
    fi
}

# Function to create TLS certificates
create_tls_certificates() {
    print_status $BLUE "🔒 Creating TLS certificates for Vault..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: vault-tls-cert
  namespace: $NAMESPACE
spec:
  secretName: vault-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - $DOMAIN
  - vault-internal.$NAMESPACE.svc.cluster.local
  - vault-0.vault-internal.$NAMESPACE.svc.cluster.local
  - vault-1.vault-internal.$NAMESPACE.svc.cluster.local
  - vault-2.vault-internal.$NAMESPACE.svc.cluster.local
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: vault-internal-tls
  namespace: $NAMESPACE
spec:
  secretName: vault-internal-tls
  issuerRef:
    name: vault-internal-ca
    kind: Issuer
  dnsNames:
  - vault-internal.$NAMESPACE.svc.cluster.local
  - vault-0.vault-internal.$NAMESPACE.svc.cluster.local
  - vault-1.vault-internal.$NAMESPACE.svc.cluster.local
  - vault-2.vault-internal.$NAMESPACE.svc.cluster.local
  - localhost
  ipAddresses:
  - 127.0.0.1
EOF
    
    print_status $GREEN "✅ TLS certificates created"
}

# Function to create internal CA issuer
create_internal_ca() {
    print_status $BLUE "🏛️  Creating internal CA issuer..."
    
    # Generate CA private key
    openssl genrsa -out /tmp/ca-key.pem 4096
    
    # Generate CA certificate
    openssl req -new -x509 -sha256 -key /tmp/ca-key.pem -out /tmp/ca-cert.pem -days 3650 \
        -subj "/C=US/ST=CA/L=San Francisco/O=AIC Corp/OU=IT/CN=Vault Internal CA"
    
    # Create CA secret
    kubectl create secret tls vault-internal-ca-secret \
        --cert=/tmp/ca-cert.pem \
        --key=/tmp/ca-key.pem \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create CA issuer
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: vault-internal-ca
  namespace: $NAMESPACE
spec:
  ca:
    secretName: vault-internal-ca-secret
EOF
    
    # Cleanup temporary files
    rm -f /tmp/ca-key.pem /tmp/ca-cert.pem
    
    print_status $GREEN "✅ Internal CA issuer created"
}

# Function to deploy Consul for Vault storage
deploy_consul() {
    print_status $BLUE "🗄️  Deploying Consul for Vault storage..."
    
    # Add HashiCorp Helm repository
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    
    # Create Consul values
    cat > /tmp/consul-values.yaml <<EOF
global:
  name: consul
  datacenter: dc1
  image: "hashicorp/consul:1.17.0"
  imageK8S: "hashicorp/consul-k8s-control-plane:1.3.0"
  enableConsulNamespaces: false
  tls:
    enabled: true
    enableAutoEncrypt: true
  acls:
    manageSystemACLs: true
  gossipEncryption:
    autoGenerate: true

server:
  replicas: 3
  bootstrapExpect: 3
  storage: 10Gi
  storageClass: $STORAGE_CLASS
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"
  affinity: |
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: {{ template "consul.name" . }}
              release: "{{ .Release.Name }}"
              component: server
          topologyKey: kubernetes.io/hostname

client:
  enabled: true
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "250m"

ui:
  enabled: true
  service:
    type: ClusterIP

connectInject:
  enabled: false

controller:
  enabled: false

meshGateway:
  enabled: false

ingressGateways:
  enabled: false

terminatingGateways:
  enabled: false
EOF
    
    # Deploy Consul
    helm upgrade --install consul hashicorp/consul \
        --namespace $NAMESPACE \
        --values /tmp/consul-values.yaml \
        --version 1.3.0 \
        --wait \
        --timeout 10m
    
    print_status $GREEN "✅ Consul deployed successfully"
    
    # Wait for Consul to be ready
    kubectl wait --for=condition=ready pod -l app=consul,component=server -n $NAMESPACE --timeout=300s
    
    # Cleanup
    rm -f /tmp/consul-values.yaml
}

# Function to add Vault Helm repository
add_vault_helm_repo() {
    print_status $BLUE "📚 Adding Vault Helm repository..."
    
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    
    print_status $GREEN "✅ Vault Helm repository added"
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

# Function to deploy Vault
deploy_vault() {
    print_status $BLUE "🚀 Deploying Vault..."
    
    # Create dynamic values file
    cat > /tmp/vault-values.yaml <<EOF
global:
  enabled: true
  tlsDisable: false

injector:
  enabled: true
  replicas: 2
  resources:
    requests:
      memory: 256Mi
      cpu: 250m
    limits:
      memory: 512Mi
      cpu: 500m

server:
  image:
    repository: "hashicorp/vault"
    tag: "1.15.2"
  
  resources:
    requests:
      memory: 512Mi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 2000m
  
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
      nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
    hosts:
      - host: $DOMAIN
        paths: []
    tls:
      - secretName: vault-tls-cert
        hosts:
          - $DOMAIN
  
  extraEnvironmentVars:
    VAULT_CACERT: /vault/userconfig/vault-tls/ca.crt
    VAULT_TLSCERT: /vault/userconfig/vault-tls/tls.crt
    VAULT_TLSKEY: /vault/userconfig/vault-tls/tls.key
EOF

    # Add AWS credentials if available
    if [ -n "$AWS_ACCESS_KEY_ID" ]; then
        cat >> /tmp/vault-values.yaml <<EOF
  extraSecretEnvironmentVars:
    - envName: AWS_ACCESS_KEY_ID
      secretName: vault-aws-credentials
      secretKey: access_key_id
    - envName: AWS_SECRET_ACCESS_KEY
      secretName: vault-aws-credentials
      secretKey: secret_access_key
EOF
    fi
    
    # Add volume mounts
    cat >> /tmp/vault-values.yaml <<EOF
  extraVolumes:
    - type: secret
      name: vault-tls-cert
      path: /vault/userconfig
  
  dataStorage:
    enabled: true
    size: 10Gi
    storageClass: $STORAGE_CLASS
  
  auditStorage:
    enabled: true
    size: 10Gi
    storageClass: $STORAGE_CLASS
  
  ha:
    enabled: true
    replicas: 3
    config: |
      ui = true
      listener "tcp" {
        tls_disable = 0
        address = "[::]:8200"
        cluster_address = "[::]:8201"
        tls_cert_file = "/vault/userconfig/vault-tls-cert/tls.crt"
        tls_key_file  = "/vault/userconfig/vault-tls-cert/tls.key"
        tls_client_ca_file = "/vault/userconfig/vault-tls-cert/ca.crt"
      }
      storage "consul" {
        path = "vault"
        address = "consul.$NAMESPACE.svc.cluster.local:8500"
        scheme = "https"
        tls_ca_file = "/vault/userconfig/consul-ca/tls.crt"
      }
EOF

    # Add KMS auto-unseal if key is provided
    if [ -n "$AWS_KMS_KEY_ID" ]; then
        cat >> /tmp/vault-values.yaml <<EOF
      seal "awskms" {
        region     = "$AWS_REGION"
        kms_key_id = "$AWS_KMS_KEY_ID"
      }
EOF
    fi
    
    # Complete the configuration
    cat >> /tmp/vault-values.yaml <<EOF
      service_registration "kubernetes" {}
      log_level = "INFO"
      log_format = "json"
      api_addr = "https://$DOMAIN"
      cluster_addr = "https://$DOMAIN:8201"

ui:
  enabled: true

csi:
  enabled: true
EOF
    
    # Deploy Vault using Helm
    helm upgrade --install $RELEASE_NAME hashicorp/vault \
        --namespace $NAMESPACE \
        --version $CHART_VERSION \
        --values /tmp/vault-values.yaml \
        --wait \
        --timeout 15m
    
    print_status $GREEN "✅ Vault deployed successfully"
    
    # Cleanup
    rm -f /tmp/vault-values.yaml
}

# Function to wait for Vault to be ready
wait_for_vault() {
    print_status $BLUE "⏳ Waiting for Vault to be ready..."
    
    # Wait for all pods to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=vault -n $NAMESPACE --timeout=600s
    
    # Wait for Vault service to be accessible
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if kubectl exec -n $NAMESPACE vault-0 -- vault status > /dev/null 2>&1; then
            print_status $GREEN "✅ Vault is ready and accessible"
            break
        fi
        
        print_status $YELLOW "⏳ Attempt $attempt/$max_attempts: Vault not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_status $RED "❌ Vault failed to become ready within timeout"
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
  name: vault
  namespace: $NAMESPACE
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: vault-server-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: vault
  namespace: $NAMESPACE
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: vault-agent-injector
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "create", "update", "patch"]
- apiGroups: ["admissionregistration.k8s.io"]
  resources: ["mutatingwebhookconfigurations"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: vault-agent-injector-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: vault-agent-injector
subjects:
- kind: ServiceAccount
  name: vault-agent-injector
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
  name: vault-server
  namespace: $NAMESPACE
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: vault
      component: server
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - podSelector:
        matchLabels:
          app.kubernetes.io/name: vault
          component: injector
    - namespaceSelector:
        matchLabels:
          name: aic-website-prod
    - namespaceSelector:
        matchLabels:
          name: aic-website-staging
    - namespaceSelector:
        matchLabels:
          name: aic-website-dev
    ports:
    - protocol: TCP
      port: 8200
    - protocol: TCP
      port: 8201
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: consul
    ports:
    - protocol: TCP
      port: 8500
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: vault-injector
  namespace: $NAMESPACE
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: vault
      component: webhook
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app.kubernetes.io/name: vault
          component: server
    ports:
    - protocol: TCP
      port: 8200
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
EOF
    
    print_status $GREEN "✅ Network policies created"
}

# Function to display Vault information
display_vault_info() {
    print_status $BLUE "📋 Vault Installation Summary"
    echo "=================================="
    echo "Vault URL: https://$DOMAIN"
    echo "Namespace: $NAMESPACE"
    echo "Release Name: $RELEASE_NAME"
    echo "Storage Backend: Consul"
    echo "Auto-unseal: ${AWS_KMS_KEY_ID:+Enabled (AWS KMS)}"
    echo ""
    print_status $BLUE "🔧 Next Steps:"
    echo "1. Initialize Vault: ./vault-init-config.sh"
    echo "2. Configure authentication and secret engines"
    echo "3. Create policies and roles"
    echo "4. Test Kubernetes integration"
    echo "5. Set up monitoring and backup"
    echo ""
    print_status $BLUE "📝 Important Notes:"
    echo "- Vault is deployed in HA mode with 3 replicas"
    echo "- TLS is enabled for all communications"
    echo "- Agent injector is enabled for secret injection"
    echo "- CSI driver is enabled for secret mounting"
    echo "- Network policies restrict access"
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "Vault Deployment Script for AIC Website"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -n, --namespace NAME    Kubernetes namespace (default: vault-system)"
    echo "  -d, --domain DOMAIN     Vault domain (default: vault.aicorp.com)"
    echo "  -s, --storage-class SC  Storage class (default: gp3)"
    echo "  -k, --kms-key-id ID     AWS KMS key ID for auto-unseal"
    echo "  --skip-consul           Skip Consul deployment"
    echo "  --skip-tls              Skip TLS certificate creation"
    echo "  --skip-rbac             Skip RBAC creation"
    echo "  --skip-network-policy   Skip network policy creation"
    echo ""
    echo "Environment Variables:"
    echo "  VAULT_NAMESPACE         Kubernetes namespace"
    echo "  VAULT_DOMAIN           Vault domain name"
    echo "  VAULT_STORAGE_CLASS    Storage class for PVCs"
    echo "  AWS_KMS_KEY_ID         AWS KMS key ID for auto-unseal"
    echo "  AWS_ACCESS_KEY_ID      AWS access key ID"
    echo "  AWS_SECRET_ACCESS_KEY  AWS secret access key"
    echo "  AWS_REGION             AWS region"
    echo ""
    echo "Example:"
    echo "  $0 --domain vault.example.com --kms-key-id arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"
}

# Main deployment function
main() {
    local skip_consul=false
    local skip_tls=false
    local skip_rbac=false
    local skip_network_policy=false
    
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
            -k|--kms-key-id)
                AWS_KMS_KEY_ID="$2"
                shift 2
                ;;
            --skip-consul)
                skip_consul=true
                shift
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
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting Vault deployment..."
    
    # Execute deployment steps
    check_prerequisites
    create_namespace
    create_aws_credentials
    create_storage_classes
    
    if [ "$skip_rbac" = false ]; then
        create_rbac
    fi
    
    if [ "$skip_tls" = false ]; then
        create_internal_ca
        create_tls_certificates
    fi
    
    if [ "$skip_consul" = false ]; then
        deploy_consul
    fi
    
    add_vault_helm_repo
    deploy_vault
    wait_for_vault
    
    if [ "$skip_network_policy" = false ]; then
        create_network_policies
    fi
    
    display_vault_info
    
    print_status $GREEN "🎉 Vault deployment completed successfully!"
}

# Cleanup function
cleanup() {
    rm -f /tmp/vault-values.yaml /tmp/consul-values.yaml
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"
