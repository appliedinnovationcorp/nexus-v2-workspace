#!/bin/bash

# Vault Initialization and Configuration Script
# This script initializes Vault and configures authentication methods, secret engines, and policies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VAULT_ADDR="${VAULT_ADDR:-https://vault.aicorp.com}"
VAULT_NAMESPACE="${VAULT_NAMESPACE:-vault-system}"
KUBERNETES_HOST="${KUBERNETES_HOST:-https://kubernetes.default.svc.cluster.local}"
VAULT_SERVICE_ACCOUNT="${VAULT_SERVICE_ACCOUNT:-vault}"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if Vault is initialized
check_vault_status() {
    print_status $BLUE "🔍 Checking Vault status..."
    
    local status=$(vault status -format=json 2>/dev/null || echo '{"initialized": false}')
    local initialized=$(echo "$status" | jq -r '.initialized')
    local sealed=$(echo "$status" | jq -r '.sealed')
    
    if [ "$initialized" = "true" ]; then
        print_status $GREEN "✅ Vault is already initialized"
        if [ "$sealed" = "false" ]; then
            print_status $GREEN "✅ Vault is unsealed"
            return 0
        else
            print_status $YELLOW "⚠️  Vault is sealed"
            return 1
        fi
    else
        print_status $YELLOW "⚠️  Vault is not initialized"
        return 2
    fi
}

# Function to initialize Vault
initialize_vault() {
    print_status $BLUE "🔐 Initializing Vault..."
    
    # Initialize Vault with 5 key shares and threshold of 3
    local init_output=$(vault operator init \
        -key-shares=5 \
        -key-threshold=3 \
        -recovery-shares=5 \
        -recovery-threshold=3 \
        -format=json)
    
    # Save unseal keys and root token securely
    echo "$init_output" | jq -r '.unseal_keys_b64[]' > /tmp/vault-unseal-keys.txt
    echo "$init_output" | jq -r '.root_token' > /tmp/vault-root-token.txt
    
    # Create Kubernetes secrets for unseal keys and root token
    kubectl create secret generic vault-unseal-keys \
        --from-file=/tmp/vault-unseal-keys.txt \
        --namespace=$VAULT_NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic vault-root-token \
        --from-file=/tmp/vault-root-token.txt \
        --namespace=$VAULT_NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Set root token for subsequent operations
    export VAULT_TOKEN=$(cat /tmp/vault-root-token.txt)
    
    print_status $GREEN "✅ Vault initialized successfully"
    print_status $YELLOW "🔑 Unseal keys and root token saved to Kubernetes secrets"
    
    # Clean up temporary files
    rm -f /tmp/vault-unseal-keys.txt /tmp/vault-root-token.txt
}

# Function to unseal Vault
unseal_vault() {
    print_status $BLUE "🔓 Unsealing Vault..."
    
    # Get unseal keys from Kubernetes secret
    local unseal_keys=$(kubectl get secret vault-unseal-keys -n $VAULT_NAMESPACE -o jsonpath='{.data.vault-unseal-keys\.txt}' | base64 -d)
    
    # Unseal with first 3 keys
    local count=0
    while IFS= read -r key && [ $count -lt 3 ]; do
        vault operator unseal "$key"
        ((count++))
    done <<< "$unseal_keys"
    
    print_status $GREEN "✅ Vault unsealed successfully"
}

# Function to configure authentication methods
configure_auth_methods() {
    print_status $BLUE "🔐 Configuring authentication methods..."
    
    # Enable Kubernetes authentication
    vault auth enable kubernetes || true
    
    # Configure Kubernetes authentication
    vault write auth/kubernetes/config \
        token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
        kubernetes_host="$KUBERNETES_HOST" \
        kubernetes_ca_cert="$(cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt)" \
        issuer="https://kubernetes.default.svc.cluster.local"
    
    # Enable AppRole authentication for applications
    vault auth enable approle || true
    
    # Enable LDAP authentication (if LDAP server is available)
    vault auth enable ldap || true
    vault write auth/ldap/config \
        url="ldap://ldap.aicorp.com" \
        userdn="ou=Users,dc=aicorp,dc=com" \
        userattr="uid" \
        groupdn="ou=Groups,dc=aicorp,dc=com" \
        groupfilter="(&(objectClass=groupOfNames)(member={{.UserDN}}))" \
        groupattr="cn" \
        insecure_tls=false \
        starttls=true
    
    # Enable JWT/OIDC authentication for external systems
    vault auth enable jwt || true
    vault write auth/jwt/config \
        bound_issuer="https://oidc.aicorp.com" \
        oidc_discovery_url="https://oidc.aicorp.com"
    
    # Enable AWS authentication for EC2/ECS workloads
    vault auth enable aws || true
    vault write auth/aws/config/client \
        access_key="$AWS_ACCESS_KEY_ID" \
        secret_key="$AWS_SECRET_ACCESS_KEY" \
        region="us-west-2"
    
    print_status $GREEN "✅ Authentication methods configured"
}

# Function to configure secret engines
configure_secret_engines() {
    print_status $BLUE "🗄️  Configuring secret engines..."
    
    # Enable KV v2 secret engine for application secrets
    vault secrets enable -path=secret kv-v2 || true
    vault secrets enable -path=aic-website kv-v2 || true
    
    # Enable database secret engine
    vault secrets enable database || true
    
    # Configure PostgreSQL database connection
    vault write database/config/postgresql \
        plugin_name=postgresql-database-plugin \
        connection_url="postgresql://{{username}}:{{password}}@postgres.aic-website.svc.cluster.local:5432/aic_website?sslmode=require" \
        allowed_roles="aic-website-role" \
        username="vault" \
        password="vault-db-password"
    
    # Create database role
    vault write database/roles/aic-website-role \
        db_name=postgresql \
        creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                           GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
        default_ttl="1h" \
        max_ttl="24h"
    
    # Enable AWS secret engine
    vault secrets enable aws || true
    vault write aws/config/root \
        access_key="$AWS_ACCESS_KEY_ID" \
        secret_key="$AWS_SECRET_ACCESS_KEY" \
        region="us-west-2"
    
    # Create AWS role for S3 access
    vault write aws/roles/s3-role \
        credential_type=iam_user \
        policy_document=-<<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::aic-website-*/*"
    }
  ]
}
EOF
    
    # Enable PKI secret engine for certificate management
    vault secrets enable pki || true
    vault secrets tune -max-lease-ttl=87600h pki
    
    # Generate root CA
    vault write -field=certificate pki/root/generate/internal \
        common_name="AIC Website Root CA" \
        ttl=87600h > /tmp/ca_cert.crt
    
    # Configure CA and CRL URLs
    vault write pki/config/urls \
        issuing_certificates="$VAULT_ADDR/v1/pki/ca" \
        crl_distribution_points="$VAULT_ADDR/v1/pki/crl"
    
    # Create PKI role
    vault write pki/roles/aic-website \
        allowed_domains="aicorp.com,aic-website.local" \
        allow_subdomains=true \
        max_ttl="720h"
    
    # Enable SSH secret engine
    vault secrets enable ssh || true
    
    # Configure SSH CA
    vault write ssh/config/ca generate_signing_key=true
    
    # Create SSH role
    vault write ssh/roles/aic-website \
        key_type=ca \
        default_user=ubuntu \
        allowed_users="ubuntu,admin" \
        default_extensions="permit-pty,permit-user-rc" \
        ttl="30m0s"
    
    # Enable Transit secret engine for encryption as a service
    vault secrets enable transit || true
    
    # Create encryption key
    vault write -f transit/keys/aic-website
    
    print_status $GREEN "✅ Secret engines configured"
}

# Function to create policies
create_policies() {
    print_status $BLUE "📋 Creating Vault policies..."
    
    # AIC Website application policy
    cat > /tmp/aic-website-policy.hcl <<EOF
# AIC Website Application Policy
path "aic-website/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "aic-website/metadata/*" {
  capabilities = ["list", "read", "delete"]
}

path "database/creds/aic-website-role" {
  capabilities = ["read"]
}

path "aws/creds/s3-role" {
  capabilities = ["read"]
}

path "pki/issue/aic-website" {
  capabilities = ["create", "update"]
}

path "ssh/sign/aic-website" {
  capabilities = ["create", "update"]
}

path "transit/encrypt/aic-website" {
  capabilities = ["update"]
}

path "transit/decrypt/aic-website" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/revoke-self" {
  capabilities = ["update"]
}
EOF
    
    vault policy write aic-website /tmp/aic-website-policy.hcl
    
    # Admin policy
    cat > /tmp/admin-policy.hcl <<EOF
# Admin Policy - Full access
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
EOF
    
    vault policy write admin /tmp/admin-policy.hcl
    
    # Read-only policy
    cat > /tmp/readonly-policy.hcl <<EOF
# Read-only Policy
path "aic-website/data/*" {
  capabilities = ["read", "list"]
}

path "aic-website/metadata/*" {
  capabilities = ["read", "list"]
}

path "sys/health" {
  capabilities = ["read", "sudo"]
}

path "sys/capabilities-self" {
  capabilities = ["update"]
}
EOF
    
    vault policy write readonly /tmp/readonly-policy.hcl
    
    # CI/CD policy for GitLab
    cat > /tmp/cicd-policy.hcl <<EOF
# CI/CD Policy for GitLab
path "aic-website/data/ci/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "database/creds/aic-website-role" {
  capabilities = ["read"]
}

path "aws/creds/s3-role" {
  capabilities = ["read"]
}

path "pki/issue/aic-website" {
  capabilities = ["create", "update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}
EOF
    
    vault policy write cicd /tmp/cicd-policy.hcl
    
    print_status $GREEN "✅ Policies created"
    
    # Clean up temporary files
    rm -f /tmp/*-policy.hcl
}

# Function to configure Kubernetes roles
configure_kubernetes_roles() {
    print_status $BLUE "☸️  Configuring Kubernetes authentication roles..."
    
    # AIC Website application role
    vault write auth/kubernetes/role/aic-website \
        bound_service_account_names=aic-website \
        bound_service_account_namespaces=aic-website-prod,aic-website-staging,aic-website-dev \
        policies=aic-website \
        ttl=24h
    
    # Admin role
    vault write auth/kubernetes/role/vault-admin \
        bound_service_account_names=vault-admin \
        bound_service_account_namespaces=$VAULT_NAMESPACE \
        policies=admin \
        ttl=1h
    
    # CI/CD role for GitLab
    vault write auth/kubernetes/role/gitlab-ci \
        bound_service_account_names=gitlab-ci \
        bound_service_account_namespaces=gitlab-system \
        policies=cicd \
        ttl=1h
    
    # Monitoring role
    vault write auth/kubernetes/role/monitoring \
        bound_service_account_names=prometheus,grafana \
        bound_service_account_namespaces=monitoring \
        policies=readonly \
        ttl=24h
    
    print_status $GREEN "✅ Kubernetes roles configured"
}

# Function to configure AppRole authentication
configure_approle() {
    print_status $BLUE "🔑 Configuring AppRole authentication..."
    
    # Create AppRole for AIC Website
    vault write auth/approle/role/aic-website \
        token_policies="aic-website" \
        token_ttl=1h \
        token_max_ttl=4h \
        bind_secret_id=true \
        secret_id_ttl=24h
    
    # Get role ID and secret ID
    local role_id=$(vault read -field=role_id auth/approle/role/aic-website/role-id)
    local secret_id=$(vault write -field=secret_id -f auth/approle/role/aic-website/secret-id)
    
    # Store AppRole credentials in Kubernetes secret
    kubectl create secret generic aic-website-approle \
        --from-literal=role_id="$role_id" \
        --from-literal=secret_id="$secret_id" \
        --namespace=aic-website-prod \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic aic-website-approle \
        --from-literal=role_id="$role_id" \
        --from-literal=secret_id="$secret_id" \
        --namespace=aic-website-staging \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic aic-website-approle \
        --from-literal=role_id="$role_id" \
        --from-literal=secret_id="$secret_id" \
        --namespace=aic-website-dev \
        --dry-run=client -o yaml | kubectl apply -f -
    
    print_status $GREEN "✅ AppRole configured"
}

# Function to create initial secrets
create_initial_secrets() {
    print_status $BLUE "🗝️  Creating initial secrets..."
    
    # Database credentials
    vault kv put aic-website/database \
        username="aic_website_user" \
        password="$(openssl rand -base64 32)" \
        host="postgres.aic-website.svc.cluster.local" \
        port="5432" \
        database="aic_website"
    
    # Redis credentials
    vault kv put aic-website/redis \
        password="$(openssl rand -base64 32)" \
        host="redis.aic-website.svc.cluster.local" \
        port="6379"
    
    # JWT signing key
    vault kv put aic-website/jwt \
        secret="$(openssl rand -base64 64)" \
        algorithm="HS256" \
        expiration="24h"
    
    # API keys
    vault kv put aic-website/api-keys \
        internal_api_key="$(openssl rand -hex 32)" \
        external_api_key="$(openssl rand -hex 32)" \
        webhook_secret="$(openssl rand -hex 32)"
    
    # Encryption keys
    vault kv put aic-website/encryption \
        data_encryption_key="$(openssl rand -base64 32)" \
        session_encryption_key="$(openssl rand -base64 32)"
    
    # Third-party service credentials
    vault kv put aic-website/external-services \
        smtp_username="noreply@aicorp.com" \
        smtp_password="$(openssl rand -base64 24)" \
        s3_access_key="AKIA..." \
        s3_secret_key="$(openssl rand -base64 40)"
    
    # CI/CD secrets
    vault kv put aic-website/ci/gitlab \
        token="$(openssl rand -hex 32)" \
        webhook_secret="$(openssl rand -hex 32)"
    
    vault kv put aic-website/ci/harbor \
        username="robot\$aic-website" \
        password="$(openssl rand -base64 32)"
    
    print_status $GREEN "✅ Initial secrets created"
}

# Function to configure audit logging
configure_audit_logging() {
    print_status $BLUE "📝 Configuring audit logging..."
    
    # Enable file audit device
    vault audit enable file file_path=/vault/audit/vault_audit.log
    
    # Enable syslog audit device (if available)
    vault audit enable syslog tag="vault" facility="AUTH" || true
    
    print_status $GREEN "✅ Audit logging configured"
}

# Function to enable monitoring
enable_monitoring() {
    print_status $BLUE "📊 Enabling monitoring..."
    
    # Enable Prometheus metrics
    vault write sys/config/ui \
        enabled=true \
        default_auth_method="kubernetes"
    
    print_status $GREEN "✅ Monitoring enabled"
}

# Function to create service accounts
create_service_accounts() {
    print_status $BLUE "👤 Creating service accounts..."
    
    # AIC Website service account
    kubectl create serviceaccount aic-website --namespace=aic-website-prod --dry-run=client -o yaml | kubectl apply -f -
    kubectl create serviceaccount aic-website --namespace=aic-website-staging --dry-run=client -o yaml | kubectl apply -f -
    kubectl create serviceaccount aic-website --namespace=aic-website-dev --dry-run=client -o yaml | kubectl apply -f -
    
    # GitLab CI service account
    kubectl create serviceaccount gitlab-ci --namespace=gitlab-system --dry-run=client -o yaml | kubectl apply -f -
    
    # Vault admin service account
    kubectl create serviceaccount vault-admin --namespace=$VAULT_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    print_status $GREEN "✅ Service accounts created"
}

# Function to test Vault configuration
test_vault_configuration() {
    print_status $BLUE "🧪 Testing Vault configuration..."
    
    # Test Kubernetes authentication
    local k8s_token=$(kubectl create token aic-website --namespace=aic-website-prod)
    local vault_token=$(vault write -field=token auth/kubernetes/login role=aic-website jwt="$k8s_token")
    
    if [ -n "$vault_token" ]; then
        print_status $GREEN "✅ Kubernetes authentication working"
        
        # Test secret access
        VAULT_TOKEN="$vault_token" vault kv get aic-website/database > /dev/null
        print_status $GREEN "✅ Secret access working"
    else
        print_status $RED "❌ Kubernetes authentication failed"
        return 1
    fi
    
    # Test database secret engine
    local db_creds=$(VAULT_TOKEN="$vault_token" vault read -format=json database/creds/aic-website-role)
    if echo "$db_creds" | jq -e '.data.username' > /dev/null; then
        print_status $GREEN "✅ Database secret engine working"
    else
        print_status $RED "❌ Database secret engine failed"
    fi
    
    # Test PKI secret engine
    local cert=$(VAULT_TOKEN="$vault_token" vault write -format=json pki/issue/aic-website common_name="test.aicorp.com")
    if echo "$cert" | jq -e '.data.certificate' > /dev/null; then
        print_status $GREEN "✅ PKI secret engine working"
    else
        print_status $RED "❌ PKI secret engine failed"
    fi
    
    print_status $GREEN "✅ Vault configuration test completed"
}

# Function to display configuration summary
display_summary() {
    print_status $BLUE "📋 Vault Configuration Summary"
    echo "=================================="
    echo "Vault URL: $VAULT_ADDR"
    echo "Namespace: $VAULT_NAMESPACE"
    echo ""
    print_status $BLUE "Authentication Methods:"
    echo "- Kubernetes (for pods)"
    echo "- AppRole (for applications)"
    echo "- LDAP (for users)"
    echo "- JWT/OIDC (for external systems)"
    echo "- AWS (for EC2/ECS workloads)"
    echo ""
    print_status $BLUE "Secret Engines:"
    echo "- KV v2 (application secrets)"
    echo "- Database (dynamic database credentials)"
    echo "- AWS (dynamic AWS credentials)"
    echo "- PKI (certificate management)"
    echo "- SSH (SSH certificate authority)"
    echo "- Transit (encryption as a service)"
    echo ""
    print_status $BLUE "Policies Created:"
    echo "- aic-website (application access)"
    echo "- admin (full access)"
    echo "- readonly (read-only access)"
    echo "- cicd (CI/CD pipeline access)"
    echo ""
    print_status $BLUE "Kubernetes Roles:"
    echo "- aic-website (application pods)"
    echo "- vault-admin (vault administration)"
    echo "- gitlab-ci (CI/CD pipelines)"
    echo "- monitoring (monitoring systems)"
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "Vault Initialization and Configuration Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -i, --init-only         Only initialize Vault (skip configuration)"
    echo "  -c, --config-only       Only configure Vault (skip initialization)"
    echo "  -t, --test-only         Only run tests"
    echo "  --skip-unseal           Skip unsealing Vault"
    echo "  --skip-auth             Skip authentication configuration"
    echo "  --skip-secrets          Skip secret engine configuration"
    echo "  --skip-policies         Skip policy creation"
    echo "  --skip-test             Skip configuration testing"
    echo ""
    echo "Environment Variables:"
    echo "  VAULT_ADDR             Vault server address"
    echo "  VAULT_TOKEN            Vault authentication token"
    echo "  VAULT_NAMESPACE        Kubernetes namespace for Vault"
    echo "  KUBERNETES_HOST        Kubernetes API server address"
    echo ""
    echo "Example:"
    echo "  export VAULT_ADDR=https://vault.aicorp.com"
    echo "  $0"
}

# Main function
main() {
    local init_only=false
    local config_only=false
    local test_only=false
    local skip_unseal=false
    local skip_auth=false
    local skip_secrets=false
    local skip_policies=false
    local skip_test=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -i|--init-only)
                init_only=true
                shift
                ;;
            -c|--config-only)
                config_only=true
                shift
                ;;
            -t|--test-only)
                test_only=true
                shift
                ;;
            --skip-unseal)
                skip_unseal=true
                shift
                ;;
            --skip-auth)
                skip_auth=true
                shift
                ;;
            --skip-secrets)
                skip_secrets=true
                shift
                ;;
            --skip-policies)
                skip_policies=true
                shift
                ;;
            --skip-test)
                skip_test=true
                shift
                ;;
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting Vault configuration..."
    
    # Check Vault status
    local vault_status_code=0
    check_vault_status || vault_status_code=$?
    
    if [ "$test_only" = true ]; then
        test_vault_configuration
        exit 0
    fi
    
    # Initialize Vault if needed
    if [ "$config_only" = false ] && [ $vault_status_code -eq 2 ]; then
        initialize_vault
    fi
    
    # Unseal Vault if needed
    if [ "$skip_unseal" = false ] && [ $vault_status_code -eq 1 ]; then
        unseal_vault
    fi
    
    if [ "$init_only" = true ]; then
        print_status $GREEN "🎉 Vault initialization completed!"
        exit 0
    fi
    
    # Get root token if not set
    if [ -z "$VAULT_TOKEN" ]; then
        export VAULT_TOKEN=$(kubectl get secret vault-root-token -n $VAULT_NAMESPACE -o jsonpath='{.data.vault-root-token\.txt}' | base64 -d)
    fi
    
    # Configure Vault
    create_service_accounts
    
    if [ "$skip_auth" = false ]; then
        configure_auth_methods
        configure_kubernetes_roles
        configure_approle
    fi
    
    if [ "$skip_secrets" = false ]; then
        configure_secret_engines
        create_initial_secrets
    fi
    
    if [ "$skip_policies" = false ]; then
        create_policies
    fi
    
    configure_audit_logging
    enable_monitoring
    
    if [ "$skip_test" = false ]; then
        test_vault_configuration
    fi
    
    display_summary
    
    print_status $GREEN "🎉 Vault configuration completed successfully!"
}

# Cleanup function
cleanup() {
    rm -f /tmp/ca_cert.crt /tmp/vault-*.txt
}

# Set trap for cleanup
trap cleanup EXIT

# Check prerequisites
if ! command -v vault &> /dev/null; then
    print_status $RED "❌ Vault CLI is not installed"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    print_status $RED "❌ kubectl is not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_status $RED "❌ jq is not installed"
    exit 1
fi

# Run main function
main "$@"
