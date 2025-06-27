#!/bin/bash

# Start the local development environment
echo "Starting AIC API Gateway with Kong and Kuma..."

# Create directories if they don't exist
mkdir -p logs

# Start the Docker Compose environment
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if Kong is running
if curl -s http://localhost:8001/status > /dev/null; then
  echo "✅ Kong API Gateway is running"
else
  echo "❌ Kong API Gateway is not running"
fi

# Check if Kuma is running
if curl -s http://localhost:5681/status > /dev/null; then
  echo "✅ Kuma Service Mesh is running"
else
  echo "❌ Kuma Service Mesh is not running"
fi

echo ""
echo "API Gateway is available at: http://localhost:8000"
echo "Kong Admin API is available at: http://localhost:8001"
echo "Kong Admin UI is available at: http://localhost:8002"
echo "Kuma Control Plane UI is available at: http://localhost:5681/gui"
echo "Prometheus is available at: http://localhost:9090"
echo "Grafana is available at: http://localhost:3000 (admin/admin)"
echo "Zipkin is available at: http://localhost:9411"
echo ""
echo "Mock Backend Service is available at: http://localhost:4001"
echo "Mock AI Services are available at: http://localhost:4002"
echo ""
