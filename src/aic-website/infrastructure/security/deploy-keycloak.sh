#!/bin/bash

# Deploy Keycloak to Kubernetes

set -e

echo "Deploying Keycloak to Kubernetes..."

# Create namespace if it doesn't exist
kubectl create namespace security --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "Applying secrets..."
kubectl apply -f ../kubernetes/services/security/keycloak-secrets.yaml

# Apply theme ConfigMap
echo "Applying theme ConfigMap..."
kubectl apply -f ../kubernetes/services/security/keycloak-theme-configmap.yaml

# Deploy Keycloak using Helm
echo "Deploying Keycloak..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm upgrade --install keycloak bitnami/keycloak \
  --namespace security \
  --values ../helm/keycloak-values.yaml \
  --wait

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/keycloak -n security

# Apply Kong plugins for Keycloak integration
echo "Applying Kong plugins for Keycloak integration..."
kubectl apply -f ../kubernetes/services/api-gateway/kong-keycloak-plugin.yaml

# Apply Kong Ingress for Keycloak
echo "Applying Kong Ingress for Keycloak..."
kubectl apply -f ../kubernetes/services/api-gateway/kong-keycloak-ingress.yaml

echo "Keycloak deployed successfully!"
echo "Access Keycloak at: https://auth.example.com"
echo "Admin credentials can be retrieved with: kubectl get secret keycloak-admin-credentials -n security -o jsonpath='{.data.admin-password}' | base64 --decode"
