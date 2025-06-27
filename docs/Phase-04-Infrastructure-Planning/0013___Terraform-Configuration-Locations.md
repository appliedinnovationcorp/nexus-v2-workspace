## Terraform Configuration Locations

1. /infra/terraform/ - Contains the original infrastructure setup
2. /infrastructure/terraform/ - Contains the newer, more comprehensive setup

## AWS Services Configured

Based on the Terraform files, the infrastructure includes:

### Core Infrastructure
• **VPC** - Virtual Private Cloud with public/private subnets
• **EKS** - Elastic Kubernetes Service cluster
• **ECS** - Elastic Container Service cluster
• **ALB** - Application Load Balancer
• **NAT Gateway** and Internet Gateway
• **Route53** - DNS management
• **CloudFront** - CDN distribution
• **ACM** - SSL/TLS certificates

### Data Services
• **RDS PostgreSQL** - Relational database
• **DocumentDB** - MongoDB-compatible database
• **ElastiCache** - Redis caching layer

### Storage & Security
• **S3 Buckets** - Object storage with encryption and versioning
• **Security Groups** - Network access controls
• **EIP** - Elastic IP addresses

### Infrastructure Modules
The configuration uses official AWS Terraform modules:
• terraform-aws-modules/eks/aws - EKS cluster
• terraform-aws-modules/rds/aws - RDS database
• terraform-aws-modules/vpc/aws - VPC networking

## Architecture

The infrastructure follows a MACH architecture (Microservices, API-first, Cloud-native, Headless
) with:
• Kubernetes for container orchestration
• Kong API Gateway for API management
• Service mesh with Kuma
• Full observability stack (Prometheus, Grafana, ELK)
• GitOps deployment with ArgoCD

The setup includes both traditional AWS services and modern cloud-native components, providing 
a robust, scalable foundation for the AIC website.