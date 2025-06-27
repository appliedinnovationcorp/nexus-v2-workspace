#!/bin/bash

# Import Kibana dashboards

set -e

echo "Importing Kibana dashboards..."

# Wait for Kibana to be ready
echo "Waiting for Kibana to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/kibana -n observability || true

# Port-forward Kibana
echo "Setting up port-forward to Kibana..."
kubectl port-forward svc/kibana-kibana 5601:5601 -n observability &
PF_PID=$!

# Wait for port-forward to be established
sleep 5

# Import dashboards
echo "Importing dashboards..."
curl -X POST "http://localhost:5601/api/saved_objects/_import" \
  -H "kbn-xsrf: true" \
  --form file=@kibana-dashboards.ndjson

# Kill port-forward
kill $PF_PID

echo "Dashboards imported successfully!"
