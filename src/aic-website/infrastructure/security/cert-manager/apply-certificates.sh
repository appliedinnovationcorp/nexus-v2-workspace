#!/bin/bash

# Apply certificate resources

set -e

echo "Applying certificate resources..."

# Apply API Gateway certificate
kubectl apply -f api-gateway-certificate.yaml

# Apply Ingress resources with cert-manager annotations
kubectl apply -f ../../kubernetes/services/api-gateway/api-gateway-ingress.yaml
kubectl apply -f ../../kubernetes/services/cms/ghost-ingress.yaml

# Check certificate status
echo "Checking certificate status..."
kubectl get certificates --all-namespaces

echo "Certificate resources applied successfully!"
