#!/bin/bash

# Integrate ELK Stack with other components

set -e

echo "Integrating ELK Stack with other components..."

# Create Kong plugin for logging to ELK
echo "Creating Kong plugin for logging to ELK..."
cat <<EOF | kubectl apply -f -
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: http-log-elk
  namespace: api-gateway
plugin: http-log
config:
  http_endpoint: http://logstash.observability:8080
  method: POST
  timeout: 10000
  keepalive: 60000
  flush_timeout: 2
  retry_count: 5
EOF

# Apply the plugin to Kong Ingress
echo "Applying the plugin to Kong Ingress..."
kubectl patch ingress -n api-gateway api-gateway -p '{"metadata":{"annotations":{"konghq.com/plugins":"http-log-elk"}}}'

# Configure Kuma to send logs to ELK
echo "Configuring Kuma to send logs to ELK..."
cat <<EOF | kubectl apply -f -
apiVersion: kuma.io/v1alpha1
kind: TrafficLog
metadata:
  name: all-traffic
  namespace: api-gateway
mesh: default
spec:
  sources:
    - match:
        kuma.io/service: "*"
  destinations:
    - match:
        kuma.io/service: "*"
  conf:
    backend: elasticsearch
    elasticsearch:
      address: aic-elasticsearch-master.observability:9200
      index: kuma-traffic-%{@timestamp:yyyy.MM.dd}
      auth:
        user: logstash_writer
        password: ${ELASTICSEARCH_PASSWORD}
EOF

# Create Prometheus ServiceMonitor for ELK components
echo "Creating Prometheus ServiceMonitor for ELK components..."
cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: elasticsearch
  namespace: observability
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: elasticsearch-master
  namespaceSelector:
    matchNames:
      - observability
  endpoints:
    - port: http
      path: /metrics
      interval: 10s
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kibana
  namespace: observability
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: kibana
  namespaceSelector:
    matchNames:
      - observability
  endpoints:
    - port: http
      path: /metrics
      interval: 10s
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: logstash
  namespace: observability
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: logstash
  namespaceSelector:
    matchNames:
      - observability
  endpoints:
    - port: monitoring
      path: /metrics
      interval: 10s
EOF

# Create Grafana dashboard for ELK monitoring
echo "Creating Grafana dashboard for ELK monitoring..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: elk-monitoring-dashboard
  namespace: observability
  labels:
    grafana_dashboard: "true"
data:
  elk-monitoring.json: |
    {
      "annotations": {
        "list": [
          {
            "builtIn": 1,
            "datasource": "-- Grafana --",
            "enable": true,
            "hide": true,
            "iconColor": "rgba(0, 211, 255, 1)",
            "name": "Annotations & Alerts",
            "type": "dashboard"
          }
        ]
      },
      "editable": true,
      "gnetId": null,
      "graphTooltip": 0,
      "id": 1,
      "links": [],
      "panels": [
        {
          "aliasColors": {},
          "bars": false,
          "dashLength": 10,
          "dashes": false,
          "datasource": "Prometheus",
          "fieldConfig": {
            "defaults": {
              "custom": {}
            },
            "overrides": []
          },
          "fill": 1,
          "fillGradient": 0,
          "gridPos": {
            "h": 8,
            "w": 12,
            "x": 0,
            "y": 0
          },
          "hiddenSeries": false,
          "id": 2,
          "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
          },
          "lines": true,
          "linewidth": 1,
          "nullPointMode": "null",
          "options": {
            "alertThreshold": true
          },
          "percentage": false,
          "pluginVersion": "7.2.0",
          "pointradius": 2,
          "points": false,
          "renderer": "flot",
          "seriesOverrides": [],
          "spaceLength": 10,
          "stack": false,
          "steppedLine": false,
          "targets": [
            {
              "expr": "elasticsearch_cluster_health_status{color=~\"green|yellow|red\"}",
              "interval": "",
              "legendFormat": "Cluster Health",
              "refId": "A"
            }
          ],
          "thresholds": [],
          "timeFrom": null,
          "timeRegions": [],
          "timeShift": null,
          "title": "Elasticsearch Cluster Health",
          "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
          },
          "type": "graph",
          "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
          },
          "yaxes": [
            {
              "format": "short",
              "label": null,
              "logBase": 1,
              "max": null,
              "min": null,
              "show": true
            },
            {
              "format": "short",
              "label": null,
              "logBase": 1,
              "max": null,
              "min": null,
              "show": true
            }
          ],
          "yaxis": {
            "align": false,
            "alignLevel": null
          }
        }
      ],
      "schemaVersion": 26,
      "style": "dark",
      "tags": [],
      "templating": {
        "list": []
      },
      "time": {
        "from": "now-6h",
        "to": "now"
      },
      "timepicker": {},
      "timezone": "",
      "title": "ELK Stack Monitoring",
      "uid": "elk-monitoring",
      "version": 1
    }
EOF

echo "ELK Stack integration completed successfully!"
