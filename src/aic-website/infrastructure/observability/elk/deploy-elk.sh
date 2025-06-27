#!/bin/bash

# Deploy ELK Stack using Helm

set -e

echo "Deploying ELK Stack..."

# Create namespace if it doesn't exist
kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets and configmaps
echo "Applying secrets and configmaps..."
kubectl apply -f ../../kubernetes/services/observability/elk-secrets.yaml
kubectl apply -f ../../kubernetes/services/observability/logstash-patterns-configmap.yaml

# Deploy Elasticsearch
echo "Deploying Elasticsearch..."
helm repo add elastic https://helm.elastic.co
helm repo update
helm upgrade --install elasticsearch elastic/elasticsearch \
  --namespace observability \
  --values ../../helm/elasticsearch-values.yaml \
  --wait

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/elasticsearch-master -n observability || true

# Deploy Kibana
echo "Deploying Kibana..."
helm upgrade --install kibana elastic/kibana \
  --namespace observability \
  --values ../../helm/kibana-values.yaml \
  --wait

# Deploy Logstash
echo "Deploying Logstash..."
helm upgrade --install logstash elastic/logstash \
  --namespace observability \
  --values ../../helm/logstash-values.yaml \
  --wait

# Deploy Filebeat (optional)
echo "Deploying Filebeat..."
helm upgrade --install filebeat elastic/filebeat \
  --namespace observability \
  --set filebeatConfig.filebeat\\.yml="
filebeat.inputs:
- type: container
  paths:
    - /var/log/containers/*.log
  processors:
    - add_kubernetes_metadata:
        host: \${NODE_NAME}
        matchers:
        - logs_path:
            logs_path: \"/var/log/containers/\"

output.logstash:
  hosts: [\"logstash:5044\"]
" \
  --set daemonset.enabled=true \
  --wait

echo "ELK Stack deployed successfully!"
echo "Kibana URL: https://kibana.example.com"
echo "Elasticsearch URL: https://elasticsearch.example.com"
