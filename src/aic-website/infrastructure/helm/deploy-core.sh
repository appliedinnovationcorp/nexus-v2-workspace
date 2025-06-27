#!/bin/bash

# Deploy core components using Helm

set -e

echo "Deploying core components..."

# Add Helm repositories
echo "Adding Helm repositories..."
helm repo add kong https://charts.konghq.com
helm repo add kuma https://kumahq.github.io/charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add elastic https://helm.elastic.co
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add jetstack https://charts.jetstack.io
helm repo add longhorn https://charts.longhorn.io
helm repo add minio https://helm.min.io/
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

# Create namespaces if they don't exist
kubectl apply -f ../kubernetes/namespaces.yaml

# Deploy cert-manager first (as other components may depend on it)
echo "Deploying cert-manager..."
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace security \
  --values cert-manager-values.yaml \
  --set installCRDs=true \
  --wait

# Apply ClusterIssuers after cert-manager is ready
echo "Applying cert-manager ClusterIssuers..."
kubectl apply -f ../security/cert-manager/cluster-issuers.yaml

# Deploy Kong API Gateway
echo "Deploying Kong API Gateway..."
helm upgrade --install kong kong/kong \
  --namespace api-gateway \
  --values kong-values.yaml \
  --wait

# Deploy Kuma Service Mesh
echo "Deploying Kuma Service Mesh..."
helm upgrade --install kuma kuma/kuma \
  --namespace api-gateway \
  --values kuma-values.yaml \
  --wait

# Deploy Prometheus and Grafana
echo "Deploying Prometheus and Grafana..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace observability \
  --values prometheus-values.yaml \
  --wait

# Deploy ELK Stack
echo "Deploying ELK Stack..."
helm upgrade --install elasticsearch elastic/elasticsearch \
  --namespace observability \
  --values elasticsearch-values.yaml \
  --wait

helm upgrade --install kibana elastic/kibana \
  --namespace observability \
  --values kibana-values.yaml \
  --wait

helm upgrade --install logstash elastic/logstash \
  --namespace observability \
  --values logstash-values.yaml \
  --wait

# Deploy Jaeger
echo "Deploying Jaeger..."
helm upgrade --install jaeger jaegertracing/jaeger \
  --namespace observability \
  --values jaeger-values.yaml \
  --wait

# Deploy HashiCorp Vault
echo "Deploying HashiCorp Vault..."
helm upgrade --install vault hashicorp/vault \
  --namespace security \
  --values vault-values.yaml \
  --wait

# Deploy Keycloak
echo "Deploying Keycloak..."
helm upgrade --install keycloak bitnami/keycloak \
  --namespace security \
  --values keycloak-values.yaml \
  --wait

# Deploy cert-manager
echo "Deploying cert-manager..."
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace security \
  --values cert-manager-values.yaml \
  --set installCRDs=true \
  --wait

# Apply ClusterIssuers after cert-manager is ready
echo "Applying cert-manager ClusterIssuers..."
kubectl apply -f ../security/cert-manager/cluster-issuers.yaml

# Deploy Kafka
echo "Deploying Kafka..."
helm upgrade --install kafka bitnami/kafka \
  --namespace messaging \
  --values kafka-values.yaml \
  --wait

# Deploy Longhorn
echo "Deploying Longhorn..."
helm upgrade --install longhorn longhorn/longhorn \
  --namespace storage \
  --values longhorn-values.yaml \
  --wait

# Deploy MinIO
echo "Deploying MinIO..."
helm upgrade --install minio minio/minio \
  --namespace storage \
  --values minio-values.yaml \
  --wait

# Deploy ArgoCD
echo "Deploying ArgoCD..."
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --values argocd-values.yaml \
  --wait

echo "Core components deployed successfully!"
