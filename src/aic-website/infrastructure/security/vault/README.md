# HashiCorp Vault Configuration

This directory contains comprehensive HashiCorp Vault configuration for the AIC Website project, providing enterprise-grade secret management with Kubernetes integration.

## 📁 Files Overview

- **`vault-config.hcl`** - Detailed Vault server configuration
- **`vault-values.yaml`** - Helm chart values for Vault deployment
- **`deploy-vault.sh`** - Automated Vault deployment script
- **`vault-init-config.sh`** - Vault initialization and configuration script
- **`vault-k8s-integration.yaml`** - Kubernetes integration resources
- **`README.md`** - This documentation file

## 🚀 Quick Start

### 1. Deploy Vault

```bash
# Set environment variables
export VAULT_DOMAIN="vault.aicorp.com"
export VAULT_NAMESPACE="vault-system"
export AWS_KMS_KEY_ID="arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"

# Deploy Vault with automated script
./deploy-vault.sh --domain $VAULT_DOMAIN --kms-key-id $AWS_KMS_KEY_ID
```

### 2. Initialize and Configure Vault

```bash
# Set Vault address
export VAULT_ADDR="https://vault.aicorp.com"

# Initialize and configure Vault
./vault-init-config.sh
```

### 3. Apply Kubernetes Integration

```bash
# Apply Kubernetes integration resources
kubectl apply -f vault-k8s-integration.yaml
```

## ⚙️ Configuration Details

### Vault Server Configuration (`vault-config.hcl`)

#### Storage Backend
```hcl
# Consul storage for HA
storage "consul" {
  address = "consul.vault-system.svc.cluster.local:8500"
  path    = "vault/"
  scheme  = "http"
  consistency_mode = "strong"
  max_parallel     = "128"
}

# Alternative: Integrated Storage (Raft)
# storage "raft" {
#   path    = "/vault/data"
#   node_id = "vault-0"
# }
```

#### Listener Configuration
```hcl
listener "tcp" {
  address       = "0.0.0.0:8200"
  cluster_addr  = "0.0.0.0:8201"
  tls_cert_file = "/vault/tls/vault-server.pem"
  tls_key_file  = "/vault/tls/vault-server-key.pem"
  tls_min_version = "tls12"
}
```

#### Auto-Unseal with AWS KMS
```hcl
seal "awskms" {
  region     = "us-west-2"
  kms_key_id = "arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"
  endpoint   = "https://kms.us-west-2.amazonaws.com"
}
```

#### Security and Performance
```hcl
# Logging
log_level = "INFO"
log_format = "json"
log_file = "/vault/logs/vault.log"

# Performance
default_lease_ttl = "768h"    # 32 days
max_lease_ttl = "8760h"       # 365 days
cache_size = "32000"

# Security
disable_mlock = true
ui = true
```

### Helm Chart Configuration (`vault-values.yaml`)

#### High Availability Setup
```yaml
server:
  ha:
    enabled: true
    replicas: 3
    config: |
      ui = true
      listener "tcp" {
        tls_disable = 0
        address = "[::]:8200"
        cluster_address = "[::]:8201"
      }
      storage "consul" {
        path = "vault"
        address = "consul.vault-system.svc.cluster.local:8500"
      }
```

#### Agent Injector
```yaml
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
```

#### CSI Driver
```yaml
csi:
  enabled: true
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 50m
      memory: 128Mi
```

## 🔐 Authentication Methods

### 1. Kubernetes Authentication
```bash
# Enable and configure
vault auth enable kubernetes
vault write auth/kubernetes/config \
    token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
    kubernetes_host="https://kubernetes.default.svc.cluster.local" \
    kubernetes_ca_cert="$(cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt)"

# Create role
vault write auth/kubernetes/role/aic-website \
    bound_service_account_names=aic-website \
    bound_service_account_namespaces=aic-website-prod,aic-website-staging,aic-website-dev \
    policies=aic-website \
    ttl=24h
```

### 2. AppRole Authentication
```bash
# Enable and configure
vault auth enable approle
vault write auth/approle/role/aic-website \
    token_policies="aic-website" \
    token_ttl=1h \
    token_max_ttl=4h \
    bind_secret_id=true
```

### 3. LDAP Authentication
```bash
# Enable and configure
vault auth enable ldap
vault write auth/ldap/config \
    url="ldap://ldap.aicorp.com" \
    userdn="ou=Users,dc=aicorp,dc=com" \
    userattr="uid" \
    groupdn="ou=Groups,dc=aicorp,dc=com"
```

### 4. JWT/OIDC Authentication
```bash
# Enable and configure
vault auth enable jwt
vault write auth/jwt/config \
    bound_issuer="https://oidc.aicorp.com" \
    oidc_discovery_url="https://oidc.aicorp.com"
```

### 5. AWS Authentication
```bash
# Enable and configure
vault auth enable aws
vault write auth/aws/config/client \
    access_key="$AWS_ACCESS_KEY_ID" \
    secret_key="$AWS_SECRET_ACCESS_KEY" \
    region="us-west-2"
```

## 🗄️ Secret Engines

### 1. Key-Value (KV) v2
```bash
# Enable KV v2 engines
vault secrets enable -path=secret kv-v2
vault secrets enable -path=aic-website kv-v2

# Store secrets
vault kv put aic-website/database \
    username="aic_website_user" \
    password="secure_password" \
    host="postgres.aic-website.svc.cluster.local" \
    port="5432" \
    database="aic_website"
```

### 2. Database Secret Engine
```bash
# Enable and configure
vault secrets enable database
vault write database/config/postgresql \
    plugin_name=postgresql-database-plugin \
    connection_url="postgresql://{{username}}:{{password}}@postgres.aic-website.svc.cluster.local:5432/aic_website?sslmode=require" \
    allowed_roles="aic-website-role" \
    username="vault" \
    password="vault-db-password"

# Create role
vault write database/roles/aic-website-role \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';" \
    default_ttl="1h" \
    max_ttl="24h"
```

### 3. AWS Secret Engine
```bash
# Enable and configure
vault secrets enable aws
vault write aws/config/root \
    access_key="$AWS_ACCESS_KEY_ID" \
    secret_key="$AWS_SECRET_ACCESS_KEY" \
    region="us-west-2"

# Create role
vault write aws/roles/s3-role \
    credential_type=iam_user \
    policy_document=-<<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::aic-website-*/*"
    }
  ]
}
EOF
```

### 4. PKI Secret Engine
```bash
# Enable and configure
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
    common_name="AIC Website Root CA" \
    ttl=87600h > ca_cert.crt

# Create role
vault write pki/roles/aic-website \
    allowed_domains="aicorp.com,aic-website.local" \
    allow_subdomains=true \
    max_ttl="720h"
```

### 5. SSH Secret Engine
```bash
# Enable and configure
vault secrets enable ssh
vault write ssh/config/ca generate_signing_key=true

# Create role
vault write ssh/roles/aic-website \
    key_type=ca \
    default_user=ubuntu \
    allowed_users="ubuntu,admin" \
    ttl="30m0s"
```

### 6. Transit Secret Engine
```bash
# Enable and configure
vault secrets enable transit
vault write -f transit/keys/aic-website

# Encrypt data
vault write transit/encrypt/aic-website plaintext=$(base64 <<< "my secret data")

# Decrypt data
vault write transit/decrypt/aic-website ciphertext="vault:v1:..."
```

## 📋 Policies

### Application Policy
```hcl
# AIC Website Application Policy
path "aic-website/data/*" {
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

path "transit/encrypt/aic-website" {
  capabilities = ["update"]
}

path "transit/decrypt/aic-website" {
  capabilities = ["update"]
}
```

### Admin Policy
```hcl
# Admin Policy - Full access
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
```

### CI/CD Policy
```hcl
# CI/CD Policy for GitLab
path "aic-website/data/ci/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "database/creds/aic-website-role" {
  capabilities = ["read"]
}

path "pki/issue/aic-website" {
  capabilities = ["create", "update"]
}
```

## ☸️ Kubernetes Integration

### Agent Injection
```yaml
# Service Account with Agent Injection
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aic-website
  namespace: aic-website-prod
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "aic-website"
    vault.hashicorp.com/agent-inject-secret-database: "aic-website/data/database"
    vault.hashicorp.com/agent-inject-template-database: |
      {{- with secret "aic-website/data/database" -}}
      export DATABASE_URL="postgresql://{{ .Data.data.username }}:{{ .Data.data.password }}@{{ .Data.data.host }}:{{ .Data.data.port }}/{{ .Data.data.database }}"
      {{- end -}}
```

### CSI Driver Integration
```yaml
# SecretProviderClass for CSI Driver
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: aic-website-database-secrets
  namespace: aic-website-prod
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.aicorp.com"
    roleName: "aic-website"
    objects: |
      - objectName: "database-username"
        secretPath: "aic-website/data/database"
        secretKey: "username"
      - objectName: "database-password"
        secretPath: "aic-website/data/database"
        secretKey: "password"
```

### Deployment Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aic-website
  namespace: aic-website-prod
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "aic-website"
        vault.hashicorp.com/agent-inject-secret-config: "aic-website/data/database"
    spec:
      serviceAccountName: aic-website
      containers:
      - name: aic-website
        image: aic-website:latest
        volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets-store"
          readOnly: true
      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: "aic-website-database-secrets"
```

## 🔒 Security Features

### TLS Configuration
- End-to-end TLS encryption
- Certificate-based authentication
- Minimum TLS 1.2
- Strong cipher suites

### Auto-Unseal
- AWS KMS integration
- Automatic unsealing on restart
- No manual intervention required
- Secure key management

### Audit Logging
```bash
# Enable audit logging
vault audit enable file file_path=/vault/audit/vault_audit.log
vault audit enable syslog tag="vault" facility="AUTH"
```

### Network Security
- Network policies for pod communication
- Ingress restrictions
- Service mesh integration
- mTLS between components

## 📊 Monitoring and Observability

### Metrics
```yaml
# Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: vault-metrics
  namespace: vault-system
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: vault
  endpoints:
  - port: http
    path: /v1/sys/metrics
    params:
      format: ['prometheus']
```

### Health Checks
```bash
# Vault health check
vault status

# System health
curl -s https://vault.aicorp.com/v1/sys/health | jq

# Seal status
curl -s https://vault.aicorp.com/v1/sys/seal-status | jq
```

### Logging
- Structured JSON logging
- Centralized log aggregation
- Audit trail for all operations
- Integration with ELK stack

## 🚨 Troubleshooting

### Common Issues

#### 1. Vault Sealed
```bash
# Check seal status
vault status

# Unseal Vault (if not using auto-unseal)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>
```

#### 2. Authentication Issues
```bash
# Test Kubernetes authentication
kubectl create token aic-website --namespace=aic-website-prod
vault write auth/kubernetes/login role=aic-website jwt="<token>"

# Check role configuration
vault read auth/kubernetes/role/aic-website
```

#### 3. Secret Access Issues
```bash
# Test secret access
vault kv get aic-website/database

# Check policy
vault policy read aic-website

# Check token capabilities
vault token capabilities aic-website/data/database
```

#### 4. Agent Injection Not Working
```bash
# Check agent injector logs
kubectl logs -n vault-system deployment/vault-agent-injector

# Check webhook configuration
kubectl get mutatingwebhookconfiguration vault-agent-injector-cfg

# Check service account annotations
kubectl get sa aic-website -n aic-website-prod -o yaml
```

### Debug Commands
```bash
# Vault server logs
kubectl logs -n vault-system vault-0

# Agent injector logs
kubectl logs -n vault-system deployment/vault-agent-injector

# CSI driver logs
kubectl logs -n vault-system daemonset/vault-csi-provider

# Check Vault pods
kubectl get pods -n vault-system

# Check Vault services
kubectl get svc -n vault-system

# Check ingress
kubectl get ingress -n vault-system
```

## 🔄 Backup and Recovery

### Backup Procedures
```bash
# Consul snapshot (if using Consul storage)
kubectl exec -n vault-system consul-0 -- consul snapshot save /tmp/backup.snap

# Vault configuration backup
kubectl get secret -n vault-system vault-root-token -o yaml > vault-root-token-backup.yaml
kubectl get secret -n vault-system vault-unseal-keys -o yaml > vault-unseal-keys-backup.yaml

# Policy backup
vault policy list | xargs -I {} vault policy read {} > vault-policies-backup.hcl
```

### Recovery Procedures
```bash
# Restore Consul snapshot
kubectl cp backup.snap vault-system/consul-0:/tmp/backup.snap
kubectl exec -n vault-system consul-0 -- consul snapshot restore /tmp/backup.snap

# Restore Vault secrets
kubectl apply -f vault-root-token-backup.yaml
kubectl apply -f vault-unseal-keys-backup.yaml

# Restore policies
vault policy write policy-name vault-policies-backup.hcl
```

## 📈 Performance Tuning

### Resource Optimization
```yaml
# Vault server resources
server:
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 4Gi
      cpu: 2000m

# Agent injector resources
injector:
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 500m
```

### Storage Optimization
- Use high-performance storage classes
- Configure appropriate cache sizes
- Optimize lease TTLs
- Regular cleanup of expired tokens

### Network Optimization
- Use service mesh for efficient routing
- Configure connection pooling
- Optimize TLS handshakes
- Use local caching where appropriate

## 🎯 Best Practices

### Security
1. **Principle of Least Privilege**: Grant minimal required permissions
2. **Regular Rotation**: Rotate secrets and tokens regularly
3. **Audit Everything**: Enable comprehensive audit logging
4. **Network Segmentation**: Use network policies and service mesh
5. **Encryption**: Encrypt data at rest and in transit

### Operations
1. **High Availability**: Deploy in HA mode with multiple replicas
2. **Monitoring**: Implement comprehensive monitoring and alerting
3. **Backup**: Regular backups of configuration and data
4. **Testing**: Regular disaster recovery testing
5. **Documentation**: Keep configuration and procedures documented

### Development
1. **Environment Separation**: Use different Vault instances for different environments
2. **Secret Templating**: Use Vault agent templates for configuration
3. **Dynamic Secrets**: Prefer dynamic secrets over static ones
4. **Integration Testing**: Test Vault integration in CI/CD pipelines
5. **Secret Lifecycle**: Implement proper secret lifecycle management

---

## 🎯 Quick Reference

### Key Commands
```bash
# Deploy Vault
./deploy-vault.sh --domain vault.example.com

# Initialize Vault
./vault-init-config.sh

# Check Vault status
vault status

# List authentication methods
vault auth list

# List secret engines
vault secrets list

# List policies
vault policy list
```

### Important URLs
- **Vault UI**: https://vault.aicorp.com
- **Vault API**: https://vault.aicorp.com/v1/
- **Health Check**: https://vault.aicorp.com/v1/sys/health

### Configuration Files
- **vault-config.hcl**: Server configuration
- **vault-values.yaml**: Helm chart values
- **deploy-vault.sh**: Deployment script
- **vault-init-config.sh**: Initialization script
- **vault-k8s-integration.yaml**: Kubernetes resources

---

**Next Steps**: After Vault setup is complete, proceed to configure application integration and test secret injection workflows.
