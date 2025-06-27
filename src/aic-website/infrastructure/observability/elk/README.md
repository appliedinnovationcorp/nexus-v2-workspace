# ELK Stack for AIC Website

This directory contains the configuration for the ELK (Elasticsearch, Logstash, Kibana) Stack, which is used for centralized logging in the AIC Website infrastructure.

## Overview

The ELK Stack provides a powerful logging solution that allows for the collection, processing, storage, and visualization of logs from all components of the MACH architecture.

## Components

1. **Elasticsearch**: Distributed search and analytics engine
2. **Logstash**: Server-side data processing pipeline
3. **Kibana**: Visualization and exploration interface
4. **Filebeat**: Lightweight log shipper for forwarding logs

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Kubernetes │    │    Kafka    │    │             │    │             │
│  Pod Logs   │───▶│  (Optional) │───▶│  Logstash   │───▶│Elasticsearch│
└─────────────┘    └─────────────┘    │             │    │             │
                                      └─────────────┘    └─────────────┘
┌─────────────┐                                                 │
│  Filebeat   │─────────────────────────────────────────────────┘
└─────────────┘                                                 │
                                                                ▼
                                                         ┌─────────────┐
                                                         │   Kibana    │
                                                         └─────────────┘
```

## Deployment

To deploy the ELK Stack:

```bash
./deploy-elk.sh
```

This script will:
1. Create the necessary namespace
2. Apply secrets and configmaps
3. Deploy Elasticsearch, Kibana, and Logstash using Helm
4. Deploy Filebeat as a DaemonSet for log collection

## Configuration

### Elasticsearch

Elasticsearch is configured with:
- 3 nodes for high availability
- Persistent storage using Longhorn
- Security features enabled (TLS, authentication)
- Prometheus metrics integration
- Resource limits and requests

### Kibana

Kibana is configured with:
- 2 replicas for high availability
- Integration with Elasticsearch
- Security features enabled
- Ingress for external access
- Prometheus metrics integration

### Logstash

Logstash is configured with:
- Multiple input plugins (HTTP, TCP, Beats, Kafka)
- Custom filtering and processing logic
- Output to Elasticsearch
- Persistent queue for reliability
- Custom patterns for log parsing

### Filebeat

Filebeat is deployed as a DaemonSet to collect logs from all Kubernetes nodes and forward them to Logstash.

## Integration Points

### Integration with Prometheus/Grafana

All ELK components expose Prometheus metrics that are collected by the Prometheus server and visualized in Grafana dashboards.

### Integration with Service Mesh

Kuma service mesh is configured to send logs to the ELK Stack for centralized logging and analysis.

### Integration with API Gateway

Kong API Gateway is configured to send access logs to the ELK Stack for monitoring and troubleshooting.

## Log Retention and Lifecycle Management

Elasticsearch is configured with index lifecycle management (ILM) policies to:
- Roll over indices when they reach a certain size or age
- Move older indices to less expensive storage
- Delete indices after a defined retention period

## Security

The ELK Stack is secured with:
- TLS encryption for all communications
- Authentication for all components
- Role-based access control
- Network policies to restrict access

## Monitoring

The health and performance of the ELK Stack can be monitored through:
- Prometheus metrics
- Kibana monitoring dashboards
- Elasticsearch cluster health API

## Troubleshooting

Common issues and solutions:

1. **Elasticsearch cluster yellow/red status**:
   - Check node health: `kubectl exec -it elasticsearch-master-0 -n observability -- curl -XGET 'localhost:9200/_cluster/health?pretty'`
   - Check disk space: `kubectl exec -it elasticsearch-master-0 -n observability -- df -h`

2. **Logstash not receiving logs**:
   - Check Logstash status: `kubectl logs -f deployment/logstash -n observability`
   - Verify network policies allow traffic

3. **Kibana not connecting to Elasticsearch**:
   - Check Kibana logs: `kubectl logs -f deployment/kibana -n observability`
   - Verify Elasticsearch credentials

## References

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Elastic Helm Charts](https://github.com/elastic/helm-charts)
