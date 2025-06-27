#!/bin/bash

# Harbor Integration Testing Script
# This script tests Harbor registry integration with GitLab CI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HARBOR_URL="${HARBOR_URL:-https://harbor.aicorp.com}"
HARBOR_PROJECT="${HARBOR_PROJECT:-aic-website}"
HARBOR_USERNAME="${HARBOR_USERNAME:-}"
HARBOR_PASSWORD="${HARBOR_PASSWORD:-}"
TEST_IMAGE_NAME="${TEST_IMAGE_NAME:-test-image}"
TEST_IMAGE_TAG="${TEST_IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_status $BLUE "🔍 Checking prerequisites..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_status $RED "❌ Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        print_status $RED "❌ curl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Harbor credentials are provided
    if [ -z "$HARBOR_USERNAME" ] || [ -z "$HARBOR_PASSWORD" ]; then
        print_status $RED "❌ Harbor credentials not provided"
        echo "   Set HARBOR_USERNAME and HARBOR_PASSWORD environment variables"
        exit 1
    fi
    
    print_status $GREEN "✅ Prerequisites check passed"
}

# Function to test Harbor API connectivity
test_harbor_api() {
    print_status $BLUE "🌐 Testing Harbor API connectivity..."
    
    # Test system info endpoint
    local response=$(curl -k -s -w "%{http_code}" \
        -X GET "$HARBOR_URL/api/v2.0/systeminfo" \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" \
        -o /tmp/harbor_systeminfo.json)
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        local harbor_version=$(cat /tmp/harbor_systeminfo.json | jq -r '.harbor_version // "unknown"')
        print_status $GREEN "✅ Harbor API accessible (version: $harbor_version)"
    else
        print_status $RED "❌ Cannot access Harbor API (HTTP $http_code)"
        return 1
    fi
    
    # Test project access
    response=$(curl -k -s -w "%{http_code}" \
        -X GET "$HARBOR_URL/api/v2.0/projects/$HARBOR_PROJECT" \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" \
        -o /tmp/harbor_project.json)
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        print_status $GREEN "✅ Project '$HARBOR_PROJECT' accessible"
    else
        print_status $RED "❌ Cannot access project '$HARBOR_PROJECT' (HTTP $http_code)"
        return 1
    fi
}

# Function to test Docker registry authentication
test_docker_auth() {
    print_status $BLUE "🐳 Testing Docker registry authentication..."
    
    # Extract registry domain from URL
    local registry_domain=$(echo "$HARBOR_URL" | sed 's|https\?://||')
    
    # Test Docker login
    if echo "$HARBOR_PASSWORD" | docker login "$registry_domain" -u "$HARBOR_USERNAME" --password-stdin > /dev/null 2>&1; then
        print_status $GREEN "✅ Docker authentication successful"
    else
        print_status $RED "❌ Docker authentication failed"
        return 1
    fi
}

# Function to create test image
create_test_image() {
    print_status $BLUE "🏗️  Creating test image..."
    
    # Create temporary directory for test image
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Create simple Dockerfile
    cat > Dockerfile <<EOF
FROM alpine:latest
LABEL maintainer="AIC Website Team"
LABEL description="Test image for Harbor integration"
LABEL version="$TEST_IMAGE_TAG"
RUN echo "Harbor integration test - $(date)" > /test.txt
CMD ["cat", "/test.txt"]
EOF
    
    # Build test image
    local registry_domain=$(echo "$HARBOR_URL" | sed 's|https\?://||')
    local full_image_name="$registry_domain/$HARBOR_PROJECT/$TEST_IMAGE_NAME:$TEST_IMAGE_TAG"
    
    if docker build -t "$full_image_name" . > /dev/null 2>&1; then
        print_status $GREEN "✅ Test image built: $full_image_name"
        export TEST_FULL_IMAGE_NAME="$full_image_name"
    else
        print_status $RED "❌ Failed to build test image"
        return 1
    fi
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Function to test image push
test_image_push() {
    print_status $BLUE "📤 Testing image push..."
    
    if docker push "$TEST_FULL_IMAGE_NAME" > /dev/null 2>&1; then
        print_status $GREEN "✅ Image push successful"
    else
        print_status $RED "❌ Image push failed"
        return 1
    fi
}

# Function to test image pull
test_image_pull() {
    print_status $BLUE "📥 Testing image pull..."
    
    # Remove local image first
    docker rmi "$TEST_FULL_IMAGE_NAME" > /dev/null 2>&1 || true
    
    # Pull image from Harbor
    if docker pull "$TEST_FULL_IMAGE_NAME" > /dev/null 2>&1; then
        print_status $GREEN "✅ Image pull successful"
    else
        print_status $RED "❌ Image pull failed"
        return 1
    fi
}

# Function to test vulnerability scanning
test_vulnerability_scan() {
    print_status $BLUE "🔍 Testing vulnerability scanning..."
    
    # Trigger vulnerability scan
    local response=$(curl -k -s -w "%{http_code}" \
        -X POST "$HARBOR_URL/api/v2.0/projects/$HARBOR_PROJECT/repositories/$TEST_IMAGE_NAME/artifacts/$TEST_IMAGE_TAG/scan" \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" \
        -o /tmp/scan_response.json)
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "202" ]; then
        print_status $GREEN "✅ Vulnerability scan triggered"
        
        # Wait for scan to complete (max 60 seconds)
        local max_attempts=12
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            sleep 5
            
            local scan_status=$(curl -k -s \
                -X GET "$HARBOR_URL/api/v2.0/projects/$HARBOR_PROJECT/repositories/$TEST_IMAGE_NAME/artifacts/$TEST_IMAGE_TAG" \
                -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" | \
                jq -r '.scan_overview."application/vnd.security.vulnerability.report; version=1.1".scan_status // "unknown"')
            
            if [ "$scan_status" = "Success" ]; then
                print_status $GREEN "✅ Vulnerability scan completed"
                break
            elif [ "$scan_status" = "Error" ]; then
                print_status $RED "❌ Vulnerability scan failed"
                return 1
            fi
            
            print_status $YELLOW "⏳ Scan in progress... (attempt $attempt/$max_attempts)"
            ((attempt++))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_status $YELLOW "⚠️  Vulnerability scan timeout (may still be running)"
        fi
    else
        print_status $YELLOW "⚠️  Could not trigger vulnerability scan (HTTP $http_code)"
    fi
}

# Function to test Harbor webhooks
test_webhooks() {
    print_status $BLUE "🔗 Testing Harbor webhooks..."
    
    # Get project ID
    local project_info=$(curl -k -s \
        -X GET "$HARBOR_URL/api/v2.0/projects/$HARBOR_PROJECT" \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD")
    
    local project_id=$(echo "$project_info" | jq -r '.project_id')
    
    if [ "$project_id" != "null" ] && [ -n "$project_id" ]; then
        # List webhooks
        local webhooks=$(curl -k -s \
            -X GET "$HARBOR_URL/api/v2.0/projects/$project_id/webhook/policies" \
            -u "$HARBOR_USERNAME:$HARBOR_PASSWORD")
        
        local webhook_count=$(echo "$webhooks" | jq '. | length')
        
        if [ "$webhook_count" -gt 0 ]; then
            print_status $GREEN "✅ Found $webhook_count webhook(s) configured"
        else
            print_status $YELLOW "⚠️  No webhooks configured"
        fi
    else
        print_status $YELLOW "⚠️  Could not retrieve project information"
    fi
}

# Function to test image metadata
test_image_metadata() {
    print_status $BLUE "📋 Testing image metadata..."
    
    # Get artifact information
    local artifact_info=$(curl -k -s \
        -X GET "$HARBOR_URL/api/v2.0/projects/$HARBOR_PROJECT/repositories/$TEST_IMAGE_NAME/artifacts/$TEST_IMAGE_TAG" \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD")
    
    if echo "$artifact_info" | jq -e '.digest' > /dev/null 2>&1; then
        local digest=$(echo "$artifact_info" | jq -r '.digest')
        local size=$(echo "$artifact_info" | jq -r '.size')
        local push_time=$(echo "$artifact_info" | jq -r '.push_time')
        
        print_status $GREEN "✅ Image metadata retrieved:"
        echo "   Digest: $digest"
        echo "   Size: $size bytes"
        echo "   Push Time: $push_time"
    else
        print_status $RED "❌ Could not retrieve image metadata"
        return 1
    fi
}

# Function to test image deletion
test_image_deletion() {
    print_status $BLUE "🗑️  Testing image deletion..."
    
    # Delete the test image
    local response=$(curl -k -s -w "%{http_code}" \
        -X DELETE "$HARBOR_URL/api/v2.0/projects/$HARBOR_PROJECT/repositories/$TEST_IMAGE_NAME/artifacts/$TEST_IMAGE_TAG" \
        -u "$HARBOR_USERNAME:$HARBOR_PASSWORD" \
        -o /dev/null)
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        print_status $GREEN "✅ Image deletion successful"
    else
        print_status $RED "❌ Image deletion failed (HTTP $http_code)"
        return 1
    fi
}

# Function to cleanup local Docker images
cleanup_local_images() {
    print_status $BLUE "🧹 Cleaning up local Docker images..."
    
    # Remove test image
    docker rmi "$TEST_FULL_IMAGE_NAME" > /dev/null 2>&1 || true
    
    # Logout from Harbor registry
    local registry_domain=$(echo "$HARBOR_URL" | sed 's|https\?://||')
    docker logout "$registry_domain" > /dev/null 2>&1 || true
    
    print_status $GREEN "✅ Local cleanup completed"
}

# Function to generate test report
generate_test_report() {
    print_status $BLUE "📊 Generating test report..."
    
    local report_file="/tmp/harbor-integration-test-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" <<EOF
{
  "test_execution": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "harbor_url": "$HARBOR_URL",
    "harbor_project": "$HARBOR_PROJECT",
    "test_image": "$TEST_IMAGE_NAME:$TEST_IMAGE_TAG"
  },
  "test_results": {
    "api_connectivity": "$api_test_result",
    "docker_authentication": "$docker_auth_result",
    "image_push": "$image_push_result",
    "image_pull": "$image_pull_result",
    "vulnerability_scan": "$vuln_scan_result",
    "webhooks": "$webhook_test_result",
    "metadata_retrieval": "$metadata_test_result",
    "image_deletion": "$deletion_test_result"
  },
  "overall_status": "$overall_status"
}
EOF
    
    print_status $GREEN "✅ Test report generated: $report_file"
}

# Function to display test summary
display_test_summary() {
    print_status $BLUE "📋 Harbor Integration Test Summary"
    echo "=================================="
    echo "Harbor URL: $HARBOR_URL"
    echo "Project: $HARBOR_PROJECT"
    echo "Test Image: $TEST_IMAGE_NAME:$TEST_IMAGE_TAG"
    echo "Test Time: $(date)"
    echo ""
    print_status $BLUE "Test Results:"
    echo "- API Connectivity: ${api_test_result:-❌}"
    echo "- Docker Authentication: ${docker_auth_result:-❌}"
    echo "- Image Push: ${image_push_result:-❌}"
    echo "- Image Pull: ${image_pull_result:-❌}"
    echo "- Vulnerability Scan: ${vuln_scan_result:-❌}"
    echo "- Webhooks: ${webhook_test_result:-❌}"
    echo "- Metadata Retrieval: ${metadata_test_result:-❌}"
    echo "- Image Deletion: ${deletion_test_result:-❌}"
    echo ""
    
    if [ "$overall_status" = "PASS" ]; then
        print_status $GREEN "🎉 Overall Status: PASS"
        print_status $GREEN "Harbor integration is working correctly!"
    else
        print_status $RED "❌ Overall Status: FAIL"
        print_status $RED "Some tests failed. Please review the results above."
    fi
    
    echo "=================================="
}

# Function to show usage
show_usage() {
    echo "Harbor Integration Testing Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --harbor-url URL    Harbor URL (default: https://harbor.aicorp.com)"
    echo "  -p, --project PROJECT   Harbor project name (default: aic-website)"
    echo "  -i, --image-name NAME   Test image name (default: test-image)"
    echo "  --skip-scan             Skip vulnerability scanning test"
    echo "  --skip-webhooks         Skip webhook testing"
    echo "  --keep-image            Keep test image after testing"
    echo ""
    echo "Environment Variables:"
    echo "  HARBOR_URL             Harbor registry URL"
    echo "  HARBOR_PROJECT         Harbor project name"
    echo "  HARBOR_USERNAME        Harbor username (required)"
    echo "  HARBOR_PASSWORD        Harbor password (required)"
    echo ""
    echo "Example:"
    echo "  export HARBOR_USERNAME=robot\$gitlab-ci"
    echo "  export HARBOR_PASSWORD=your-robot-password"
    echo "  $0 --harbor-url https://harbor.example.com"
}

# Main testing function
main() {
    local skip_scan=false
    local skip_webhooks=false
    local keep_image=false
    
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
            -p|--project)
                HARBOR_PROJECT="$2"
                shift 2
                ;;
            -i|--image-name)
                TEST_IMAGE_NAME="$2"
                shift 2
                ;;
            --skip-scan)
                skip_scan=true
                shift
                ;;
            --skip-webhooks)
                skip_webhooks=true
                shift
                ;;
            --keep-image)
                keep_image=true
                shift
                ;;
            *)
                print_status $RED "❌ Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_status $BLUE "🚀 Starting Harbor integration tests..."
    
    # Initialize test result variables
    api_test_result="❌"
    docker_auth_result="❌"
    image_push_result="❌"
    image_pull_result="❌"
    vuln_scan_result="❌"
    webhook_test_result="❌"
    metadata_test_result="❌"
    deletion_test_result="❌"
    overall_status="FAIL"
    
    # Execute tests
    check_prerequisites
    
    if test_harbor_api; then
        api_test_result="✅"
    fi
    
    if test_docker_auth; then
        docker_auth_result="✅"
        
        if create_test_image; then
            if test_image_push; then
                image_push_result="✅"
                
                if test_image_pull; then
                    image_pull_result="✅"
                fi
                
                if [ "$skip_scan" = false ] && test_vulnerability_scan; then
                    vuln_scan_result="✅"
                elif [ "$skip_scan" = true ]; then
                    vuln_scan_result="⏭️ "
                fi
                
                if test_image_metadata; then
                    metadata_test_result="✅"
                fi
                
                if [ "$keep_image" = false ] && test_image_deletion; then
                    deletion_test_result="✅"
                elif [ "$keep_image" = true ]; then
                    deletion_test_result="⏭️ "
                fi
            fi
        fi
    fi
    
    if [ "$skip_webhooks" = false ] && test_webhooks; then
        webhook_test_result="✅"
    elif [ "$skip_webhooks" = true ]; then
        webhook_test_result="⏭️ "
    fi
    
    # Determine overall status
    if [[ "$api_test_result" == "✅" && "$docker_auth_result" == "✅" && 
          "$image_push_result" == "✅" && "$image_pull_result" == "✅" ]]; then
        overall_status="PASS"
    fi
    
    # Cleanup
    cleanup_local_images
    
    # Generate report and display summary
    generate_test_report
    display_test_summary
    
    # Exit with appropriate code
    if [ "$overall_status" = "PASS" ]; then
        exit 0
    else
        exit 1
    fi
}

# Cleanup function
cleanup() {
    rm -f /tmp/harbor_*.json /tmp/scan_response.json
}

# Set trap for cleanup
trap cleanup EXIT

# Check for required tools
if ! command -v jq &> /dev/null; then
    print_status $RED "❌ jq is required but not installed"
    echo "   Install with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    exit 1
fi

# Run main function
main "$@"
