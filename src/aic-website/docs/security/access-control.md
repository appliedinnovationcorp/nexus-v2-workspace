# Access Control & Authentication Runbook

## Overview

This runbook provides comprehensive procedures for managing identity and access controls, handling authentication incidents, and responding to account compromise scenarios in the AIC Website platform.

## Identity and Access Management (IAM) Architecture

### Authentication Layers

#### 1. User Authentication
- **Multi-Factor Authentication (MFA)**: Required for all user accounts
- **Single Sign-On (SSO)**: Centralized authentication via SAML/OIDC
- **Passwordless Authentication**: WebAuthn/FIDO2 for enhanced security
- **Risk-Based Authentication**: Adaptive authentication based on context

#### 2. Service Authentication
- **Service Accounts**: Kubernetes service accounts with RBAC
- **API Keys**: Rotating API keys for service-to-service communication
- **Mutual TLS (mTLS)**: Certificate-based authentication for services
- **OAuth 2.0/JWT**: Token-based authentication for APIs

#### 3. Infrastructure Authentication
- **SSH Key Management**: Centralized SSH key distribution and rotation
- **Certificate Management**: Automated certificate lifecycle management
- **Cloud IAM**: AWS/GCP/Azure identity and access management
- **Secrets Management**: HashiCorp Vault for secrets and credentials

## Access Control Procedures

### User Account Management

#### New User Onboarding
```bash
# Create user account
./scripts/user-management.sh create --username=<username> \
  --email=<email> --role=<role> --department=<dept>

# Assign initial permissions
./scripts/rbac-assignment.sh --user=<username> --role=<role> \
  --resources=<resource-list>

# Enable MFA requirement
./scripts/mfa-enforcement.sh --user=<username> --method="totp,webauthn"

# Send welcome and security training
./scripts/user-onboarding.sh --user=<username> --send-welcome --security-training
```

#### User Access Review
```bash
# Quarterly access review
./scripts/access-review.sh --type="quarterly" --all-users

# Role-based access review
./scripts/role-review.sh --role=<role> --validate-permissions

# Privileged access review
./scripts/privileged-review.sh --admin-users --monthly

# Inactive account review
./scripts/inactive-accounts.sh --threshold="90-days" --action="disable"
```

#### User Offboarding
```bash
# Immediate access revocation
./scripts/user-management.sh disable --username=<username> --immediate

# Transfer data ownership
./scripts/data-transfer.sh --from-user=<username> --to-user=<manager>

# Revoke certificates and keys
./scripts/credential-revocation.sh --user=<username> --all-credentials

# Archive user data
./scripts/user-archive.sh --username=<username> --retention-period="7-years"
```

### Role-Based Access Control (RBAC)

#### RBAC Configuration
```yaml
# Example RBAC configuration
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: backend-services
  name: developer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "create", "update", "patch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "update", "patch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: backend-services
subjects:
- kind: User
  name: developer@aicorp.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

#### Role Management
```bash
# Create custom role
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: security-auditor
rules:
- apiGroups: [""]
  resources: ["pods", "services", "secrets", "configmaps"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list"]
- apiGroups: ["networking.k8s.io"]
  resources: ["networkpolicies"]
  verbs: ["get", "list"]
EOF

# Assign role to user
kubectl create clusterrolebinding security-auditor-binding \
  --clusterrole=security-auditor --user=auditor@aicorp.com
```

### Privileged Access Management (PAM)

#### Just-In-Time (JIT) Access
```bash
# Request privileged access
./scripts/jit-access.sh request --role="admin" --duration="2h" \
  --justification="Emergency maintenance" --approver="manager@aicorp.com"

# Approve access request
./scripts/jit-access.sh approve --request-id=<id> --approver=<email>

# Monitor privileged sessions
./scripts/privileged-monitoring.sh --active-sessions --real-time

# Revoke access
./scripts/jit-access.sh revoke --session-id=<id> --reason="Task completed"
```

#### Privileged Account Monitoring
```bash
# Monitor admin activities
./scripts/admin-monitoring.sh --real-time --alert-threshold="high"

# Audit privileged commands
./scripts/command-audit.sh --privileged-users --timerange="last 24h"

# Session recording
./scripts/session-recording.sh --privileged-sessions --retention="90d"

# Anomaly detection
./scripts/privileged-anomaly.sh --behavioral-analysis --alert-on-deviation
```

## Authentication Incident Response

### Failed Authentication Analysis

#### Brute Force Attack Response
```bash
# Detect brute force patterns
./scripts/brute-force-detection.sh --threshold="10-attempts-5min" --auto-block

# Analyze attack patterns
./scripts/attack-analysis.sh --type="brute-force" --source-analysis

# Implement countermeasures
kubectl apply -f security/rate-limiting/auth-protection.yaml

# Notify affected users
./scripts/user-notification.sh --type="security-alert" --users=<affected-users>
```

#### Account Lockout Management
```bash
# Check locked accounts
./scripts/account-status.sh --locked-accounts --timerange="last 24h"

# Unlock legitimate accounts
./scripts/account-unlock.sh --user=<username> --verify-identity

# Investigate lockout causes
./scripts/lockout-investigation.sh --user=<username> --root-cause-analysis

# Adjust lockout policies
./scripts/lockout-policy.sh --update --threshold="5-attempts" --duration="15min"
```

### Multi-Factor Authentication (MFA) Issues

#### MFA Bypass Attempts
```bash
# Detect MFA bypass attempts
./scripts/mfa-monitoring.sh --bypass-attempts --alert-threshold="3"

# Investigate bypass methods
./scripts/mfa-investigation.sh --user=<username> --method-analysis

# Strengthen MFA requirements
./scripts/mfa-enforcement.sh --strengthen --require-hardware-tokens

# User education
./scripts/security-awareness.sh --topic="mfa-security" --target-users=<users>
```

#### MFA Device Management
```bash
# Register new MFA device
./scripts/mfa-device.sh register --user=<username> --device-type="webauthn"

# Remove compromised device
./scripts/mfa-device.sh remove --user=<username> --device-id=<id> --reason="compromised"

# Backup authentication codes
./scripts/mfa-backup.sh generate --user=<username> --codes=10

# Device inventory audit
./scripts/mfa-audit.sh --all-devices --compliance-check
```

## Account Compromise Response

### Compromised Account Detection

#### Indicators of Compromise
- **Unusual login locations** or times
- **Multiple concurrent sessions** from different locations
- **Privilege escalation** attempts
- **Unusual data access** patterns
- **Configuration changes** outside normal behavior
- **Failed MFA** attempts after successful login

#### Detection and Analysis
```bash
# Analyze user behavior
./scripts/user-behavior-analysis.sh --user=<username> --anomaly-detection

# Check concurrent sessions
./scripts/session-analysis.sh --user=<username> --concurrent-check

# Review access logs
./scripts/access-log-analysis.sh --user=<username> --timerange="last 7d"

# Geolocation analysis
./scripts/geo-analysis.sh --user=<username> --impossible-travel-detection
```

### Immediate Response Actions

#### Account Isolation
```bash
# Immediately disable account
./scripts/account-disable.sh --user=<username> --immediate --reason="compromise-suspected"

# Revoke active sessions
./scripts/session-revocation.sh --user=<username> --all-sessions

# Revoke API tokens
./scripts/token-revocation.sh --user=<username> --all-tokens

# Reset passwords
./scripts/password-reset.sh --user=<username> --force-reset --notify-user
```

#### Credential Rotation
```bash
# Rotate user credentials
./scripts/credential-rotation.sh --user=<username> --all-credentials

# Rotate service account keys
kubectl delete secret <service-account-secret> -n <namespace>
kubectl create secret generic <service-account-secret> --from-literal=key=<new-key> -n <namespace>

# Rotate API keys
./scripts/api-key-rotation.sh --user=<username> --services="all"

# Update shared credentials
./scripts/shared-credential-rotation.sh --affected-by-user=<username>
```

### Investigation Procedures

#### Forensic Analysis
```bash
# Collect authentication logs
./scripts/auth-log-collection.sh --user=<username> --timerange="compromise-window"

# Analyze login patterns
./scripts/login-pattern-analysis.sh --user=<username> --behavioral-baseline

# Check for lateral movement
./scripts/lateral-movement-check.sh --user=<username> --network-analysis

# Data access audit
./scripts/data-access-audit.sh --user=<username> --sensitive-data-focus
```

#### Impact Assessment
```bash
# Assess data exposure
./scripts/data-exposure-assessment.sh --user=<username> --access-scope

# Check system modifications
./scripts/system-modification-check.sh --user=<username> --configuration-changes

# Evaluate privilege abuse
./scripts/privilege-abuse-check.sh --user=<username> --admin-actions

# Business impact analysis
./scripts/business-impact.sh --user=<username> --affected-services
```

## Service Account Security

### Service Account Management

#### Service Account Creation
```bash
# Create service account with minimal permissions
kubectl create serviceaccount <sa-name> -n <namespace>

# Create role with least privilege
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: <namespace>
  name: <sa-name>-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["<specific-secret>"]
  verbs: ["get"]
EOF

# Bind role to service account
kubectl create rolebinding <sa-name>-binding \
  --role=<sa-name>-role --serviceaccount=<namespace>:<sa-name> -n <namespace>
```

#### Service Account Monitoring
```bash
# Monitor service account usage
./scripts/sa-monitoring.sh --usage-analysis --anomaly-detection

# Audit service account permissions
./scripts/sa-audit.sh --permission-review --over-privileged-check

# Check for unused service accounts
./scripts/sa-cleanup.sh --unused-threshold="30d" --dry-run

# Token rotation monitoring
./scripts/sa-token-monitoring.sh --rotation-compliance --expiry-alerts
```

### API Key Management

#### API Key Lifecycle
```bash
# Generate new API key
./scripts/api-key-management.sh generate --service=<service> \
  --permissions=<permissions> --expiry="90d"

# Rotate API key
./scripts/api-key-management.sh rotate --key-id=<id> --notify-service

# Revoke compromised key
./scripts/api-key-management.sh revoke --key-id=<id> --reason="compromise"

# Audit API key usage
./scripts/api-key-audit.sh --usage-analysis --unused-keys
```

#### API Key Security
```bash
# Monitor API key usage patterns
./scripts/api-monitoring.sh --key-usage --anomaly-detection

# Check for key exposure
./scripts/key-exposure-check.sh --scan-repositories --scan-logs

# Validate key permissions
./scripts/key-permission-audit.sh --over-privileged-check

# Implement key rotation policy
./scripts/key-rotation-policy.sh --enforce --max-age="90d"
```

## Certificate and PKI Management

### Certificate Lifecycle Management

#### Certificate Issuance
```bash
# Issue new certificate
./scripts/cert-management.sh issue --cn=<common-name> \
  --san=<subject-alt-names> --validity="1y"

# Deploy certificate to services
kubectl create secret tls <cert-name> --cert=<cert-file> --key=<key-file> -n <namespace>

# Configure automatic renewal
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: <cert-name>
  namespace: <namespace>
spec:
  secretName: <cert-name>-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: <common-name>
  dnsNames:
  - <dns-name>
EOF
```

#### Certificate Monitoring
```bash
# Monitor certificate expiry
./scripts/cert-monitoring.sh --expiry-check --alert-threshold="30d"

# Validate certificate chains
./scripts/cert-validation.sh --chain-validation --all-certificates

# Check certificate revocation
./scripts/cert-revocation-check.sh --crl-check --ocsp-check

# Audit certificate usage
./scripts/cert-audit.sh --usage-analysis --unused-certificates
```

### PKI Security

#### Certificate Authority (CA) Security
```bash
# Secure CA private keys
./scripts/ca-security.sh --key-protection --hsm-storage

# Monitor CA operations
./scripts/ca-monitoring.sh --issuance-monitoring --revocation-monitoring

# CA key rotation
./scripts/ca-rotation.sh --plan --impact-assessment

# Cross-certification management
./scripts/cross-cert.sh --external-cas --trust-validation
```

## Access Control Monitoring and Alerting

### Real-time Monitoring

#### Authentication Monitoring
```bash
# Deploy authentication monitoring
kubectl apply -f monitoring/auth-monitoring.yaml

# Configure authentication alerts
kubectl apply -f monitoring/auth-alerts.yaml

# Set up behavioral analytics
kubectl apply -f monitoring/behavioral-analytics.yaml
```

#### Access Pattern Analysis
```bash
# Analyze access patterns
./scripts/access-pattern-analysis.sh --real-time --ml-based

# Detect privilege escalation
./scripts/privilege-escalation-detection.sh --continuous-monitoring

# Monitor cross-service access
./scripts/cross-service-monitoring.sh --service-mesh-analysis

# Detect data access anomalies
./scripts/data-access-anomaly.sh --sensitive-data-focus
```

### Compliance and Reporting

#### Access Control Compliance
```bash
# Generate compliance report
./scripts/compliance-report.sh --framework="sox,pci-dss" --access-controls

# Audit trail generation
./scripts/audit-trail.sh --access-events --timerange="last 90d"

# Segregation of duties check
./scripts/sod-check.sh --role-conflicts --policy-violations

# Least privilege assessment
./scripts/least-privilege.sh --over-privileged-users --recommendations
```

#### Regular Reporting
```bash
# Daily access summary
./scripts/access-report.sh --daily --failed-attempts --anomalies

# Weekly privilege review
./scripts/privilege-report.sh --weekly --admin-activities

# Monthly access certification
./scripts/access-certification.sh --monthly --manager-review

# Quarterly comprehensive audit
./scripts/comprehensive-audit.sh --quarterly --all-access-controls
```

## Emergency Access Procedures

### Break-Glass Access

#### Emergency Access Activation
```bash
# Activate break-glass account
./scripts/break-glass.sh activate --account=<emergency-account> \
  --justification="<emergency-reason>" --duration="4h"

# Monitor break-glass usage
./scripts/break-glass-monitoring.sh --real-time --all-activities

# Approve emergency access
./scripts/break-glass.sh approve --request-id=<id> --approver=<manager>

# Deactivate after use
./scripts/break-glass.sh deactivate --account=<emergency-account> --reason="emergency-resolved"
```

#### Emergency Access Audit
```bash
# Audit break-glass usage
./scripts/break-glass-audit.sh --usage-review --timerange="last 30d"

# Validate emergency justifications
./scripts/emergency-validation.sh --justification-review --approval-check

# Report emergency access
./scripts/emergency-report.sh --management-report --compliance-report
```

## Integration with External Systems

### Identity Provider Integration
```bash
# Configure SAML SSO
kubectl apply -f auth/saml-config.yaml

# Set up OIDC integration
kubectl apply -f auth/oidc-config.yaml

# Configure LDAP/AD integration
kubectl apply -f auth/ldap-config.yaml

# Test identity provider connectivity
./scripts/idp-test.sh --all-providers --connectivity-check
```

### Security Information Integration
```bash
# Integrate with SIEM
./scripts/siem-integration.sh --auth-events --real-time-feed

# Connect to identity governance platform
./scripts/iga-integration.sh --user-lifecycle --access-reviews

# Integrate with PAM solution
./scripts/pam-integration.sh --privileged-access --session-monitoring
```

---

**Next**: [Data Security & Privacy](./data-security.md)
