# GitLab CI Environment Variables Configuration

## Overview

This document provides the complete list of environment variables that need to be configured in GitLab for the AIC Website CI/CD pipeline to function properly.

## Required Environment Variables

### Harbor Registry Configuration

Navigate to **Project Settings > CI/CD > Variables** and add the following variables:

#### Harbor Registry Access
```
Variable Name: HARBOR_REGISTRY_URL
Value: harbor.aicorp.com
Type: Variable
Protected: Yes
Masked: No
Environment Scope: All
Description: Harbor registry URL
```

```
Variable Name: HARBOR_USERNAME
Value: gitlab-ci
Type: Variable
Protected: Yes
Masked: Yes
Environment Scope: All
Description: Harbor registry username for GitLab CI
```

```
Variable Name: HARBOR_PASSWORD
Value: <harbor-password>
Type: Variable
Protected: Yes
Masked: Yes
Environment Scope: All
Description: Harbor registry password for GitLab CI
```

```
Variable Name: HARBOR_PROJECT
Value: aic-website
Type: Variable
Protected: Yes
Masked: No
Environment Scope: All
Description: Harbor project name
```

### Jenkins Integration
```
Variable Name: JENKINS_BASE_URL
Value: https://jenkins.aicorp.com
Type: Variable
Protected: Yes
Masked: No
Environment Scope: All
Description: Jenkins server base URL
```

```
Variable Name: JENKINS_USER
Value: gitlab-integration
Type: Variable
Protected: Yes
Masked: Yes
Environment Scope: All
Description: Jenkins user for GitLab integration
```

```
Variable Name: JENKINS_TOKEN
Value: <jenkins-api-token>
Type: Variable
Protected: Yes
Masked: Yes
Environment Scope: All
Description: Jenkins API token for GitLab integration
```

### Notification Configuration
```
Variable Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
Type: Variable
Protected: Yes
Masked: Yes
Environment Scope: All
Description: Slack webhook for pipeline notifications
```

```
Variable Name: SECURITY_EMAIL_LIST
Value: security@aicorp.com,devops@aicorp.com
Type: Variable
Protected: Yes
Masked: No
Environment Scope: All
Description: Email list for security notifications
```

### Security Scanning Configuration
```
Variable Name: TRIVY_SEVERITY_THRESHOLD
Value: HIGH,CRITICAL
Type: Variable
Protected: No
Masked: No
Environment Scope: All
Description: Trivy vulnerability severity threshold
```

```
Variable Name: SECURITY_SCAN_ENABLED
Value: true
Type: Variable
Protected: No
Masked: No
Environment Scope: All
Description: Enable/disable security scanning
```

### Environment-Specific Variables

#### Development Environment
```
Variable Name: DEV_KUBERNETES_CLUSTER
Value: aic-dev-cluster
Type: Variable
Protected: No
Masked: No
Environment Scope: develop
Description: Development Kubernetes cluster name
```

#### Staging Environment
```
Variable Name: STAGING_KUBERNETES_CLUSTER
Value: aic-staging-cluster
Type: Variable
Protected: Yes
Masked: No
Environment Scope: staging
Description: Staging Kubernetes cluster name
```

#### Production Environment
```
Variable Name: PROD_KUBERNETES_CLUSTER
Value: aic-prod-cluster
Type: Variable
Protected: Yes
Masked: No
Environment Scope: main
Description: Production Kubernetes cluster name
```

## GitLab CI Configuration Script

Use this script to configure all variables programmatically:

```bash
#!/bin/bash

# GitLab CI Variables Configuration Script
# Run this script to configure all required environment variables

GITLAB_PROJECT_ID="your-project-id"
GITLAB_TOKEN="your-gitlab-token"
GITLAB_URL="https://gitlab.example.com"

# Function to create GitLab CI variable
create_variable() {
    local key=$1
    local value=$2
    local protected=${3:-true}
    local masked=${4:-false}
    local environment_scope=${5:-"*"}
    
    curl --request POST \
         --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
         --header "Content-Type: application/json" \
         --data "{
             \"key\": \"$key\",
             \"value\": \"$value\",
             \"protected\": $protected,
             \"masked\": $masked,
             \"environment_scope\": \"$environment_scope\"
         }" \
         "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables"
}

echo "Configuring GitLab CI variables for AIC Website project..."

# Harbor Registry Variables
create_variable "HARBOR_REGISTRY_URL" "harbor.aicorp.com" true false "*"
create_variable "HARBOR_USERNAME" "gitlab-ci" true true "*"
create_variable "HARBOR_PASSWORD" "REPLACE_WITH_ACTUAL_PASSWORD" true true "*"
create_variable "HARBOR_PROJECT" "aic-website" true false "*"

# Jenkins Integration Variables
create_variable "JENKINS_BASE_URL" "https://jenkins.aicorp.com" true false "*"
create_variable "JENKINS_USER" "gitlab-integration" true true "*"
create_variable "JENKINS_TOKEN" "REPLACE_WITH_ACTUAL_TOKEN" true true "*"

# Notification Variables
create_variable "SLACK_WEBHOOK_URL" "REPLACE_WITH_ACTUAL_WEBHOOK" true true "*"
create_variable "SECURITY_EMAIL_LIST" "security@aicorp.com,devops@aicorp.com" true false "*"

# Security Configuration
create_variable "TRIVY_SEVERITY_THRESHOLD" "HIGH,CRITICAL" false false "*"
create_variable "SECURITY_SCAN_ENABLED" "true" false false "*"

# Environment-specific variables
create_variable "DEV_KUBERNETES_CLUSTER" "aic-dev-cluster" false false "develop"
create_variable "STAGING_KUBERNETES_CLUSTER" "aic-staging-cluster" true false "staging"
create_variable "PROD_KUBERNETES_CLUSTER" "aic-prod-cluster" true false "main"

echo "GitLab CI variables configuration completed!"
echo "Please update the placeholder values with actual credentials."
```

## Variable Security Best Practices

### Protected Variables
- Use **Protected** variables for sensitive information
- Protected variables are only available to protected branches/tags
- Enable for production and staging environments

### Masked Variables
- Use **Masked** variables for secrets and tokens
- Masked variables are hidden in job logs
- Enable for passwords, tokens, and API keys

### Environment Scopes
- Use specific environment scopes to limit variable availability
- `main` - Production environment
- `staging` - Staging environment  
- `develop` - Development environment
- `*` - All environments

## Validation Script

Use this script to validate that all required variables are configured:

```bash
#!/bin/bash

# GitLab CI Variables Validation Script

GITLAB_PROJECT_ID="your-project-id"
GITLAB_TOKEN="your-gitlab-token"
GITLAB_URL="https://gitlab.example.com"

# Required variables
REQUIRED_VARS=(
    "HARBOR_REGISTRY_URL"
    "HARBOR_USERNAME"
    "HARBOR_PASSWORD"
    "HARBOR_PROJECT"
    "JENKINS_BASE_URL"
    "JENKINS_USER"
    "JENKINS_TOKEN"
    "SLACK_WEBHOOK_URL"
    "SECURITY_EMAIL_LIST"
    "TRIVY_SEVERITY_THRESHOLD"
    "SECURITY_SCAN_ENABLED"
)

echo "Validating GitLab CI variables..."

missing_vars=()

for var in "${REQUIRED_VARS[@]}"; do
    response=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                   "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables/$var")
    
    if echo "$response" | grep -q "404"; then
        missing_vars+=("$var")
        echo "❌ Missing: $var"
    else
        echo "✅ Found: $var"
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo ""
    echo "✅ All required variables are configured!"
else
    echo ""
    echo "❌ Missing variables: ${missing_vars[*]}"
    echo "Please configure the missing variables before running the pipeline."
    exit 1
fi
```

## Manual Configuration Steps

### 1. Access GitLab Project Settings
1. Navigate to your GitLab project
2. Go to **Settings > CI/CD**
3. Expand the **Variables** section

### 2. Add Each Variable
For each variable listed above:
1. Click **Add variable**
2. Enter the **Key** (variable name)
3. Enter the **Value**
4. Set **Type** to "Variable"
5. Configure **Flags**:
   - Check **Protected** for sensitive variables
   - Check **Masked** for secrets
6. Set **Environment scope** as specified
7. Click **Add variable**

### 3. Verify Configuration
1. Check that all variables are listed
2. Verify protected/masked flags are correct
3. Confirm environment scopes are properly set

## Troubleshooting

### Common Issues

#### Variable Not Available in Pipeline
- Check if variable is protected and branch is protected
- Verify environment scope matches pipeline context
- Ensure variable name matches exactly (case-sensitive)

#### Masked Variable Showing in Logs
- Verify variable is marked as "Masked"
- Check that variable value meets masking requirements
- Ensure no spaces or special characters in sensitive values

#### Pipeline Fails with Authentication Error
- Verify Harbor credentials are correct
- Check Jenkins token has proper permissions
- Ensure Slack webhook URL is valid

### Debug Commands

Add these to your pipeline for debugging:

```yaml
debug:variables:
  stage: validate
  script:
    - echo "Available variables:"
    - env | grep -E "(HARBOR|JENKINS|SLACK)" | sed 's/=.*/=***/'
    - echo "Harbor Registry: $HARBOR_REGISTRY_URL"
    - echo "Jenkins URL: $JENKINS_BASE_URL"
  only:
    - develop
```

## Security Considerations

1. **Never commit secrets** to the repository
2. **Use masked variables** for all sensitive data
3. **Limit variable scope** to required environments
4. **Regularly rotate** API tokens and passwords
5. **Monitor variable usage** in pipeline logs
6. **Use protected variables** for production environments

---

**Next Step**: [Create OPA Policies](./opa-policies.md)
