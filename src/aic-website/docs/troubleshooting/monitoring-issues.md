# Monitoring & Observability Issues Troubleshooting

## Prometheus Issues

### 1. Prometheus Not Collecting Metrics

#### Symptoms
- Missing metrics in Prometheus
- Targets showing as down
- Scrape errors in Prometheus logs

#### Diagnosis
```bash
# Check Prometheus status
kubectl get pods -n observability | grep prometheus

# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Check Prometheus configuration
kubectl get configmap prometheus-config -n observability -o yaml

# Check service discovery
kubectl get servicemonitor --all-namespaces
```

#### Solutions
```bash
# Restart Prometheus
kubectl rollout restart deployment/prometheus -n observability

# Reload Prometheus configuration
kubectl exec -it prometheus-0 -n observability -- curl -X POST http://localhost:9090/-/reload

# Check service monitor labels
kubectl get servicemonitor <name> -n <namespace> -o yaml

# Verify metrics endpoints
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/metrics
```

### 2. High Memory Usage in Prometheus

#### Symptoms
- Prometheus pod OOMKilled
- High memory consumption
- Slow query performance

#### Diagnosis
```bash
# Check Prometheus memory usage
kubectl top pod prometheus-0 -n observability

# Check retention settings
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/status/runtimeinfo

# Check series count
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/label/__name__/values | jq '. | length'

# Check storage usage
kubectl exec -it prometheus-0 -n observability -- df -h /prometheus
```

#### Solutions
```bash
# Increase memory limits
kubectl patch deployment prometheus -n observability -p '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","resources":{"limits":{"memory":"4Gi"}}}]}}}}'

# Reduce retention period
kubectl patch deployment prometheus -n observability -p '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","args":["--storage.tsdb.retention.time=7d"]}]}}}}'

# Increase storage
kubectl patch pvc prometheus-storage -n observability -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# Optimize scrape intervals
kubectl patch configmap prometheus-config -n observability --patch-file=scrape-optimization.yaml
```

### 3. Prometheus Query Performance Issues

#### Symptoms
- Slow dashboard loading
- Query timeouts
- High CPU usage during queries

#### Diagnosis
```bash
# Check query performance
kubectl exec -it prometheus-0 -n observability -- curl 'http://localhost:9090/api/v1/query?query=up' -w "@curl-format.txt"

# Check active queries
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/status/tsdb

# Monitor Prometheus metrics
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/metrics | grep prometheus_engine

# Check query logs
kubectl logs prometheus-0 -n observability | grep -i "query"
```

#### Solutions
```bash
# Optimize queries in dashboards
# Use recording rules for complex queries

# Create recording rules
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: observability
data:
  rules.yml: |
    groups:
    - name: aic.rules
      rules:
      - record: aic:request_rate
        expr: rate(http_requests_total[5m])
EOF

# Increase query timeout
kubectl patch deployment prometheus -n observability -p '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","args":["--query.timeout=2m"]}]}}}}'

# Add more CPU resources
kubectl patch deployment prometheus -n observability -p '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","resources":{"limits":{"cpu":"2000m"}}}]}}}}'
```

## Grafana Issues

### 1. Grafana Dashboards Not Loading

#### Symptoms
- Blank dashboards
- "No data" messages
- Dashboard loading errors

#### Diagnosis
```bash
# Check Grafana status
kubectl get pods -n observability | grep grafana

# Check Grafana logs
kubectl logs deployment/grafana -n observability

# Test data source connectivity
kubectl exec -it grafana-<pod> -n observability -- curl http://prometheus:9090/api/v1/query?query=up

# Check dashboard configuration
kubectl get configmap grafana-dashboards -n observability -o yaml
```

#### Solutions
```bash
# Restart Grafana
kubectl rollout restart deployment/grafana -n observability

# Update data source configuration
kubectl patch configmap grafana-datasources -n observability --patch-file=datasource-fix.yaml

# Reimport dashboards
kubectl delete configmap grafana-dashboards -n observability
kubectl apply -f grafana/dashboards/

# Check data source settings
kubectl exec -it grafana-<pod> -n observability -- curl -u admin:admin http://localhost:3000/api/datasources
```

### 2. Grafana Authentication Issues

#### Symptoms
- Cannot login to Grafana
- Authentication errors
- Session timeouts

#### Diagnosis
```bash
# Check Grafana authentication configuration
kubectl get configmap grafana-config -n observability -o yaml | grep -A 10 auth

# Check admin credentials
kubectl get secret grafana-admin -n observability -o yaml

# Check authentication logs
kubectl logs deployment/grafana -n observability | grep -i auth

# Test login
curl -X POST http://grafana:3000/login -d "user=admin&password=admin"
```

#### Solutions
```bash
# Reset admin password
kubectl exec -it grafana-<pod> -n observability -- grafana-cli admin reset-admin-password newpassword

# Update authentication configuration
kubectl patch configmap grafana-config -n observability --patch '{"data":{"grafana.ini":"[auth]\ndisable_login_form = false\n[auth.anonymous]\nenabled = false"}}'

# Create new admin user
kubectl exec -it grafana-<pod> -n observability -- grafana-cli admin create-user --name="admin2" --email="admin@aicorp.com" --login="admin2" --password="newpassword"

# Restart Grafana
kubectl rollout restart deployment/grafana -n observability
```

### 3. Grafana Performance Issues

#### Symptoms
- Slow dashboard rendering
- High memory usage
- Browser timeouts

#### Diagnosis
```bash
# Check Grafana resource usage
kubectl top pod -n observability | grep grafana

# Check dashboard complexity
kubectl exec -it grafana-<pod> -n observability -- curl -u admin:admin http://localhost:3000/api/dashboards/home

# Check query performance
kubectl logs deployment/grafana -n observability | grep -i "query.*took"

# Monitor Grafana metrics
kubectl exec -it grafana-<pod> -n observability -- curl http://localhost:3000/metrics
```

#### Solutions
```bash
# Increase Grafana resources
kubectl patch deployment grafana -n observability -p '{"spec":{"template":{"spec":{"containers":[{"name":"grafana","resources":{"limits":{"memory":"1Gi","cpu":"500m"}}}]}}}}'

# Optimize dashboard queries
# Reduce time ranges and increase intervals

# Enable query caching
kubectl patch configmap grafana-config -n observability --patch '{"data":{"grafana.ini":"[caching]\nenabled = true\nttl = 300"}}'

# Configure connection pooling
kubectl patch configmap grafana-config -n observability --patch '{"data":{"grafana.ini":"[database]\nmax_open_conn = 10\nmax_idle_conn = 5"}}'
```

## Logging Issues

### 1. Logs Not Appearing

#### Symptoms
- Missing application logs
- Log forwarding failures
- Empty log streams

#### Diagnosis
```bash
# Check log forwarding agents
kubectl get pods -n observability | grep -E "fluentd|fluent-bit|filebeat"

# Check application log output
kubectl logs deployment/<app-name> -n <namespace> --tail=10

# Check log forwarding configuration
kubectl get configmap fluentd-config -n observability -o yaml

# Test log pipeline
kubectl exec -it fluentd-<pod> -n observability -- curl http://localhost:24220/api/plugins.json
```

#### Solutions
```bash
# Restart log forwarding agents
kubectl rollout restart daemonset/fluentd -n observability

# Check log file permissions
kubectl exec -it <app-pod> -n <namespace> -- ls -la /var/log/

# Update log forwarding configuration
kubectl patch configmap fluentd-config -n observability --patch-file=logging-fix.yaml

# Verify log output format
kubectl logs deployment/<app-name> -n <namespace> | head -5 | jq .
```

### 2. Log Volume Issues

#### Symptoms
- Disk space full from logs
- Log rotation not working
- Performance impact from logging

#### Diagnosis
```bash
# Check log volume usage
kubectl exec -it <app-pod> -n <namespace> -- df -h /var/log

# Check log file sizes
kubectl exec -it <app-pod> -n <namespace> -- du -sh /var/log/*

# Check log rotation configuration
kubectl get configmap <app-config> -n <namespace> -o yaml | grep -A 10 logging

# Monitor log ingestion rate
kubectl exec -it fluentd-<pod> -n observability -- curl http://localhost:24220/api/plugins.json | jq '.plugins[] | select(.type=="in_tail")'
```

#### Solutions
```bash
# Configure log rotation
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"logging-config.json":"{\"rotation\":{\"maxSize\":\"100MB\",\"maxFiles\":5}}"}}'

# Reduce log verbosity
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"log-level":"warn"}}'

# Clean up old logs
kubectl exec -it <app-pod> -n <namespace> -- find /var/log -name "*.log.*" -mtime +7 -delete

# Increase log volume size
kubectl patch pvc log-storage -n <namespace> -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
```

### 3. Log Parsing Issues

#### Symptoms
- Malformed log entries
- Parsing errors in log aggregator
- Missing structured data

#### Diagnosis
```bash
# Check log format
kubectl logs deployment/<app-name> -n <namespace> --tail=5

# Check parsing configuration
kubectl get configmap fluentd-config -n observability -o yaml | grep -A 20 parser

# Test log parsing
kubectl exec -it fluentd-<pod> -n observability -- fluentd --dry-run -c /fluentd/etc/fluent.conf

# Check parsing errors
kubectl logs daemonset/fluentd -n observability | grep -i "parse.*error"
```

#### Solutions
```bash
# Fix log format in application
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"logging-config.json":"{\"format\":\"json\",\"timestamp\":true}"}}'

# Update log parsing rules
kubectl patch configmap fluentd-config -n observability --patch-file=parser-fix.yaml

# Test new parsing configuration
kubectl exec -it fluentd-<pod> -n observability -- fluentd --dry-run -c /fluentd/etc/fluent.conf

# Restart log forwarding
kubectl rollout restart daemonset/fluentd -n observability
```

## Alerting Issues

### 1. Alerts Not Firing

#### Symptoms
- No alert notifications
- Alert rules not triggering
- Missing alert conditions

#### Diagnosis
```bash
# Check Alertmanager status
kubectl get pods -n observability | grep alertmanager

# Check alert rules
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/rules

# Check active alerts
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/alerts

# Check Alertmanager configuration
kubectl get configmap alertmanager-config -n observability -o yaml
```

#### Solutions
```bash
# Restart Alertmanager
kubectl rollout restart deployment/alertmanager -n observability

# Update alert rules
kubectl apply -f monitoring/alert-rules.yaml

# Test alert conditions
kubectl exec -it prometheus-0 -n observability -- curl 'http://localhost:9090/api/v1/query?query=up{job="backend-api"} == 0'

# Reload Alertmanager configuration
kubectl exec -it alertmanager-0 -n observability -- curl -X POST http://localhost:9093/-/reload
```

### 2. Alert Notification Issues

#### Symptoms
- Alerts firing but no notifications
- Notification delivery failures
- Wrong notification channels

#### Diagnosis
```bash
# Check Alertmanager logs
kubectl logs deployment/alertmanager -n observability

# Check notification configuration
kubectl get configmap alertmanager-config -n observability -o yaml | grep -A 20 receivers

# Test notification channels
kubectl exec -it alertmanager-0 -n observability -- curl -X POST http://localhost:9093/api/v1/alerts

# Check webhook endpoints
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK -d '{"text":"test"}'
```

#### Solutions
```bash
# Update notification configuration
kubectl patch configmap alertmanager-config -n observability --patch-file=notification-fix.yaml

# Test Slack integration
kubectl exec -it alertmanager-0 -n observability -- curl -X POST -H 'Content-type: application/json' --data '{"text":"Test alert"}' https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Configure email notifications
kubectl patch configmap alertmanager-config -n observability --patch '{"data":{"alertmanager.yml":"global:\n  smtp_smarthost: smtp.gmail.com:587\n  smtp_from: alerts@aicorp.com"}}'

# Restart Alertmanager
kubectl rollout restart deployment/alertmanager -n observability
```

### 3. Alert Fatigue Issues

#### Symptoms
- Too many alerts
- Duplicate notifications
- Non-actionable alerts

#### Diagnosis
```bash
# Check alert frequency
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/alerts | jq '.data.alerts | length'

# Check alert grouping
kubectl get configmap alertmanager-config -n observability -o yaml | grep -A 10 group_by

# Analyze alert patterns
kubectl logs deployment/alertmanager -n observability | grep -c "firing"

# Check alert inhibition rules
kubectl get configmap alertmanager-config -n observability -o yaml | grep -A 10 inhibit_rules
```

#### Solutions
```bash
# Configure alert grouping
kubectl patch configmap alertmanager-config -n observability --patch '{"data":{"alertmanager.yml":"route:\n  group_by: [alertname, cluster, service]\n  group_wait: 30s\n  group_interval: 5m"}}'

# Add inhibition rules
kubectl patch configmap alertmanager-config -n observability --patch-file=inhibition-rules.yaml

# Adjust alert thresholds
kubectl patch configmap prometheus-rules -n observability --patch '{"data":{"rules.yml":"groups:\n- name: aic.rules\n  rules:\n  - alert: HighErrorRate\n    expr: rate(http_requests_total{status=~\"5..\"}[5m]) > 0.1\n    for: 5m"}}'

# Configure alert silencing
kubectl exec -it alertmanager-0 -n observability -- curl -X POST http://localhost:9093/api/v1/silences -d '{"matchers":[{"name":"alertname","value":"HighMemoryUsage"}],"startsAt":"2024-01-01T00:00:00Z","endsAt":"2024-01-02T00:00:00Z","comment":"Maintenance window"}'
```

## Tracing Issues

### 1. Distributed Tracing Not Working

#### Symptoms
- Missing trace data
- Incomplete trace spans
- Jaeger UI showing no traces

#### Diagnosis
```bash
# Check Jaeger status
kubectl get pods -n observability | grep jaeger

# Check trace collection
kubectl exec -it jaeger-collector-<pod> -n observability -- curl http://localhost:14269/

# Check application tracing configuration
kubectl get configmap <app-config> -n <namespace> -o yaml | grep -A 10 tracing

# Test trace generation
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/api/v1/test
```

#### Solutions
```bash
# Restart Jaeger components
kubectl rollout restart deployment/jaeger-collector -n observability
kubectl rollout restart deployment/jaeger-query -n observability

# Update tracing configuration
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"tracing-config.json":"{\"enabled\":true,\"jaegerEndpoint\":\"http://jaeger-collector:14268/api/traces\",\"sampleRate\":0.1}"}}'

# Check trace sampling
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"tracing-config.json":"{\"sampleRate\":1.0}"}}'

# Restart applications
kubectl rollout restart deployment/<app-name> -n <namespace>
```

### 2. High Trace Volume Issues

#### Symptoms
- Jaeger storage full
- High memory usage in Jaeger
- Trace data loss

#### Diagnosis
```bash
# Check Jaeger storage usage
kubectl exec -it jaeger-collector-<pod> -n observability -- df -h

# Check trace ingestion rate
kubectl exec -it jaeger-collector-<pod> -n observability -- curl http://localhost:14269/metrics | grep jaeger_collector

# Check sampling configuration
kubectl get configmap jaeger-config -n observability -o yaml | grep -A 10 sampling

# Monitor trace volume
kubectl logs deployment/jaeger-collector -n observability | grep -c "trace"
```

#### Solutions
```bash
# Reduce sampling rate
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"tracing-config.json":"{\"sampleRate\":0.01}"}}'

# Configure adaptive sampling
kubectl patch configmap jaeger-config -n observability --patch '{"data":{"sampling.json":"{\"default_strategy\":{\"type\":\"adaptive\",\"max_traces_per_second\":100}}"}}'

# Increase Jaeger storage
kubectl patch pvc jaeger-storage -n observability -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# Configure trace retention
kubectl patch deployment jaeger-collector -n observability -p '{"spec":{"template":{"spec":{"containers":[{"name":"jaeger-collector","env":[{"name":"SPAN_STORAGE_TYPE","value":"elasticsearch"},{"name":"ES_TAGS_AS_FIELDS_ALL","value":"true"}]}]}}}}'
```

## Performance Monitoring Issues

### 1. Missing Performance Metrics

#### Symptoms
- No application performance data
- Missing custom metrics
- Incomplete performance dashboards

#### Diagnosis
```bash
# Check metrics endpoints
kubectl exec -it <app-pod> -n <namespace> -- curl http://localhost:8080/metrics

# Check custom metrics registration
kubectl logs deployment/<app-name> -n <namespace> | grep -i metric

# Check Prometheus scraping
kubectl exec -it prometheus-0 -n observability -- curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="<app-name>")'

# Verify service monitor
kubectl get servicemonitor <app-name> -n <namespace> -o yaml
```

#### Solutions
```bash
# Enable metrics in application
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"metrics-config.json":"{\"enabled\":true,\"port\":8080,\"path\":\"/metrics\"}"}}'

# Create service monitor
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: <app-name>
  namespace: <namespace>
spec:
  selector:
    matchLabels:
      app: <app-name>
  endpoints:
  - port: metrics
    path: /metrics
EOF

# Restart application
kubectl rollout restart deployment/<app-name> -n <namespace>

# Verify metrics collection
kubectl exec -it prometheus-0 -n observability -- curl 'http://localhost:9090/api/v1/query?query=up{job="<app-name>"}'
```

### 2. Performance Degradation Detection

#### Symptoms
- Slow response times not detected
- Missing SLA monitoring
- No performance alerts

#### Diagnosis
```bash
# Check response time metrics
kubectl exec -it prometheus-0 -n observability -- curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'

# Check SLA metrics
kubectl exec -it prometheus-0 -n observability -- curl 'http://localhost:9090/api/v1/query?query=rate(http_requests_total{status!~"5.."}[5m]) / rate(http_requests_total[5m])'

# Check performance alert rules
kubectl get prometheusrule -n observability -o yaml | grep -A 10 performance

# Monitor current performance
kubectl exec -it <app-pod> -n <namespace> -- curl -w "@curl-format.txt" http://localhost:8080/api/v1/health
```

#### Solutions
```bash
# Create performance alert rules
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: performance-alerts
  namespace: observability
spec:
  groups:
  - name: performance
    rules:
    - alert: HighLatency
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: High latency detected
EOF

# Create SLA monitoring
kubectl apply -f monitoring/sla-rules.yaml

# Configure performance dashboards
kubectl apply -f grafana/performance-dashboard.yaml

# Enable detailed metrics
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"metrics-config.json":"{\"detailed\":true,\"histograms\":true}"}}'
```

---

**Next**: [Deployment Issues](./deployment-issues.md)
