#!/bin/bash

# Setup ArgoCD for GitOps deployments

set -e

echo "Setting up ArgoCD..."

# Create ArgoCD namespace if it doesn't exist
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
echo "Installing ArgoCD..."
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --values argocd-values.yaml \
  --wait

# Wait for ArgoCD to be ready
echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get the ArgoCD admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD admin password: $ARGOCD_PASSWORD"

# Apply ArgoCD application manifests
echo "Applying ArgoCD application manifests..."
kubectl apply -f applications/ -n argocd

echo "ArgoCD setup completed successfully!"
echo "Access the ArgoCD UI at: https://argocd.example.com"
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"
