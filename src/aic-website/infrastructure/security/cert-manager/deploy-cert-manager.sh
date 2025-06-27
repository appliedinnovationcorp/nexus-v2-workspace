#!/bin/bash

# Deploy cert-manager and related resources

set -e

echo "Deploying cert-manager resources..."

# Create namespace if it doesn't exist
kubectl create namespace security --dry-run=client -o yaml | kubectl apply -f -

# Deploy cert-manager using Helm
echo "Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace security \
  --values ../../helm/cert-manager-values.yaml \
  --wait

# Wait for cert-manager to be ready
echo "Waiting for cert-manager to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n security
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n security
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-cainjector -n security

# Create Route53 credentials secret
echo "Creating Route53 credentials secret..."
kubectl apply -f route53-credentials-secret.yaml

# Create ClusterIssuers
echo "Creating ClusterIssuers..."
kubectl apply -f cluster-issuers.yaml

echo "cert-manager deployment completed successfully!"
