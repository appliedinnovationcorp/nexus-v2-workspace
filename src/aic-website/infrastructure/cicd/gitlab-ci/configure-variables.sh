#!/bin/bash

# GitLab CI Variables Configuration Script for AIC Website
# This script configures all required environment variables for the CI/CD pipeline

set -e

# Configuration
GITLAB_PROJECT_ID="${GITLAB_PROJECT_ID:-}"
GITLAB_TOKEN="${GITLAB_TOKEN:-}"
GITLAB_URL="${GITLAB_URL:-https://gitlab.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to validate prerequisites
validate_prerequisites() {
    print_status $BLUE "🔍 Validating prerequisites..."
    
    if [ -z "$GITLAB_PROJECT_ID" ]; then
        print_status $RED "❌ GITLAB_PROJECT_ID environment variable is required"
        echo "   Export your GitLab project ID: export GITLAB_PROJECT_ID=12345"
        exit 1
    fi
    
    if [ -z "$GITLAB_TOKEN" ]; then
        print_status $RED "❌ GITLAB_TOKEN environment variable is required"
        echo "   Create a personal access token with 'api' scope and export it:"
        echo "   export GITLAB_TOKEN=your-token-here"
        exit 1
    fi
    
    # Test GitLab API connectivity
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID")
    
    if [ "$response" != "200" ]; then
        print_status $RED "❌ Cannot access GitLab project. Check your token and project ID."
        exit 1
    fi
    
    print_status $GREEN "✅ Prerequisites validated"
}

# Function to create GitLab CI variable
create_variable() {
    local key=$1
    local value=$2
    local protected=${3:-true}
    local masked=${4:-false}
    local environment_scope=${5:-"*"}
    local description=${6:-""}
    
    print_status $BLUE "📝 Creating variable: $key (scope: $environment_scope)"
    
    response=$(curl -s -w "%{http_code}" \
         --request POST \
         --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
         --header "Content-Type: application/json" \
         --data "{
             \"key\": \"$key\",
             \"value\": \"$value\",
             \"protected\": $protected,
             \"masked\": $masked,
             \"environment_scope\": \"$environment_scope\",
             \"description\": \"$description\"
         }" \
         "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables" \
         -o /tmp/gitlab_response.json)
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "201" ]; then
        print_status $GREEN "  ✅ Created successfully"
    elif [ "$http_code" = "400" ]; then
        # Variable might already exist, try to update it
        update_variable "$key" "$value" "$protected" "$masked" "$environment_scope" "$description"
    else
        print_status $RED "  ❌ Failed to create (HTTP $http_code)"
        cat /tmp/gitlab_response.json
    fi
}

# Function to update existing GitLab CI variable
update_variable() {
    local key=$1
    local value=$2
    local protected=${3:-true}
    local masked=${4:-false}
    local environment_scope=${5:-"*"}
    local description=${6:-""}
    
    print_status $YELLOW "  🔄 Variable exists, updating..."
    
    response=$(curl -s -w "%{http_code}" \
         --request PUT \
         --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
         --header "Content-Type: application/json" \
         --data "{
             \"value\": \"$value\",
             \"protected\": $protected,
             \"masked\": $masked,
             \"environment_scope\": \"$environment_scope\",
             \"description\": \"$description\"
         }" \
         "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables/$key" \
         -o /tmp/gitlab_response.json)
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        print_status $GREEN "  ✅ Updated successfully"
    else
        print_status $RED "  ❌ Failed to update (HTTP $http_code)"
        cat /tmp/gitlab_response.json
    fi
}

# Function to prompt for sensitive values
prompt_for_value() {
    local var_name=$1
    local description=$2
    local is_secret=${3:-false}
    
    echo ""
    print_status $YELLOW "🔐 Please provide value for: $var_name"
    echo "   Description: $description"
    
    if [ "$is_secret" = "true" ]; then
        echo -n "   Value (hidden): "
        read -s value
        echo ""
    else
        echo -n "   Value: "
        read value
    fi
    
    echo "$value"
}

# Main configuration function
configure_variables() {
    print_status $BLUE "🚀 Starting GitLab CI variables configuration for AIC Website..."
    
    # Harbor Registry Configuration
    print_status $BLUE "\n📦 Configuring Harbor Registry variables..."
    
    HARBOR_REGISTRY_URL="${HARBOR_REGISTRY_URL:-harbor.aicorp.com}"
    HARBOR_USERNAME="${HARBOR_USERNAME:-$(prompt_for_value "HARBOR_USERNAME" "Harbor registry username for GitLab CI")}"
    HARBOR_PASSWORD="${HARBOR_PASSWORD:-$(prompt_for_value "HARBOR_PASSWORD" "Harbor registry password" true)}"
    HARBOR_PROJECT="${HARBOR_PROJECT:-aic-website}"
    
    create_variable "HARBOR_REGISTRY_URL" "$HARBOR_REGISTRY_URL" true false "*" "Harbor registry URL"
    create_variable "HARBOR_USERNAME" "$HARBOR_USERNAME" true true "*" "Harbor registry username for GitLab CI"
    create_variable "HARBOR_PASSWORD" "$HARBOR_PASSWORD" true true "*" "Harbor registry password for GitLab CI"
    create_variable "HARBOR_PROJECT" "$HARBOR_PROJECT" true false "*" "Harbor project name"
    
    # Jenkins Integration
    print_status $BLUE "\n🔧 Configuring Jenkins integration variables..."
    
    JENKINS_BASE_URL="${JENKINS_BASE_URL:-https://jenkins.aicorp.com}"
    JENKINS_USER="${JENKINS_USER:-$(prompt_for_value "JENKINS_USER" "Jenkins user for GitLab integration")}"
    JENKINS_TOKEN="${JENKINS_TOKEN:-$(prompt_for_value "JENKINS_TOKEN" "Jenkins API token" true)}"
    
    create_variable "JENKINS_BASE_URL" "$JENKINS_BASE_URL" true false "*" "Jenkins server base URL"
    create_variable "JENKINS_USER" "$JENKINS_USER" true true "*" "Jenkins user for GitLab integration"
    create_variable "JENKINS_TOKEN" "$JENKINS_TOKEN" true true "*" "Jenkins API token for GitLab integration"
    
    # Kubernetes Configuration
    print_status $BLUE "\n☸️  Configuring Kubernetes variables..."
    
    create_variable "DEV_KUBERNETES_CLUSTER" "aic-dev-cluster" false false "develop" "Development Kubernetes cluster name"
    create_variable "STAGING_KUBERNETES_CLUSTER" "aic-staging-cluster" true false "staging" "Staging Kubernetes cluster name"
    create_variable "PROD_KUBERNETES_CLUSTER" "aic-prod-cluster" true false "main" "Production Kubernetes cluster name"
    
    # Notification Configuration
    print_status $BLUE "\n📢 Configuring notification variables..."
    
    SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-$(prompt_for_value "SLACK_WEBHOOK_URL" "Slack webhook for pipeline notifications" true)}"
    SECURITY_EMAIL_LIST="${SECURITY_EMAIL_LIST:-security@aicorp.com,devops@aicorp.com}"
    
    create_variable "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL" true true "*" "Slack webhook for pipeline notifications"
    create_variable "SECURITY_EMAIL_LIST" "$SECURITY_EMAIL_LIST" true false "*" "Email list for security notifications"
    
    # Security Scanning Configuration
    print_status $BLUE "\n🔒 Configuring security scanning variables..."
    
    create_variable "TRIVY_SEVERITY_THRESHOLD" "HIGH,CRITICAL" false false "*" "Trivy vulnerability severity threshold"
    create_variable "SECURITY_SCAN_ENABLED" "true" false false "*" "Enable/disable security scanning"
    create_variable "SONAR_HOST_URL" "https://sonarqube.aicorp.com" true false "*" "SonarQube server URL"
    
    # AWS Configuration (if using AWS services)
    print_status $BLUE "\n☁️  Configuring AWS variables..."
    
    AWS_REGION="${AWS_REGION:-us-west-2}"
    AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(prompt_for_value "AWS_ACCOUNT_ID" "AWS Account ID for ECR/EKS")}"
    
    create_variable "AWS_REGION" "$AWS_REGION" false false "*" "AWS region for resources"
    create_variable "AWS_ACCOUNT_ID" "$AWS_ACCOUNT_ID" true false "*" "AWS Account ID"
    
    # Environment-specific AWS roles
    create_variable "AWS_ROLE_DEV" "arn:aws:iam::$AWS_ACCOUNT_ID:role/GitLabCI-Dev" true false "develop" "AWS role for development deployments"
    create_variable "AWS_ROLE_STAGING" "arn:aws:iam::$AWS_ACCOUNT_ID:role/GitLabCI-Staging" true false "staging" "AWS role for staging deployments"
    create_variable "AWS_ROLE_PROD" "arn:aws:iam::$AWS_ACCOUNT_ID:role/GitLabCI-Prod" true false "main" "AWS role for production deployments"
    
    # Application Configuration
    print_status $BLUE "\n🏗️  Configuring application variables..."
    
    create_variable "APP_NAME" "aic-website" false false "*" "Application name"
    create_variable "APP_VERSION_PREFIX" "v" false false "*" "Version prefix for tagging"
    create_variable "HELM_CHART_VERSION" "1.0.0" false false "*" "Helm chart version"
    
    # Database Configuration
    print_status $BLUE "\n🗄️  Configuring database variables..."
    
    create_variable "DB_HOST_DEV" "postgres-dev.aicorp.com" false false "develop" "Development database host"
    create_variable "DB_HOST_STAGING" "postgres-staging.aicorp.com" true false "staging" "Staging database host"
    create_variable "DB_HOST_PROD" "postgres-prod.aicorp.com" true false "main" "Production database host"
    
    # Monitoring and Observability
    print_status $BLUE "\n📊 Configuring monitoring variables..."
    
    create_variable "PROMETHEUS_URL" "https://prometheus.aicorp.com" true false "*" "Prometheus server URL"
    create_variable "GRAFANA_URL" "https://grafana.aicorp.com" true false "*" "Grafana dashboard URL"
    create_variable "ELASTICSEARCH_URL" "https://elasticsearch.aicorp.com" true false "*" "Elasticsearch cluster URL"
    
    # Feature Flags
    print_status $BLUE "\n🚩 Configuring feature flags..."
    
    create_variable "ENABLE_PERFORMANCE_TESTS" "true" false false "*" "Enable performance testing in pipeline"
    create_variable "ENABLE_E2E_TESTS" "true" false false "*" "Enable end-to-end testing"
    create_variable "ENABLE_SECURITY_SCANS" "true" false false "*" "Enable security scanning"
    create_variable "ENABLE_DEPENDENCY_SCANS" "true" false false "*" "Enable dependency vulnerability scanning"
    
    print_status $GREEN "\n🎉 GitLab CI variables configuration completed successfully!"
}

# Function to validate configuration
validate_configuration() {
    print_status $BLUE "\n🔍 Validating configuration..."
    
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
        "AWS_ACCOUNT_ID"
        "AWS_REGION"
    )
    
    missing_vars=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        response=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                       "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables/$var")
        
        if echo "$response" | grep -q "404"; then
            missing_vars+=("$var")
            print_status $RED "❌ Missing: $var"
        else
            print_status $GREEN "✅ Found: $var"
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_status $GREEN "\n✅ All required variables are configured!"
        return 0
    else
        print_status $RED "\n❌ Missing variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "GitLab CI Variables Configuration Script for AIC Website"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -v, --validate          Only validate existing configuration"
    echo "  -c, --configure         Configure all variables (default)"
    echo ""
    echo "Environment Variables:"
    echo "  GITLAB_PROJECT_ID       GitLab project ID (required)"
    echo "  GITLAB_TOKEN           GitLab personal access token (required)"
    echo "  GITLAB_URL             GitLab instance URL (default: https://gitlab.com)"
    echo ""
    echo "Example:"
    echo "  export GITLAB_PROJECT_ID=12345"
    echo "  export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx"
    echo "  $0 --configure"
}

# Main script logic
main() {
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--validate)
            validate_prerequisites
            validate_configuration
            ;;
        -c|--configure|"")
            validate_prerequisites
            configure_variables
            validate_configuration
            ;;
        *)
            print_status $RED "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Cleanup function
cleanup() {
    rm -f /tmp/gitlab_response.json
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"
