# Main Terraform Configuration for AIC Platform
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    bucket         = "aic-terraform-state"
    key            = "platform/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "aic-terraform-locks"
  }
}

# Variables
variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "cloud_provider" {
  description = "Cloud provider (aws, azure, gcp)"
  type        = string
  default     = "aws"
}

variable "region" {
  description = "Cloud region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "aic-platform"
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 3
}

variable "node_instance_type" {
  description = "Instance type for worker nodes"
  type        = string
  default     = "m5.xlarge"
}

variable "enable_monitoring" {
  description = "Enable monitoring stack"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable centralized logging"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

# Local values
locals {
  common_tags = {
    Environment = var.environment
    Project     = "aic-platform"
    ManagedBy   = "terraform"
    Owner       = "aic-devops"
  }
  
  cluster_name = "${var.cluster_name}-${var.environment}"
}

# Data sources
data "aws_availability_zones" "available" {
  count = var.cloud_provider == "aws" ? 1 : 0
  state = "available"
}

data "azurerm_client_config" "current" {
  count = var.cloud_provider == "azure" ? 1 : 0
}

# Modules
module "aws_infrastructure" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  source = "./modules/aws"
  
  environment          = var.environment
  region              = var.region
  cluster_name        = local.cluster_name
  node_count          = var.node_count
  node_instance_type  = var.node_instance_type
  availability_zones  = data.aws_availability_zones.available[0].names
  common_tags         = local.common_tags
  enable_monitoring   = var.enable_monitoring
  enable_logging      = var.enable_logging
  enable_backup       = var.enable_backup
}

module "azure_infrastructure" {
  count  = var.cloud_provider == "azure" ? 1 : 0
  source = "./modules/azure"
  
  environment         = var.environment
  region             = var.region
  cluster_name       = local.cluster_name
  node_count         = var.node_count
  node_instance_type = var.node_instance_type
  common_tags        = local.common_tags
  enable_monitoring  = var.enable_monitoring
  enable_logging     = var.enable_logging
  enable_backup      = var.enable_backup
}

module "gcp_infrastructure" {
  count  = var.cloud_provider == "gcp" ? 1 : 0
  source = "./modules/gcp"
  
  environment         = var.environment
  region             = var.region
  cluster_name       = local.cluster_name
  node_count         = var.node_count
  node_instance_type = var.node_instance_type
  common_tags        = local.common_tags
  enable_monitoring  = var.enable_monitoring
  enable_logging     = var.enable_logging
  enable_backup      = var.enable_backup
}

module "kubernetes_platform" {
  source = "./modules/kubernetes"
  
  cluster_endpoint = var.cloud_provider == "aws" ? module.aws_infrastructure[0].cluster_endpoint : (
    var.cloud_provider == "azure" ? module.azure_infrastructure[0].cluster_endpoint : 
    module.gcp_infrastructure[0].cluster_endpoint
  )
  
  cluster_ca_certificate = var.cloud_provider == "aws" ? module.aws_infrastructure[0].cluster_ca_certificate : (
    var.cloud_provider == "azure" ? module.azure_infrastructure[0].cluster_ca_certificate : 
    module.gcp_infrastructure[0].cluster_ca_certificate
  )
  
  cluster_token = var.cloud_provider == "aws" ? module.aws_infrastructure[0].cluster_token : (
    var.cloud_provider == "azure" ? module.azure_infrastructure[0].cluster_token : 
    module.gcp_infrastructure[0].cluster_token
  )
  
  environment       = var.environment
  enable_monitoring = var.enable_monitoring
  enable_logging    = var.enable_logging
}

# Outputs
output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value = var.cloud_provider == "aws" ? module.aws_infrastructure[0].cluster_endpoint : (
    var.cloud_provider == "azure" ? module.azure_infrastructure[0].cluster_endpoint : 
    module.gcp_infrastructure[0].cluster_endpoint
  )
  sensitive = true
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = local.cluster_name
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value = var.cloud_provider == "aws" ? "aws eks update-kubeconfig --region ${var.region} --name ${local.cluster_name}" : (
    var.cloud_provider == "azure" ? "az aks get-credentials --resource-group ${local.cluster_name}-rg --name ${local.cluster_name}" : 
    "gcloud container clusters get-credentials ${local.cluster_name} --region ${var.region}"
  )
}

output "monitoring_urls" {
  description = "Monitoring service URLs"
  value = var.enable_monitoring ? {
    prometheus = "https://prometheus.${var.environment}.aicorp.com"
    grafana    = "https://grafana.${var.environment}.aicorp.com"
    alertmanager = "https://alertmanager.${var.environment}.aicorp.com"
  } : {}
}

output "application_urls" {
  description = "Application URLs"
  value = {
    main_site    = "https://aicorp.com"
    smb_portal   = "https://smb.aicorp.com"
    enterprise   = "https://enterprise.aicorp.com"
    nexus        = "https://nexus.aicorp.com"
    investors    = "https://investors.aicorp.com"
    admin        = "https://admin.aicorp.com"
  }
}
