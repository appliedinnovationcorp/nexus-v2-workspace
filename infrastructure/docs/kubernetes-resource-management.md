# Kubernetes Resource Management Guide

This guide outlines the best practices and configurations for managing Kubernetes resources in the AIC Enterprise Platform.

## Table of Contents

1. [Overview](#overview)
2. [Resource Requests and Limits](#resource-requests-and-limits)
3. [Namespace Resource Quotas](#namespace-resource-quotas)
4. [Limit Ranges](#limit-ranges)
5. [Horizontal Pod Autoscaling](#horizontal-pod-autoscaling)
6. [Vertical Pod Autoscaling](#vertical-pod-autoscaling)
7. [Pod Disruption Budgets](#pod-disruption-budgets)
8. [Node Affinity and Anti-Affinity](#node-affinity-and-anti-affinity)
9. [Resource Monitoring](#resource-monitoring)
10. [Best Practices](#best-practices)

## Overview

Proper resource management in Kubernetes is essential for ensuring application stability, efficient resource utilization, and cost optimization. This guide covers the comprehensive resource management strategy implemented for the AIC Enterprise Platform.

## Resource Requests and Limits

Resource requests and limits are specified for all containers to ensure proper scheduling and resource allocation.

### CPU and Memory

```yaml
resources:
  requests:
    cpu: "500m"        # 0.5 CPU cores
    memory: "1Gi"      # 1 Gibibyte of memory
  limits:
    cpu: "2"           # 2 CPU cores
    memory: "4Gi"      # 4 Gibibytes of memory
```

### Ephemeral Storage

```yaml
resources:
  requests:
    ephemeral-storage: "1Gi"    # 1 Gibibyte of ephemeral storage
  limits:
    ephemeral-storage: "5Gi"    # 5 Gibibytes of ephemeral storage
```

### Guidelines for Setting Resources

#### CPU Requests

- **Web/API Services**: 100m-500m (depending on traffic)
- **Background Workers**: 200m-1000m (depending on workload)
- **Databases**: 1000m-4000m (depending on size and load)
- **Caching Services**: 500m-2000m (depending on size and load)

#### Memory Requests

- **Web/API Services**: 256Mi-1Gi (depending on traffic)
- **Background Workers**: 512Mi-2Gi (depending on workload)
- **Databases**: 2Gi-8Gi (depending on size and load)
- **Caching Services**: 1Gi-4Gi (depending on size and load)

#### Setting Limits

- CPU limits should be 2-4x the request
- Memory limits should be 1.5-2x the request
- Ephemeral storage limits should be 3-5x the request

## Namespace Resource Quotas

Resource quotas are applied at the namespace level to prevent resource exhaustion and ensure fair resource allocation.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: aic-platform-quota
  namespace: aic-platform
spec:
  hard:
    # Compute Resources
    requests.cpu: "50"
    requests.memory: 100Gi
    limits.cpu: "100"
    limits.memory: 200Gi
    
    # Storage Resources
    requests.storage: 500Gi
    persistentvolumeclaims: "20"
    
    # Object Count Limits
    pods: "100"
    services: "20"
    services.loadbalancers: "5"
    services.nodeports: "10"
    secrets: "50"
    configmaps: "50"
```

### Environment-Specific Quotas

#### Production

```yaml
requests.cpu: "50"
requests.memory: 100Gi
limits.cpu: "100"
limits.memory: 200Gi
```

#### Staging

```yaml
requests.cpu: "25"
requests.memory: 50Gi
limits.cpu: "50"
limits.memory: 100Gi
```

#### Development

```yaml
requests.cpu: "10"
requests.memory: 20Gi
limits.cpu: "20"
limits.memory: 40Gi
```

## Limit Ranges

Limit ranges define default resource constraints for containers in a namespace.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: aic-platform-limits
  namespace: aic-platform
spec:
  limits:
  - default:
      cpu: "1"
      memory: "2Gi"
    defaultRequest:
      cpu: "100m"
      memory: "256Mi"
    type: Container
  - default:
      storage: "10Gi"
    type: PersistentVolumeClaim
```

### Benefits of Limit Ranges

- Ensures all containers have resource constraints
- Prevents unbounded resource consumption
- Provides sensible defaults for developers
- Simplifies resource management

## Horizontal Pod Autoscaling

Horizontal Pod Autoscaling (HPA) automatically scales the number of pod replicas based on observed metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aic-website-hpa
  namespace: aic-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aic-website
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### Custom Metrics

For more advanced scaling scenarios, we use custom metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aic-api-hpa
  namespace: aic-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aic-api
  minReplicas: 3
  maxReplicas: 30
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: 100
  - type: Object
    object:
      metric:
        name: queue_length
      describedObject:
        apiVersion: apps/v1
        kind: Deployment
        name: aic-queue-processor
      target:
        type: Value
        value: 10
```

## Vertical Pod Autoscaling

Vertical Pod Autoscaling (VPA) automatically adjusts the CPU and memory requests and limits for containers.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: aic-website-vpa
  namespace: aic-platform
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aic-website
  updatePolicy:
    updateMode: Auto
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        cpu: 100m
        memory: 256Mi
      maxAllowed:
        cpu: 4
        memory: 8Gi
      controlledResources: ["cpu", "memory"]
```

### VPA Modes

- **Auto**: Automatically applies recommendations
- **Initial**: Only applies recommendations at pod creation
- **Off**: Only generates recommendations without applying them

## Pod Disruption Budgets

Pod Disruption Budgets (PDBs) ensure high availability during voluntary disruptions.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: aic-website-pdb
  namespace: aic-platform
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: aic-website
```

### Alternative Configuration

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: aic-database-pdb
  namespace: aic-platform
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: postgresql
```

### PDB Guidelines

- Use `minAvailable` for critical services
- Use `maxUnavailable` for stateful applications
- Set appropriate values based on total replicas
- Consider the impact of node maintenance

## Node Affinity and Anti-Affinity

Node affinity and anti-affinity rules ensure proper pod placement across nodes.

### Node Affinity

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: node-type
          operator: In
          values:
          - compute-optimized
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      preference:
        matchExpressions:
        - key: failure-domain.beta.kubernetes.io/zone
          operator: In
          values:
          - us-east-1a
          - us-east-1b
```

### Pod Anti-Affinity

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - aic-website
      topologyKey: kubernetes.io/hostname
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - aic-website
        topologyKey: failure-domain.beta.kubernetes.io/zone
```

## Resource Monitoring

Effective resource monitoring is essential for proper resource management.

### Prometheus Metrics

Key metrics to monitor:

- **CPU Usage**: `container_cpu_usage_seconds_total`
- **Memory Usage**: `container_memory_usage_bytes`
- **Disk Usage**: `container_fs_usage_bytes`
- **Network Traffic**: `container_network_receive_bytes_total`, `container_network_transmit_bytes_total`

### Resource Dashboards

Grafana dashboards for resource monitoring:

- Cluster Overview Dashboard
- Node Resource Usage Dashboard
- Pod Resource Usage Dashboard
- Namespace Resource Quota Dashboard

### Resource Alerts

Important resource alerts:

- High CPU Usage (>80% for 15 minutes)
- High Memory Usage (>85% for 10 minutes)
- Disk Space Running Low (<10% free)
- Resource Quota Approaching (>85% used)
- Pod Restarts (>5 in 1 hour)

## Best Practices

### Resource Allocation

1. **Start Conservative**: Begin with conservative resource requests and adjust based on actual usage
2. **Monitor Actual Usage**: Use monitoring tools to track actual resource usage
3. **Adjust Gradually**: Increase or decrease resource requests gradually
4. **Consider Workload Patterns**: Account for daily, weekly, and seasonal patterns

### Efficiency Optimization

1. **Right-size Resources**: Avoid over-provisioning resources
2. **Use Autoscaling**: Implement HPA and VPA for dynamic resource allocation
3. **Implement Pod Disruption Budgets**: Ensure high availability during disruptions
4. **Use Node Affinity**: Place pods on appropriate nodes based on workload requirements

### Cost Optimization

1. **Use Resource Quotas**: Prevent resource hogging by setting namespace quotas
2. **Implement Cost Allocation**: Use labels and namespaces for cost attribution
3. **Optimize Node Pools**: Use appropriate instance types for different workloads
4. **Consider Spot Instances**: Use spot instances for non-critical workloads

### Monitoring and Maintenance

1. **Regular Auditing**: Periodically review resource allocation and usage
2. **Implement Alerts**: Set up alerts for resource-related issues
3. **Document Resource Requirements**: Maintain documentation of resource requirements for each service
4. **Test Scaling**: Regularly test scaling capabilities with load testing

## Conclusion

Proper Kubernetes resource management is critical for the stability, efficiency, and cost-effectiveness of the AIC Enterprise Platform. By implementing the strategies outlined in this guide, we ensure optimal resource utilization while maintaining high availability and performance.
