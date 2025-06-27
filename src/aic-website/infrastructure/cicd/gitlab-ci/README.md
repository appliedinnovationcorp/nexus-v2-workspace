# GitLab CI Environment Configuration

This directory contains all the necessary configuration files and scripts to set up GitLab CI environment variables for the AIC Website project.

## 📁 Files Overview

- **`.gitlab-ci.yml`** - Main GitLab CI pipeline configuration
- **`environment-variables.md`** - Detailed documentation of all required variables
- **`configure-variables.sh`** - Automated script to configure all environment variables
- **`validate-environment.sh`** - Script to validate environment configuration
- **`environment-config.yaml`** - Environment-specific configuration settings
- **`README.md`** - This documentation file

## 🚀 Quick Start

### 1. Prerequisites

Before configuring environment variables, ensure you have:

- GitLab project with appropriate permissions
- Personal access token with `api` scope
- `curl` and `jq` installed on your system

```bash
# Install jq if not available
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# CentOS/RHEL
sudo yum install jq
```

### 2. Set Up GitLab Access

```bash
# Export your GitLab project ID and token
export GITLAB_PROJECT_ID=12345  # Replace with your project ID
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx  # Replace with your token
export GITLAB_URL=https://gitlab.com  # Optional: use custom GitLab instance
```

### 3. Configure Environment Variables

Run the automated configuration script:

```bash
# Make scripts executable
chmod +x configure-variables.sh validate-environment.sh

# Configure all variables (interactive)
./configure-variables.sh

# Or configure with pre-set environment variables
HARBOR_USERNAME=gitlab-ci \
HARBOR_PASSWORD=your-password \
JENKINS_USER=gitlab-integration \
JENKINS_TOKEN=your-jenkins-token \
SLACK_WEBHOOK_URL=your-webhook-url \
AWS_ACCOUNT_ID=123456789012 \
./configure-variables.sh
```

### 4. Validate Configuration

```bash
# Full validation (includes connectivity tests)
./validate-environment.sh

# Quick validation (skip connectivity tests)
./validate-environment.sh --quick

# Verbose output
./validate-environment.sh --verbose
```

## 📋 Required Environment Variables

### Core Variables

| Variable | Description | Protected | Masked | Scope |
|----------|-------------|-----------|--------|-------|
| `HARBOR_REGISTRY_URL` | Harbor registry URL | ✅ | ❌ | All |
| `HARBOR_USERNAME` | Harbor registry username | ✅ | ✅ | All |
| `HARBOR_PASSWORD` | Harbor registry password | ✅ | ✅ | All |
| `HARBOR_PROJECT` | Harbor project name | ✅ | ❌ | All |
| `JENKINS_BASE_URL` | Jenkins server URL | ✅ | ❌ | All |
| `JENKINS_USER` | Jenkins username | ✅ | ✅ | All |
| `JENKINS_TOKEN` | Jenkins API token | ✅ | ✅ | All |
| `AWS_REGION` | AWS region | ❌ | ❌ | All |
| `AWS_ACCOUNT_ID` | AWS account ID | ✅ | ❌ | All |

### Environment-Specific Variables

| Variable | Environment | Description |
|----------|-------------|-------------|
| `DEV_KUBERNETES_CLUSTER` | develop | Development cluster name |
| `STAGING_KUBERNETES_CLUSTER` | staging | Staging cluster name |
| `PROD_KUBERNETES_CLUSTER` | main | Production cluster name |
| `AWS_ROLE_DEV` | develop | AWS role for dev deployments |
| `AWS_ROLE_STAGING` | staging | AWS role for staging deployments |
| `AWS_ROLE_PROD` | main | AWS role for prod deployments |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_PERFORMANCE_TESTS` | Enable performance testing | `true` |
| `ENABLE_E2E_TESTS` | Enable end-to-end testing | `true` |
| `ENABLE_SECURITY_SCANS` | Enable security scanning | `true` |
| `TRIVY_SEVERITY_THRESHOLD` | Vulnerability severity threshold | `HIGH,CRITICAL` |

## 🔧 Manual Configuration

If you prefer to configure variables manually through the GitLab UI:

1. Navigate to your GitLab project
2. Go to **Settings > CI/CD**
3. Expand the **Variables** section
4. Click **Add variable** for each required variable
5. Configure the appropriate flags (Protected/Masked)
6. Set the correct environment scope

## 🏗️ Environment Configuration

The `environment-config.yaml` file defines environment-specific settings:

```yaml
environments:
  development:
    branch: develop
    kubernetes:
      cluster: aic-dev-cluster
      namespace: aic-website-dev
    resources:
      replicas: 1
      cpu_limit: "500m"
      memory_limit: "512Mi"
  
  staging:
    branch: staging
    kubernetes:
      cluster: aic-staging-cluster
      namespace: aic-website-staging
    resources:
      replicas: 2
      cpu_limit: "1000m"
      memory_limit: "1Gi"
  
  production:
    branch: main
    kubernetes:
      cluster: aic-prod-cluster
      namespace: aic-website-prod
    resources:
      replicas: 3
      cpu_limit: "2000m"
      memory_limit: "2Gi"
```

## 🔒 Security Best Practices

### Variable Security

1. **Protected Variables**: Use for production and sensitive environments
2. **Masked Variables**: Use for passwords, tokens, and API keys
3. **Environment Scopes**: Limit variable availability to specific branches
4. **Regular Rotation**: Rotate secrets and tokens regularly

### Access Control

```bash
# Example: Restrict production variables to main branch only
Variable: PROD_KUBERNETES_CLUSTER
Environment Scope: main
Protected: Yes
Masked: No
```

### Sensitive Data Handling

- Never commit secrets to the repository
- Use GitLab's built-in secret management
- Implement proper secret rotation policies
- Monitor variable usage in pipeline logs

## 🧪 Testing Your Configuration

### 1. Validate Variables

```bash
# Check all required variables exist
./validate-environment.sh

# Expected output:
# ✅ All required variables are configured!
```

### 2. Test Pipeline

Create a simple test pipeline to verify configuration:

```yaml
# .gitlab-ci-test.yml
test:variables:
  stage: test
  script:
    - echo "Harbor Registry: $HARBOR_REGISTRY_URL"
    - echo "Jenkins URL: $JENKINS_BASE_URL"
    - echo "AWS Region: $AWS_REGION"
    - echo "Kubernetes Cluster: $DEV_KUBERNETES_CLUSTER"
  only:
    - develop
```

### 3. Connectivity Tests

```bash
# Test external service connectivity
./validate-environment.sh --verbose

# This will test:
# - Harbor registry accessibility
# - Jenkins server connectivity
# - SonarQube availability (if configured)
```

## 🚨 Troubleshooting

### Common Issues

#### Variable Not Available in Pipeline

**Problem**: Variable shows as empty in pipeline logs

**Solutions**:
- Check if variable is protected and branch is protected
- Verify environment scope matches pipeline context
- Ensure variable name matches exactly (case-sensitive)

#### Masked Variable Showing in Logs

**Problem**: Sensitive data appears in pipeline logs

**Solutions**:
- Verify variable is marked as "Masked"
- Check that variable value meets masking requirements
- Ensure no spaces or special characters in sensitive values

#### Authentication Errors

**Problem**: Pipeline fails with authentication errors

**Solutions**:
- Verify Harbor credentials are correct
- Check Jenkins token has proper permissions
- Ensure AWS roles have necessary policies
- Test Slack webhook URL manually

### Debug Commands

Add these to your pipeline for debugging:

```yaml
debug:variables:
  stage: validate
  script:
    - echo "=== Environment Variables ==="
    - env | grep -E "(HARBOR|JENKINS|AWS|SLACK)" | sed 's/=.*/=***/'
    - echo "=== GitLab CI Variables ==="
    - echo "CI_COMMIT_REF_NAME: $CI_COMMIT_REF_NAME"
    - echo "CI_ENVIRONMENT_NAME: $CI_ENVIRONMENT_NAME"
    - echo "CI_PROJECT_NAME: $CI_PROJECT_NAME"
  only:
    - develop
```

### Getting Help

1. **Check Logs**: Review pipeline logs for specific error messages
2. **Validate Configuration**: Run `./validate-environment.sh --verbose`
3. **Test Connectivity**: Verify external services are accessible
4. **Review Documentation**: Check `environment-variables.md` for details

## 📚 Additional Resources

- [GitLab CI/CD Variables Documentation](https://docs.gitlab.com/ee/ci/variables/)
- [Harbor Registry Documentation](https://goharbor.io/docs/)
- [Jenkins API Documentation](https://www.jenkins.io/doc/book/using/remote-access-api/)
- [AWS IAM Roles for GitLab CI](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)

## 🔄 Maintenance

### Regular Tasks

1. **Monthly**: Rotate sensitive tokens and passwords
2. **Quarterly**: Review and update environment configurations
3. **Annually**: Audit variable usage and permissions

### Monitoring

- Set up alerts for pipeline failures
- Monitor variable usage in logs
- Track deployment success rates
- Review security scan results

---

**Next Steps**: After configuring environment variables, proceed to set up the complete CI/CD pipeline by reviewing the main `.gitlab-ci.yml` file.
