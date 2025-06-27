#!/bin/bash

# Deploy Jenkins to Kubernetes

set -e

echo "Deploying Jenkins to Kubernetes..."

# Create namespace and RBAC
kubectl apply -f kubernetes/jenkins-deployment.yaml

# Create secrets
echo "Creating Jenkins secrets..."
kubectl create secret generic jenkins-secrets \
  --namespace jenkins \
  --from-literal=ADMIN_PASSWORD="$(openssl rand -base64 12)" \
  --from-literal=GITLAB_WEBHOOK_PASSWORD="$(openssl rand -base64 12)" \
  --from-literal=GITLAB_WEBHOOK_SECRET="$(openssl rand -base64 24)" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create ConfigMap for Jenkins jobs
echo "Creating Jenkins jobs ConfigMap..."
kubectl create configmap jenkins-jobs \
  --namespace jenkins \
  --from-file=aic-website-production-deploy.groovy=jobs/aic-website-production-deploy.groovy \
  --from-file=aic-website-rollback.groovy=jobs/aic-website-rollback.groovy \
  --from-file=aic-website-database-migration.groovy=jobs/aic-website-database-migration.groovy \
  --from-file=aic-website-smoke-test.groovy=jobs/aic-website-smoke-test.groovy \
  --dry-run=client -o yaml | kubectl apply -f -

# Create ConfigMap for Jenkins configuration
echo "Creating Jenkins configuration ConfigMap..."
kubectl create configmap jenkins-config \
  --namespace jenkins \
  --from-file=jenkins.yaml=config/jenkins.yaml \
  --from-file=plugins.txt=config/plugins.txt \
  --dry-run=client -o yaml | kubectl apply -f -

# Wait for Jenkins to be ready
echo "Waiting for Jenkins to be ready..."
kubectl rollout status deployment/jenkins -n jenkins

echo "Jenkins deployed successfully!"
echo "Access Jenkins at: https://jenkins.example.com"
echo "Admin password can be retrieved with: kubectl get secret jenkins-secrets -n jenkins -o jsonpath='{.data.ADMIN_PASSWORD}' | base64 --decode"
