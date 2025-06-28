#!/bin/bash

# AIC Platform Secrets Management Script
# This script manages secrets for the AIC platform across different environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"

# Default values
ENVIRONMENT="${ENVIRONMENT:-production}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-aws}"
REGION="${REGION:-us-east-1}"
ACTION="${ACTION:-list}"
SECRET_NAME="${SECRET_NAME:-}"
SECRET_VALUE="${SECRET_VALUE:-}"
SECRET_FILE="${SECRET_FILE:-}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
AIC Platform Secrets Management Script

Usage: $0 [OPTIONS]

Actions:
    list                            List all secrets (default)
    get SECRET_NAME                 Get a specific secret
    create SECRET_NAME SECRET_VALUE Create a new secret
    update SECRET_NAME SECRET_VALUE Update an existing secret
    delete SECRET_NAME              Delete a secret
    rotate SECRET_NAME              Rotate a secret
    import SECRET_FILE              Import secrets from a file
    export                          Export secrets to a file

Options:
    -e, --environment ENVIRONMENT   Environment (production, staging, development)
    -c, --cloud-provider PROVIDER   Cloud provider (aws, azure, gcp)
    -r, --region REGION             Cloud region
    -a, --action ACTION             Action to perform (list, get, create, update, delete, rotate, import, export)
    -n, --name SECRET_NAME          Secret name
    -v, --value SECRET_VALUE        Secret value
    -f, --file SECRET_FILE          Secret file for import/export
    --dry-run                       Show what would be done without executing
    -h, --help                      Show this help message

Environment Variables:
    ENVIRONMENT                     Same as --environment
    CLOUD_PROVIDER                  Same as --cloud-provider
    REGION                          Same as --region
    ACTION                          Same as --action
    SECRET_NAME                     Same as --name
    SECRET_VALUE                    Same as --value
    SECRET_FILE                     Same as --file
    DRY_RUN                         Same as --dry-run

Examples:
    # List all secrets in production
    $0 --environment production --action list

    # Get a specific secret
    $0 --action get --name database/password

    # Create a new secret
    $0 --action create --name api/key --value "your-api-key"

    # Update an existing secret
    $0 --action update --name api/key --value "new-api-key"

    # Delete a secret
    $0 --action delete --name api/key

    # Rotate a secret
    $0 --action rotate --name database/password

    # Import secrets from a file
    $0 --action import --file secrets.json

    # Export secrets to a file
    $0 --action export --file secrets.json
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--cloud-provider)
            CLOUD_PROVIDER="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -n|--name)
            SECRET_NAME="$2"
            shift 2
            ;;
        -v|--value)
            SECRET_VALUE="$2"
            shift 2
            ;;
        -f|--file)
            SECRET_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validation
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    
    # Cloud-specific tools
    case $CLOUD_PROVIDER in
        aws)
            command -v aws >/dev/null 2>&1 || missing_tools+=("aws-cli")
            ;;
        azure)
            command -v az >/dev/null 2>&1 || missing_tools+=("azure-cli")
            ;;
        gcp)
            command -v gcloud >/dev/null 2>&1 || missing_tools+=("gcloud")
            ;;
    esac
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install the missing tools and try again."
        exit 1
    fi
    
    # Validate environment values
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: production, staging, development"
        exit 1
    fi
    
    if [[ ! "$CLOUD_PROVIDER" =~ ^(aws|azure|gcp)$ ]]; then
        log_error "Invalid cloud provider: $CLOUD_PROVIDER. Must be one of: aws, azure, gcp"
        exit 1
    fi
    
    # Validate action
    if [[ ! "$ACTION" =~ ^(list|get|create|update|delete|rotate|import|export)$ ]]; then
        log_error "Invalid action: $ACTION. Must be one of: list, get, create, update, delete, rotate, import, export"
        exit 1
    fi
    
    # Validate required parameters based on action
    case $ACTION in
        get|update|delete|rotate)
            if [[ -z "$SECRET_NAME" ]]; then
                log_error "Secret name is required for action: $ACTION"
                exit 1
            fi
            ;;
        create|update)
            if [[ -z "$SECRET_NAME" || -z "$SECRET_VALUE" ]]; then
                log_error "Secret name and value are required for action: $ACTION"
                exit 1
            fi
            ;;
        import)
            if [[ -z "$SECRET_FILE" ]]; then
                log_error "Secret file is required for action: import"
                exit 1
            fi
            if [[ ! -f "$SECRET_FILE" ]]; then
                log_error "Secret file does not exist: $SECRET_FILE"
                exit 1
            fi
            ;;
    esac
    
    log_success "Prerequisites validated"
}

# AWS Secrets Manager functions
aws_list_secrets() {
    log_info "Listing secrets in AWS Secrets Manager for environment: $ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would list secrets in AWS Secrets Manager"
        return 0
    fi
    
    aws secretsmanager list-secrets \
        --region "$REGION" \
        --filter "Key=tag-key,Values=Environment" "Key=tag-value,Values=$ENVIRONMENT" \
        --query "SecretList[].Name" \
        --output table
}

aws_get_secret() {
    log_info "Getting secret from AWS Secrets Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would get secret: $SECRET_NAME"
        return 0
    fi
    
    aws secretsmanager get-secret-value \
        --region "$REGION" \
        --secret-id "aic/$ENVIRONMENT/$SECRET_NAME" \
        --query "SecretString" \
        --output text
}

aws_create_secret() {
    log_info "Creating secret in AWS Secrets Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create secret: $SECRET_NAME with value: $SECRET_VALUE"
        return 0
    fi
    
    aws secretsmanager create-secret \
        --region "$REGION" \
        --name "aic/$ENVIRONMENT/$SECRET_NAME" \
        --secret-string "$SECRET_VALUE" \
        --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Project,Value=aic-platform" "Key=ManagedBy,Value=terraform"
}

aws_update_secret() {
    log_info "Updating secret in AWS Secrets Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update secret: $SECRET_NAME with value: $SECRET_VALUE"
        return 0
    fi
    
    aws secretsmanager update-secret \
        --region "$REGION" \
        --secret-id "aic/$ENVIRONMENT/$SECRET_NAME" \
        --secret-string "$SECRET_VALUE"
}

aws_delete_secret() {
    log_info "Deleting secret from AWS Secrets Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would delete secret: $SECRET_NAME"
        return 0
    fi
    
    aws secretsmanager delete-secret \
        --region "$REGION" \
        --secret-id "aic/$ENVIRONMENT/$SECRET_NAME" \
        --recovery-window-in-days 7
}

aws_rotate_secret() {
    log_info "Rotating secret in AWS Secrets Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rotate secret: $SECRET_NAME"
        return 0
    fi
    
    aws secretsmanager rotate-secret \
        --region "$REGION" \
        --secret-id "aic/$ENVIRONMENT/$SECRET_NAME"
}

aws_import_secrets() {
    log_info "Importing secrets to AWS Secrets Manager from file: $SECRET_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import secrets from file: $SECRET_FILE"
        return 0
    fi
    
    local secrets
    secrets=$(jq -c '.[]' "$SECRET_FILE")
    
    for secret in $secrets; do
        local name
        local value
        name=$(echo "$secret" | jq -r '.name')
        value=$(echo "$secret" | jq -r '.value')
        
        log_info "Importing secret: $name"
        
        # Check if secret exists
        if aws secretsmanager describe-secret --region "$REGION" --secret-id "aic/$ENVIRONMENT/$name" &>/dev/null; then
            aws_update_secret "$name" "$value"
        else
            aws_create_secret "$name" "$value"
        fi
    done
}

aws_export_secrets() {
    log_info "Exporting secrets from AWS Secrets Manager to file: $SECRET_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would export secrets to file: $SECRET_FILE"
        return 0
    fi
    
    local secret_names
    secret_names=$(aws secretsmanager list-secrets \
        --region "$REGION" \
        --filter "Key=tag-key,Values=Environment" "Key=tag-value,Values=$ENVIRONMENT" \
        --query "SecretList[].Name" \
        --output text)
    
    local secrets=()
    
    for full_name in $secret_names; do
        local name
        name=${full_name#aic/$ENVIRONMENT/}
        
        local value
        value=$(aws secretsmanager get-secret-value \
            --region "$REGION" \
            --secret-id "$full_name" \
            --query "SecretString" \
            --output text)
        
        secrets+=("{\"name\":\"$name\",\"value\":\"$value\"}")
    done
    
    echo "[$(IFS=,; echo "${secrets[*]}")" > "$SECRET_FILE"
    log_success "Exported $(echo "${#secrets[@]}") secrets to $SECRET_FILE"
}

# Azure Key Vault functions
azure_list_secrets() {
    log_info "Listing secrets in Azure Key Vault for environment: $ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would list secrets in Azure Key Vault"
        return 0
    fi
    
    az keyvault secret list \
        --vault-name "aic-$ENVIRONMENT-kv" \
        --query "[].name" \
        --output table
}

azure_get_secret() {
    log_info "Getting secret from Azure Key Vault: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would get secret: $SECRET_NAME"
        return 0
    fi
    
    az keyvault secret show \
        --vault-name "aic-$ENVIRONMENT-kv" \
        --name "$SECRET_NAME" \
        --query "value" \
        --output tsv
}

azure_create_secret() {
    log_info "Creating secret in Azure Key Vault: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create secret: $SECRET_NAME with value: $SECRET_VALUE"
        return 0
    fi
    
    az keyvault secret set \
        --vault-name "aic-$ENVIRONMENT-kv" \
        --name "$SECRET_NAME" \
        --value "$SECRET_VALUE" \
        --tags "Environment=$ENVIRONMENT" "Project=aic-platform" "ManagedBy=terraform"
}

azure_update_secret() {
    log_info "Updating secret in Azure Key Vault: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update secret: $SECRET_NAME with value: $SECRET_VALUE"
        return 0
    fi
    
    az keyvault secret set \
        --vault-name "aic-$ENVIRONMENT-kv" \
        --name "$SECRET_NAME" \
        --value "$SECRET_VALUE"
}

azure_delete_secret() {
    log_info "Deleting secret from Azure Key Vault: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would delete secret: $SECRET_NAME"
        return 0
    fi
    
    az keyvault secret delete \
        --vault-name "aic-$ENVIRONMENT-kv" \
        --name "$SECRET_NAME"
}

azure_rotate_secret() {
    log_info "Rotating secret in Azure Key Vault: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rotate secret: $SECRET_NAME"
        return 0
    fi
    
    # Azure doesn't have a direct rotate command, so we need to implement rotation logic
    log_warning "Azure Key Vault doesn't support direct secret rotation. Please implement custom rotation logic."
}

azure_import_secrets() {
    log_info "Importing secrets to Azure Key Vault from file: $SECRET_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import secrets from file: $SECRET_FILE"
        return 0
    fi
    
    local secrets
    secrets=$(jq -c '.[]' "$SECRET_FILE")
    
    for secret in $secrets; do
        local name
        local value
        name=$(echo "$secret" | jq -r '.name')
        value=$(echo "$secret" | jq -r '.value')
        
        log_info "Importing secret: $name"
        azure_update_secret "$name" "$value"
    done
}

azure_export_secrets() {
    log_info "Exporting secrets from Azure Key Vault to file: $SECRET_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would export secrets to file: $SECRET_FILE"
        return 0
    fi
    
    local secret_names
    secret_names=$(az keyvault secret list \
        --vault-name "aic-$ENVIRONMENT-kv" \
        --query "[].name" \
        --output tsv)
    
    local secrets=()
    
    for name in $secret_names; do
        local value
        value=$(az keyvault secret show \
            --vault-name "aic-$ENVIRONMENT-kv" \
            --name "$name" \
            --query "value" \
            --output tsv)
        
        secrets+=("{\"name\":\"$name\",\"value\":\"$value\"}")
    done
    
    echo "[$(IFS=,; echo "${secrets[*]}")" > "$SECRET_FILE"
    log_success "Exported $(echo "${#secrets[@]}") secrets to $SECRET_FILE"
}

# GCP Secret Manager functions
gcp_list_secrets() {
    log_info "Listing secrets in GCP Secret Manager for environment: $ENVIRONMENT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would list secrets in GCP Secret Manager"
        return 0
    fi
    
    gcloud secrets list \
        --filter "labels.environment=$ENVIRONMENT" \
        --format="table(name.basename())"
}

gcp_get_secret() {
    log_info "Getting secret from GCP Secret Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would get secret: $SECRET_NAME"
        return 0
    fi
    
    gcloud secrets versions access latest \
        --secret="aic-$ENVIRONMENT-$SECRET_NAME"
}

gcp_create_secret() {
    log_info "Creating secret in GCP Secret Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create secret: $SECRET_NAME with value: $SECRET_VALUE"
        return 0
    fi
    
    echo -n "$SECRET_VALUE" | gcloud secrets create "aic-$ENVIRONMENT-$SECRET_NAME" \
        --data-file=- \
        --labels="environment=$ENVIRONMENT,project=aic-platform,managed-by=terraform"
}

gcp_update_secret() {
    log_info "Updating secret in GCP Secret Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update secret: $SECRET_NAME with value: $SECRET_VALUE"
        return 0
    fi
    
    echo -n "$SECRET_VALUE" | gcloud secrets versions add "aic-$ENVIRONMENT-$SECRET_NAME" \
        --data-file=-
}

gcp_delete_secret() {
    log_info "Deleting secret from GCP Secret Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would delete secret: $SECRET_NAME"
        return 0
    fi
    
    gcloud secrets delete "aic-$ENVIRONMENT-$SECRET_NAME" --quiet
}

gcp_rotate_secret() {
    log_info "Rotating secret in GCP Secret Manager: $SECRET_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rotate secret: $SECRET_NAME"
        return 0
    fi
    
    # GCP doesn't have a direct rotate command, so we add a new version
    local new_value
    new_value=$(openssl rand -base64 32)
    echo -n "$new_value" | gcloud secrets versions add "aic-$ENVIRONMENT-$SECRET_NAME" \
        --data-file=-
}

gcp_import_secrets() {
    log_info "Importing secrets to GCP Secret Manager from file: $SECRET_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import secrets from file: $SECRET_FILE"
        return 0
    fi
    
    local secrets
    secrets=$(jq -c '.[]' "$SECRET_FILE")
    
    for secret in $secrets; do
        local name
        local value
        name=$(echo "$secret" | jq -r '.name')
        value=$(echo "$secret" | jq -r '.value')
        
        log_info "Importing secret: $name"
        
        # Check if secret exists
        if gcloud secrets describe "aic-$ENVIRONMENT-$name" &>/dev/null; then
            gcp_update_secret "$name" "$value"
        else
            gcp_create_secret "$name" "$value"
        fi
    done
}

gcp_export_secrets() {
    log_info "Exporting secrets from GCP Secret Manager to file: $SECRET_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would export secrets to file: $SECRET_FILE"
        return 0
    fi
    
    local secret_names
    secret_names=$(gcloud secrets list \
        --filter "labels.environment=$ENVIRONMENT" \
        --format="value(name.basename())")
    
    local secrets=()
    
    for full_name in $secret_names; do
        local name
        name=${full_name#aic-$ENVIRONMENT-}
        
        local value
        value=$(gcloud secrets versions access latest --secret="$full_name")
        
        secrets+=("{\"name\":\"$name\",\"value\":\"$value\"}")
    done
    
    echo "[$(IFS=,; echo "${secrets[*]}")" > "$SECRET_FILE"
    log_success "Exported $(echo "${#secrets[@]}") secrets to $SECRET_FILE"
}

# Execute action based on cloud provider
execute_action() {
    case $CLOUD_PROVIDER in
        aws)
            case $ACTION in
                list)
                    aws_list_secrets
                    ;;
                get)
                    aws_get_secret
                    ;;
                create)
                    aws_create_secret
                    ;;
                update)
                    aws_update_secret
                    ;;
                delete)
                    aws_delete_secret
                    ;;
                rotate)
                    aws_rotate_secret
                    ;;
                import)
                    aws_import_secrets
                    ;;
                export)
                    aws_export_secrets
                    ;;
            esac
            ;;
        azure)
            case $ACTION in
                list)
                    azure_list_secrets
                    ;;
                get)
                    azure_get_secret
                    ;;
                create)
                    azure_create_secret
                    ;;
                update)
                    azure_update_secret
                    ;;
                delete)
                    azure_delete_secret
                    ;;
                rotate)
                    azure_rotate_secret
                    ;;
                import)
                    azure_import_secrets
                    ;;
                export)
                    azure_export_secrets
                    ;;
            esac
            ;;
        gcp)
            case $ACTION in
                list)
                    gcp_list_secrets
                    ;;
                get)
                    gcp_get_secret
                    ;;
                create)
                    gcp_create_secret
                    ;;
                update)
                    gcp_update_secret
                    ;;
                delete)
                    gcp_delete_secret
                    ;;
                rotate)
                    gcp_rotate_secret
                    ;;
                import)
                    gcp_import_secrets
                    ;;
                export)
                    gcp_export_secrets
                    ;;
            esac
            ;;
    esac
}

# Main function
main() {
    log_info "Starting AIC Platform Secrets Management..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Cloud Provider: $CLOUD_PROVIDER"
    log_info "Region: $REGION"
    log_info "Action: $ACTION"
    
    validate_prerequisites
    execute_action
    
    log_success "Secrets management operation completed successfully!"
}

# Run main function
main "$@"
