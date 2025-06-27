#!/bin/bash

# Harbor GitLab Integration Configuration Script
# This script configures Harbor registry integration with GitLab CI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HARBOR_URL="${HARBOR_URL:-https://harbor.aicorp.com}"
HARBOR_ADMIN_USER="${HARBOR_ADMIN_USER:-admin}"
HARBOR_ADMIN_PASSWORD="${HARBOR_ADMIN_PASSWORD:-Harbor12345}"
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
        exit 1
    fi
    
    if [ -z "$GITLAB_TOKEN" ]; then
        print_status $RED "❌ GITLAB_TOKEN environment variable is required"
        exit 1
    fi
    
    # Check if Harbor is accessible
    if ! curl -k -s "$HARBOR_URL/api/v2.0/systeminfo" > /dev/null; then
        print_status $RED "❌ Cannot access Harbor at $HARBOR_URL"
        exit 1
    fi
    
    # Check if GitLab is accessible
    if ! curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID" > /dev/null; then
        print_status $RED "❌ Cannot access GitLab project"
        exit 1
    fi
    
    print_status $GREEN "✅ Prerequisites validated"
}

# Function to create Harbor projects
create_harbor_projects() {
    print_status $BLUE "🏗️  Creating Harbor projects..."
    
    # Create aic-website project
    local project_response=$(curl -k -s -w "%{http_code}" \
        -X POST "$HARBOR_URL/api/v2.0/projects" \
        -H "Content-Type: application/json" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD" \
        -d '{
            "project_name": "aic-website",
            "metadata": {
                "public": "false",
                "enable_content_trust": "true",
                "prevent_vul": "true",
                "severity": "high",
                "auto_scan": "true",
                "reuse_sys_cve_allowlist": "true"
            },
            "storage_limit": 107374182400
        }' -o /tmp/project_response.json)
    
    local http_code="${project_response: -3}"
    
    if [ "$http_code" = "201" ]; then
        print_status $GREEN "✅ Project 'aic-website' created successfully"
    elif [ "$http_code" = "409" ]; then
        print_status $YELLOW "⚠️  Project 'aic-website' already exists"
    else
        print_status $RED "❌ Failed to create project 'aic-website' (HTTP $http_code)"
        cat /tmp/project_response.json
    fi
    
    # Create library project for base images
    project_response=$(curl -k -s -w "%{http_code}" \
        -X POST "$HARBOR_URL/api/v2.0/projects" \
        -H "Content-Type: application/json" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD" \
        -d '{
            "project_name": "library",
            "metadata": {
                "public": "true",
                "enable_content_trust": "false",
                "prevent_vul": "false",
                "auto_scan": "true",
                "reuse_sys_cve_allowlist": "true"
            }
        }' -o /tmp/project_response.json)
    
    http_code="${project_response: -3}"
    
    if [ "$http_code" = "201" ]; then
        print_status $GREEN "✅ Project 'library' created successfully"
    elif [ "$http_code" = "409" ]; then
        print_status $YELLOW "⚠️  Project 'library' already exists"
    else
        print_status $YELLOW "⚠️  Failed to create project 'library' (HTTP $http_code)"
    fi
}

# Function to create robot accounts
create_robot_accounts() {
    print_status $BLUE "🤖 Creating robot accounts..."
    
    # Get project ID for aic-website
    local project_info=$(curl -k -s \
        -X GET "$HARBOR_URL/api/v2.0/projects?name=aic-website" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD")
    
    local project_id=$(echo "$project_info" | jq -r '.[0].project_id')
    
    if [ "$project_id" = "null" ]; then
        print_status $RED "❌ Cannot find aic-website project"
        exit 1
    fi
    
    # Create GitLab CI robot account
    local robot_response=$(curl -k -s -w "%{http_code}" \
        -X POST "$HARBOR_URL/api/v2.0/projects/$project_id/robots" \
        -H "Content-Type: application/json" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD" \
        -d '{
            "name": "gitlab-ci",
            "description": "Robot account for GitLab CI/CD pipeline",
            "duration": -1,
            "level": "project",
            "permissions": [
                {
                    "kind": "project",
                    "namespace": "aic-website",
                    "access": [
                        {"resource": "repository", "action": "push"},
                        {"resource": "repository", "action": "pull"},
                        {"resource": "artifact", "action": "delete"},
                        {"resource": "helm-chart", "action": "read"},
                        {"resource": "helm-chart-version", "action": "create"},
                        {"resource": "helm-chart-version", "action": "delete"},
                        {"resource": "scan", "action": "create"}
                    ]
                }
            ]
        }' -o /tmp/robot_response.json)
    
    local http_code="${robot_response: -3}"
    
    if [ "$http_code" = "201" ]; then
        local robot_name=$(cat /tmp/robot_response.json | jq -r '.name')
        local robot_secret=$(cat /tmp/robot_response.json | jq -r '.secret')
        
        print_status $GREEN "✅ GitLab CI robot account created: $robot_name"
        
        # Store robot credentials for GitLab CI variables
        echo "HARBOR_USERNAME=$robot_name" > /tmp/harbor_credentials.env
        echo "HARBOR_PASSWORD=$robot_secret" >> /tmp/harbor_credentials.env
        
        print_status $BLUE "🔑 Robot credentials saved to /tmp/harbor_credentials.env"
        
        # Return the credentials for further use
        export ROBOT_USERNAME="$robot_name"
        export ROBOT_PASSWORD="$robot_secret"
        
    elif [ "$http_code" = "409" ]; then
        print_status $YELLOW "⚠️  Robot account 'gitlab-ci' already exists"
        
        # Try to get existing robot account details
        local existing_robots=$(curl -k -s \
            -X GET "$HARBOR_URL/api/v2.0/projects/$project_id/robots" \
            -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD")
        
        local robot_name=$(echo "$existing_robots" | jq -r '.[] | select(.name | contains("gitlab-ci")) | .name')
        
        if [ -n "$robot_name" ] && [ "$robot_name" != "null" ]; then
            print_status $BLUE "📋 Existing robot account: $robot_name"
            export ROBOT_USERNAME="$robot_name"
            # Note: Cannot retrieve existing robot password
        fi
    else
        print_status $RED "❌ Failed to create robot account (HTTP $http_code)"
        cat /tmp/robot_response.json
        exit 1
    fi
}

# Function to configure GitLab CI variables
configure_gitlab_variables() {
    print_status $BLUE "🔧 Configuring GitLab CI variables..."
    
    # Function to create/update GitLab variable
    create_gitlab_variable() {
        local key=$1
        local value=$2
        local protected=${3:-true}
        local masked=${4:-false}
        local environment_scope=${5:-"*"}
        
        local response=$(curl -s -w "%{http_code}" \
             --request POST \
             --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
             --header "Content-Type: application/json" \
             --data "{
                 \"key\": \"$key\",
                 \"value\": \"$value\",
                 \"protected\": $protected,
                 \"masked\": $masked,
                 \"environment_scope\": \"$environment_scope\"
             }" \
             "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables" \
             -o /tmp/gitlab_response.json)
        
        local http_code="${response: -3}"
        
        if [ "$http_code" = "201" ]; then
            print_status $GREEN "  ✅ Created variable: $key"
        elif [ "$http_code" = "400" ]; then
            # Variable exists, try to update
            curl -s --request PUT \
                 --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
                 --header "Content-Type: application/json" \
                 --data "{
                     \"value\": \"$value\",
                     \"protected\": $protected,
                     \"masked\": $masked,
                     \"environment_scope\": \"$environment_scope\"
                 }" \
                 "$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/variables/$key" > /dev/null
            
            print_status $YELLOW "  🔄 Updated variable: $key"
        else
            print_status $RED "  ❌ Failed to create variable: $key (HTTP $http_code)"
        fi
    }
    
    # Configure Harbor registry variables
    local harbor_domain=$(echo "$HARBOR_URL" | sed 's|https\?://||')
    
    create_gitlab_variable "HARBOR_REGISTRY_URL" "$harbor_domain" true false "*"
    create_gitlab_variable "HARBOR_PROJECT" "aic-website" true false "*"
    
    if [ -n "$ROBOT_USERNAME" ]; then
        create_gitlab_variable "HARBOR_USERNAME" "$ROBOT_USERNAME" true true "*"
    fi
    
    if [ -n "$ROBOT_PASSWORD" ]; then
        create_gitlab_variable "HARBOR_PASSWORD" "$ROBOT_PASSWORD" true true "*"
    fi
    
    print_status $GREEN "✅ GitLab CI variables configured"
}

# Function to create Harbor webhook for GitLab
create_harbor_webhook() {
    print_status $BLUE "🔗 Creating Harbor webhook for GitLab..."
    
    # Get project ID
    local project_info=$(curl -k -s \
        -X GET "$HARBOR_URL/api/v2.0/projects?name=aic-website" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD")
    
    local project_id=$(echo "$project_info" | jq -r '.[0].project_id')
    
    # Create webhook
    local webhook_response=$(curl -k -s -w "%{http_code}" \
        -X POST "$HARBOR_URL/api/v2.0/projects/$project_id/webhook/policies" \
        -H "Content-Type: application/json" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD" \
        -d "{
            \"name\": \"gitlab-webhook\",
            \"description\": \"Webhook to trigger GitLab CI on image push\",
            \"enabled\": true,
            \"event_types\": [
                \"PUSH_ARTIFACT\",
                \"PULL_ARTIFACT\",
                \"DELETE_ARTIFACT\",
                \"SCANNING_COMPLETED\"
            ],
            \"targets\": [
                {
                    \"type\": \"http\",
                    \"address\": \"$GITLAB_URL/api/v4/projects/$GITLAB_PROJECT_ID/trigger/pipeline\",
                    \"auth_header\": \"Authorization: Bearer $GITLAB_TOKEN\",
                    \"skip_cert_verify\": false
                }
            ]
        }" -o /tmp/webhook_response.json)
    
    local http_code="${webhook_response: -3}"
    
    if [ "$http_code" = "201" ]; then
        print_status $GREEN "✅ Harbor webhook created successfully"
    elif [ "$http_code" = "409" ]; then
        print_status $YELLOW "⚠️  Harbor webhook already exists"
    else
        print_status $YELLOW "⚠️  Failed to create Harbor webhook (HTTP $http_code)"
    fi
}

# Function to test Harbor integration
test_harbor_integration() {
    print_status $BLUE "🧪 Testing Harbor integration..."
    
    # Test Harbor API access
    local system_info=$(curl -k -s \
        -X GET "$HARBOR_URL/api/v2.0/systeminfo" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD")
    
    if echo "$system_info" | grep -q "harbor_version"; then
        local harbor_version=$(echo "$system_info" | jq -r '.harbor_version')
        print_status $GREEN "✅ Harbor API accessible (version: $harbor_version)"
    else
        print_status $RED "❌ Cannot access Harbor API"
        return 1
    fi
    
    # Test project access
    local projects=$(curl -k -s \
        -X GET "$HARBOR_URL/api/v2.0/projects" \
        -u "$HARBOR_ADMIN_USER:$HARBOR_ADMIN_PASSWORD")
    
    if echo "$projects" | grep -q "aic-website"; then
        print_status $GREEN "✅ aic-website project accessible"
    else
        print_status $RED "❌ Cannot access aic-website project"
        return 1
    fi
    
    # Test robot account (if credentials available)
    if [ -n "$ROBOT_USERNAME" ] && [ -n "$ROBOT_PASSWORD" ]; then
        local robot_test=$(curl -k -s -w "%{http_code}" \
            -X GET "$HARBOR_URL/api/v2.0/projects/aic-website/repositories" \
            -u "$ROBOT_USERNAME:$ROBOT_PASSWORD" \
            -o /dev/null)
        
        if [ "$robot_test" = "200" ]; then
            print_status $GREEN "✅ Robot account authentication successful"
        else
            print_status $RED "❌ Robot account authentication failed"
            return 1
        fi
    fi
    
    print_status $GREEN "✅ Harbor integration test completed successfully"
}

# Function to generate Docker configuration
generate_docker_config() {
    print_status $BLUE "🐳 Generating Docker configuration..."
    
    local harbor_domain=$(echo "$HARBOR_URL" | sed 's|https\?://||')
    
    cat > /tmp/docker-config.json <<EOF
{
    "auths": {
        "$harbor_domain": {
            "username": "$ROBOT_USERNAME",
            "password": "$ROBOT_PASSWORD",
            "auth": "$(echo -n "$ROBOT_USERNAME:$ROBOT_PASSWORD" | base64 -w 0)"
        }
    },
    "HttpHeaders": {
        "User-Agent": "Docker-Client/19.03.0 (linux)"
    }
}
EOF
    
    print_status $GREEN "✅ Docker configuration generated: /tmp/docker-config.json"
    print_status $BLUE "📋 To use this configuration:"
    echo "   mkdir -p ~/.docker"
    echo "   cp /tmp/docker-config.json ~/.docker/config.json"
}

# Function to display integration summary
display_integration_summary() {
    print_status $BLUE "📋 Harbor GitLab Integration Summary"
    echo "=================================="
    echo "Harbor URL: $HARBOR_URL"
    echo "Harbor Project: aic-website"
    echo "Robot Account: ${ROBOT_USERNAME:-Not created}"
    echo "GitLab Project ID: $GITLAB_PROJECT_ID"
    echo ""
    print_status $BLUE "🔧 GitLab CI Variables Configured:"
    echo "- HARBOR_REGISTRY_URL"
    echo "- HARBOR_PROJECT"
    echo "- HARBOR_USERNAME (robot account)"
    echo "- HARBOR_PASSWORD (robot secret)"
    echo ""
    print_status $BLUE "📝 Next Steps:"
    echo "1. Test image push/pull in GitLab CI pipeline"
    echo "2. Configure vulnerability scanning policies"
    echo "3. Set up Harbor backup procedures"
    echo "4. Configure image retention policies"
    echo "5. Set up monitoring and alerting"
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "Harbor GitLab Integration Configuration Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --harbor-url URL    Harbor URL (default: https://harbor.aicorp.com)"
    echo "  -a, --admin-user USER   Harbor admin username (default: admin)"
    echo "  -p, --admin-pass PASS   Harbor admin password"
    echo "  --skip-projects         Skip project creation"
    echo "  --skip-robot            Skip robot account creation"
    echo "  --skip-webhook          Skip webhook creation"
    echo "  --skip-gitlab           Skip GitLab variable configuration"
    echo ""
    echo "Environment Variables:"
    echo "  HARBOR_URL             Harbor registry URL"
    echo "  HARBOR_ADMIN_USER      Harbor admin username"
    echo "  HARBOR_ADMIN_PASSWORD  Harbor admin password"
    echo "  GITLAB_PROJECT_ID      GitLab project ID (required)"
    echo "  GITLAB_TOKEN          GitLab personal access token (required)"
    echo "  GITLAB_URL            GitLab instance URL"
    echo ""
    echo "Example:"
    echo "  export GITLAB_PROJECT_ID=12345"
    echo "  export GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx"
    echo "  $0 --harbor-url https://harbor.example.com"
}

# Main function
main() {
    local skip_projects=false
    local skip_robot=false
    local skip_webhook=false
    local skip_gitlab=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -u|--harbor-url)
                HARBOR_URL="$2"
                shift 2
                ;;
            -a|--admin-user)
                HARBOR_ADMIN_USER="$2"
                shift 2
                ;;
            -p|--admin-pass)
                HARBOR_ADMIN_PASSWORD="$2"
                shift 2
                ;;
            --skip-projects)
                skip_projects=true
                shift
                ;;
            --skip-robot)
                skip_robot=true
                shift
                ;;
            --skip-webhook)
                skip_webhook=true
                shift
                ;;
            --skip-gitlab)
                skip_gitlab=true
                shift
                ;;
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting Harbor GitLab integration configuration..."
    
    # Execute configuration steps
    validate_prerequisites
    
    if [ "$skip_projects" = false ]; then
        create_harbor_projects
    fi
    
    if [ "$skip_robot" = false ]; then
        create_robot_accounts
    fi
    
    if [ "$skip_gitlab" = false ]; then
        configure_gitlab_variables
    fi
    
    if [ "$skip_webhook" = false ]; then
        create_harbor_webhook
    fi
    
    test_harbor_integration
    generate_docker_config
    display_integration_summary
    
    print_status $GREEN "🎉 Harbor GitLab integration configuration completed!"
}

# Cleanup function
cleanup() {
    rm -f /tmp/project_response.json /tmp/robot_response.json /tmp/webhook_response.json /tmp/gitlab_response.json
}

# Set trap for cleanup
trap cleanup EXIT

# Check for required tools
if ! command -v curl &> /dev/null; then
    print_status $RED "❌ curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_status $RED "❌ jq is required but not installed"
    exit 1
fi

# Run main function
main "$@"
