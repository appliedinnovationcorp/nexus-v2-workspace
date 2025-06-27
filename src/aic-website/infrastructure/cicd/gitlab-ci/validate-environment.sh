#!/bin/bash

# GitLab CI Environment Validation Script
# This script validates that all required environment variables are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITLAB_PROJECT_ID="${GITLAB_PROJECT_ID:-}"
GITLAB_TOKEN="${GITLAB_TOKEN:-}"
GITLAB_URL="${GITLAB_URL:-https://gitlab.com}"

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

# Function to check if variable exists
check_variable() {
    local var_name=$1
    local environment_scope=${2:-"*"}
    local required=${3:-true}
    
    response=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                   "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables/$var_name?filter[environment_scope]=$environment_scope")
    
    if echo "$response" | grep -q "404"; then
        if [ "$required" = "true" ]; then
            print_status $RED "❌ Missing required variable: $var_name (scope: $environment_scope)"
            return 1
        else
            print_status $YELLOW "⚠️  Optional variable missing: $var_name (scope: $environment_scope)"
            return 0
        fi
    else
        # Check if variable is properly configured
        protected=$(echo "$response" | jq -r '.protected // false')
        masked=$(echo "$response" | jq -r '.masked // false')
        
        print_status $GREEN "✅ Found: $var_name (scope: $environment_scope)"
        
        # Validate security settings for sensitive variables
        case "$var_name" in
            *PASSWORD*|*TOKEN*|*SECRET*|*KEY*|SLACK_WEBHOOK_URL)
                if [ "$masked" != "true" ]; then
                    print_status $YELLOW "  ⚠️  Warning: Sensitive variable should be masked"
                fi
                if [ "$protected" != "true" ]; then
                    print_status $YELLOW "  ⚠️  Warning: Sensitive variable should be protected"
                fi
                ;;
        esac
        
        return 0
    fi
}

# Function to validate all required variables
validate_variables() {
    print_status $BLUE "\n📋 Validating GitLab CI variables..."
    
    local errors=0
    
    # Harbor Registry Variables
    print_status $BLUE "\n📦 Harbor Registry Variables:"
    check_variable "HARBOR_REGISTRY_URL" "*" true || ((errors++))
    check_variable "HARBOR_USERNAME" "*" true || ((errors++))
    check_variable "HARBOR_PASSWORD" "*" true || ((errors++))
    check_variable "HARBOR_PROJECT" "*" true || ((errors++))
    
    # Jenkins Integration Variables
    print_status $BLUE "\n🔧 Jenkins Integration Variables:"
    check_variable "JENKINS_BASE_URL" "*" true || ((errors++))
    check_variable "JENKINS_USER" "*" true || ((errors++))
    check_variable "JENKINS_TOKEN" "*" true || ((errors++))
    
    # Kubernetes Variables
    print_status $BLUE "\n☸️  Kubernetes Variables:"
    check_variable "DEV_KUBERNETES_CLUSTER" "develop" true || ((errors++))
    check_variable "STAGING_KUBERNETES_CLUSTER" "staging" true || ((errors++))
    check_variable "PROD_KUBERNETES_CLUSTER" "main" true || ((errors++))
    
    # AWS Variables
    print_status $BLUE "\n☁️  AWS Variables:"
    check_variable "AWS_REGION" "*" true || ((errors++))
    check_variable "AWS_ACCOUNT_ID" "*" true || ((errors++))
    check_variable "AWS_ROLE_DEV" "develop" true || ((errors++))
    check_variable "AWS_ROLE_STAGING" "staging" true || ((errors++))
    check_variable "AWS_ROLE_PROD" "main" true || ((errors++))
    
    # Notification Variables
    print_status $BLUE "\n📢 Notification Variables:"
    check_variable "SLACK_WEBHOOK_URL" "*" true || ((errors++))
    check_variable "SECURITY_EMAIL_LIST" "*" true || ((errors++))
    
    # Security Variables
    print_status $BLUE "\n🔒 Security Variables:"
    check_variable "TRIVY_SEVERITY_THRESHOLD" "*" true || ((errors++))
    check_variable "SECURITY_SCAN_ENABLED" "*" true || ((errors++))
    check_variable "SONAR_HOST_URL" "*" false || ((errors++))
    
    # Application Variables
    print_status $BLUE "\n🏗️  Application Variables:"
    check_variable "APP_NAME" "*" true || ((errors++))
    check_variable "APP_VERSION_PREFIX" "*" false
    check_variable "HELM_CHART_VERSION" "*" true || ((errors++))
    
    # Database Variables
    print_status $BLUE "\n🗄️  Database Variables:"
    check_variable "DB_HOST_DEV" "develop" true || ((errors++))
    check_variable "DB_HOST_STAGING" "staging" true || ((errors++))
    check_variable "DB_HOST_PROD" "main" true || ((errors++))
    
    # Monitoring Variables
    print_status $BLUE "\n📊 Monitoring Variables:"
    check_variable "PROMETHEUS_URL" "*" false
    check_variable "GRAFANA_URL" "*" false
    check_variable "ELASTICSEARCH_URL" "*" false
    
    # Feature Flags
    print_status $BLUE "\n🚩 Feature Flags:"
    check_variable "ENABLE_PERFORMANCE_TESTS" "*" false
    check_variable "ENABLE_E2E_TESTS" "*" false
    check_variable "ENABLE_SECURITY_SCANS" "*" false
    check_variable "ENABLE_DEPENDENCY_SCANS" "*" false
    
    return $errors
}

# Function to validate variable values
validate_variable_values() {
    print_status $BLUE "\n🔍 Validating variable values..."
    
    local errors=0
    
    # Get all variables
    all_vars=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                   "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables")
    
    # Check Harbor registry URL format
    harbor_url=$(echo "$all_vars" | jq -r '.[] | select(.key=="HARBOR_REGISTRY_URL") | .value')
    if [[ ! "$harbor_url" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        print_status $RED "❌ Invalid HARBOR_REGISTRY_URL format: $harbor_url"
        ((errors++))
    fi
    
    # Check Jenkins URL format
    jenkins_url=$(echo "$all_vars" | jq -r '.[] | select(.key=="JENKINS_BASE_URL") | .value')
    if [[ ! "$jenkins_url" =~ ^https?:// ]]; then
        print_status $RED "❌ Invalid JENKINS_BASE_URL format: $jenkins_url"
        ((errors++))
    fi
    
    # Check AWS region format
    aws_region=$(echo "$all_vars" | jq -r '.[] | select(.key=="AWS_REGION") | .value')
    if [[ ! "$aws_region" =~ ^[a-z]{2}-[a-z]+-[0-9]$ ]]; then
        print_status $RED "❌ Invalid AWS_REGION format: $aws_region"
        ((errors++))
    fi
    
    # Check AWS Account ID format
    aws_account_id=$(echo "$all_vars" | jq -r '.[] | select(.key=="AWS_ACCOUNT_ID") | .value')
    if [[ ! "$aws_account_id" =~ ^[0-9]{12}$ ]]; then
        print_status $RED "❌ Invalid AWS_ACCOUNT_ID format: $aws_account_id"
        ((errors++))
    fi
    
    # Check Slack webhook URL format
    slack_webhook=$(echo "$all_vars" | jq -r '.[] | select(.key=="SLACK_WEBHOOK_URL") | .value')
    if [[ ! "$slack_webhook" =~ ^https://hooks\.slack\.com/services/ ]]; then
        print_status $RED "❌ Invalid SLACK_WEBHOOK_URL format"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        print_status $GREEN "✅ All variable values are valid"
    fi
    
    return $errors
}

# Function to test connectivity
test_connectivity() {
    print_status $BLUE "\n🌐 Testing connectivity to external services..."
    
    local errors=0
    
    # Get variables for testing
    all_vars=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                   "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables")
    
    # Test Harbor registry
    harbor_url=$(echo "$all_vars" | jq -r '.[] | select(.key=="HARBOR_REGISTRY_URL") | .value')
    if [ "$harbor_url" != "null" ] && [ -n "$harbor_url" ]; then
        if curl -s --connect-timeout 5 "https://$harbor_url" > /dev/null; then
            print_status $GREEN "✅ Harbor registry accessible: $harbor_url"
        else
            print_status $RED "❌ Cannot reach Harbor registry: $harbor_url"
            ((errors++))
        fi
    fi
    
    # Test Jenkins
    jenkins_url=$(echo "$all_vars" | jq -r '.[] | select(.key=="JENKINS_BASE_URL") | .value')
    if [ "$jenkins_url" != "null" ] && [ -n "$jenkins_url" ]; then
        if curl -s --connect-timeout 5 "$jenkins_url" > /dev/null; then
            print_status $GREEN "✅ Jenkins accessible: $jenkins_url"
        else
            print_status $RED "❌ Cannot reach Jenkins: $jenkins_url"
            ((errors++))
        fi
    fi
    
    # Test SonarQube
    sonar_url=$(echo "$all_vars" | jq -r '.[] | select(.key=="SONAR_HOST_URL") | .value')
    if [ "$sonar_url" != "null" ] && [ -n "$sonar_url" ]; then
        if curl -s --connect-timeout 5 "$sonar_url" > /dev/null; then
            print_status $GREEN "✅ SonarQube accessible: $sonar_url"
        else
            print_status $YELLOW "⚠️  Cannot reach SonarQube: $sonar_url"
        fi
    fi
    
    return $errors
}

# Function to generate summary report
generate_summary() {
    local total_errors=$1
    
    print_status $BLUE "\n📊 Validation Summary:"
    echo "=================================="
    
    if [ $total_errors -eq 0 ]; then
        print_status $GREEN "🎉 All validations passed successfully!"
        print_status $GREEN "✅ Your GitLab CI environment is properly configured"
        echo ""
        print_status $BLUE "Next steps:"
        echo "1. Test your pipeline with a small change"
        echo "2. Monitor the first few deployments"
        echo "3. Set up monitoring dashboards"
        echo "4. Configure backup procedures"
    else
        print_status $RED "❌ Found $total_errors validation errors"
        print_status $YELLOW "Please fix the errors above before running your CI/CD pipeline"
        echo ""
        print_status $BLUE "To fix errors:"
        echo "1. Run the configuration script: ./configure-variables.sh"
        echo "2. Manually add missing variables in GitLab UI"
        echo "3. Re-run this validation script"
    fi
    
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "GitLab CI Environment Validation Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -q, --quick             Quick validation (skip connectivity tests)"
    echo "  -v, --verbose           Verbose output with detailed information"
    echo ""
    echo "Environment Variables:"
    echo "  GITLAB_PROJECT_ID       GitLab project ID (required)"
    echo "  GITLAB_TOKEN           GitLab personal access token (required)"
    echo "  GITLAB_URL             GitLab instance URL (default: https://gitlab.com)"
    echo ""
    echo "Example:"
    echo "  export GITLAB_PROJECT_ID=12345"
    echo "  export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx"
    echo "  $0"
}

# Main validation function
main() {
    local quick_mode=false
    local verbose_mode=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -q|--quick)
                quick_mode=true
                shift
                ;;
            -v|--verbose)
                verbose_mode=true
                shift
                ;;
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting GitLab CI environment validation..."
    
    # Validate prerequisites
    validate_prerequisites
    
    # Validate variables
    validate_variables
    local var_errors=$?
    
    # Validate variable values
    validate_variable_values
    local value_errors=$?
    
    # Test connectivity (unless in quick mode)
    local connectivity_errors=0
    if [ "$quick_mode" = false ]; then
        test_connectivity
        connectivity_errors=$?
    fi
    
    # Calculate total errors
    local total_errors=$((var_errors + value_errors + connectivity_errors))
    
    # Generate summary
    generate_summary $total_errors
    
    # Exit with appropriate code
    exit $total_errors
}

# Check for required tools
if ! command -v curl &> /dev/null; then
    print_status $RED "❌ curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_status $RED "❌ jq is required but not installed"
    echo "   Install with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    exit 1
fi

# Run main function
main "$@"
