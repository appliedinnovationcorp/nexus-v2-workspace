# Secrets Management Guide

This guide outlines the comprehensive secrets management solution implemented for the AIC Enterprise Platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [External Secrets Operator](#external-secrets-operator)
4. [Cloud Provider Integration](#cloud-provider-integration)
5. [HashiCorp Vault Integration](#hashicorp-vault-integration)
6. [Secret Rotation](#secret-rotation)
7. [Development Workflow](#development-workflow)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The AIC Enterprise Platform uses a multi-layered secrets management approach that integrates with cloud provider secret stores and provides a consistent interface for managing secrets across environments. This solution addresses previous weaknesses by implementing:

- Secure storage of secrets in dedicated secret management services
- Integration with Kubernetes through the External Secrets Operator
- Automated secret rotation
- Least privilege access control
- Audit logging for all secret operations
- Multi-cloud support

## Architecture

Our secrets management architecture consists of the following components:

1. **Secret Stores**: Cloud provider secret management services (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager) or HashiCorp Vault for on-premises deployments
2. **External Secrets Operator**: Kubernetes operator that synchronizes secrets from external stores into Kubernetes secrets
3. **SecretStore Resources**: Kubernetes custom resources that define connections to external secret stores
4. **ExternalSecret Resources**: Kubernetes custom resources that define which secrets to fetch and how to transform them
5. **Kubernetes Secrets**: Standard Kubernetes secrets created by the External Secrets Operator
6. **Secrets Management CLI**: Command-line tool for managing secrets across environments

## External Secrets Operator

The External Secrets Operator (ESO) is a Kubernetes operator that connects to external secret management systems and automatically creates Kubernetes secrets based on the external secrets.

### Installation

```bash
# Add the External Secrets Helm repository
helm repo add external-secrets https://charts.external-secrets.io

# Update Helm repositories
helm repo update

# Install External Secrets Operator
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system \
  --create-namespace \
  --set installCRDs=true
```

### SecretStore Configuration

SecretStore resources define the connection to external secret stores:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: aic-platform
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

### ExternalSecret Configuration

ExternalSecret resources define which secrets to fetch and how to transform them:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-secrets
  namespace: aic-platform
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        DATABASE_URL: "postgresql://{{ .username }}:{{ .password }}@{{ .host }}:{{ .port }}/{{ .database }}?sslmode=require"
        DB_USERNAME: "{{ .username }}"
        DB_PASSWORD: "{{ .password }}"
        DB_HOST: "{{ .host }}"
        DB_PORT: "{{ .port }}"
        DB_NAME: "{{ .database }}"
  data:
  - secretKey: username
    remoteRef:
      key: aic/database/production
      property: username
  - secretKey: password
    remoteRef:
      key: aic/database/production
      property: password
  - secretKey: host
    remoteRef:
      key: aic/database/production
      property: host
  - secretKey: port
    remoteRef:
      key: aic/database/production
      property: port
  - secretKey: database
    remoteRef:
      key: aic/database/production
      property: database
```

## Cloud Provider Integration

### AWS Secrets Manager

AWS Secrets Manager is used for AWS deployments:

1. **IAM Setup**:
   - Create an IAM role with permissions to access Secrets Manager
   - Configure IRSA (IAM Roles for Service Accounts) for Kubernetes integration

2. **Secret Naming Convention**:
   - Format: `aic/<environment>/<service>/<secret-name>`
   - Example: `aic/production/database/password`

3. **Tags**:
   - Environment: `production`, `staging`, `development`
   - Project: `aic-platform`
   - ManagedBy: `terraform`

### Azure Key Vault

Azure Key Vault is used for Azure deployments:

1. **Identity Setup**:
   - Create a managed identity for AKS
   - Grant access policies to the managed identity

2. **Secret Naming Convention**:
   - Format: `<service>-<secret-name>`
   - Example: `database-password`

3. **Tags**:
   - Environment: `production`, `staging`, `development`
   - Project: `aic-platform`
   - ManagedBy: `terraform`

### GCP Secret Manager

GCP Secret Manager is used for GCP deployments:

1. **IAM Setup**:
   - Create a service account with Secret Manager access
   - Configure Workload Identity for GKE integration

2. **Secret Naming Convention**:
   - Format: `aic-<environment>-<service>-<secret-name>`
   - Example: `aic-production-database-password`

3. **Labels**:
   - environment: `production`, `staging`, `development`
   - project: `aic-platform`
   - managed-by: `terraform`

## HashiCorp Vault Integration

HashiCorp Vault is used for on-premises deployments:

### Vault Setup

```bash
# Initialize Vault
vault operator init

# Unseal Vault
vault operator unseal

# Enable Kubernetes authentication
vault auth enable kubernetes

# Configure Kubernetes authentication
vault write auth/kubernetes/config \
    token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
    kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
```

### Vault Policies

```hcl
# database-policy.hcl
path "secret/data/aic/database/*" {
  capabilities = ["read"]
}
```

```bash
# Create policy
vault policy write aic-database database-policy.hcl

# Create Kubernetes auth role
vault write auth/kubernetes/role/aic-database \
    bound_service_account_names=aic-database \
    bound_service_account_namespaces=aic-platform \
    policies=aic-database \
    ttl=24h
```

### SecretStore Configuration for Vault

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: aic-platform
spec:
  provider:
    vault:
      server: "https://vault.aic-platform.svc.cluster.local:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "aic-database"
          serviceAccountRef:
            name: "vault-auth"
```

## Secret Rotation

We implement automated secret rotation to minimize the risk of credential compromise:

### Rotation Schedules

- **Database credentials**: Every 30 days
- **API keys**: Every 90 days
- **JWT tokens**: Every 7 days
- **SSL certificates**: Every 90 days

### Rotation Implementation

1. **AWS Secrets Manager**:
   - Use AWS Secrets Manager rotation functionality
   - Configure Lambda functions for custom rotation logic

2. **Azure Key Vault**:
   - Use Azure Functions for scheduled rotation
   - Implement key versioning for seamless rotation

3. **GCP Secret Manager**:
   - Use Cloud Scheduler and Cloud Functions for rotation
   - Implement version management for secrets

4. **HashiCorp Vault**:
   - Use Vault's dynamic secrets for database credentials
   - Implement periodic token rotation

### Rotation Monitoring

- Monitor secret age and trigger alerts for secrets approaching rotation time
- Track successful and failed rotation attempts
- Implement fallback mechanisms for failed rotations

## Development Workflow

### Local Development

For local development, we use a combination of:

1. **Development Secrets**:
   - Non-sensitive development credentials stored in version control
   - Local `.env` files for developer-specific settings (not committed)

2. **Vault Dev Server**:
   - Run a local Vault server in development mode
   - Pre-populate with development secrets

### CI/CD Integration

Our CI/CD pipeline integrates with secrets management:

1. **Build-time Secrets**:
   - CI/CD platform secrets for build-time access
   - Just-in-time access to required secrets

2. **Deployment Secrets**:
   - External Secrets Operator handles production secrets
   - No secrets in deployment manifests

## Security Best Practices

We follow these security best practices for secrets management:

1. **Least Privilege Access**:
   - Service-specific IAM roles and policies
   - Time-limited access tokens
   - Audit logging for all access

2. **Secret Encryption**:
   - Encryption at rest for all secrets
   - Encryption in transit using TLS
   - Key rotation for encryption keys

3. **Access Controls**:
   - Multi-factor authentication for human access
   - Service principal authentication for automated processes
   - IP restrictions for administrative access

4. **Audit and Compliance**:
   - Comprehensive audit logs for all secret operations
   - Regular access reviews
   - Compliance reporting

## Troubleshooting

### Common Issues

1. **Secret Synchronization Failures**:
   - Check External Secrets Operator logs
   - Verify SecretStore connection details
   - Check IAM permissions

2. **Access Denied Errors**:
   - Verify service account permissions
   - Check role bindings and policies
   - Ensure proper authentication configuration

3. **Secret Rotation Failures**:
   - Check rotation function logs
   - Verify database connectivity
   - Ensure proper permissions for rotation

### Debugging Commands

```bash
# Check External Secrets Operator status
kubectl get pods -n external-secrets-system

# Check SecretStore status
kubectl get secretstore -n aic-platform

# Check ExternalSecret status
kubectl get externalsecret -n aic-platform

# View External Secrets Operator logs
kubectl logs -n external-secrets-system -l app.kubernetes.io/name=external-secrets

# Check if Kubernetes secret was created
kubectl get secret database-credentials -n aic-platform

# Describe ExternalSecret for troubleshooting
kubectl describe externalsecret database-secrets -n aic-platform
```

## Conclusion

This comprehensive secrets management solution addresses the previous weaknesses in our infrastructure by implementing secure, scalable, and automated secrets management across all environments. By following this guide, you can ensure that secrets are properly managed throughout the application lifecycle.
