# Quick Reference Troubleshooting Cheat Sheet

## Emergency Commands

### Immediate Health Check
```bash
# Run automated health check
./scripts/troubleshoot.sh check

# Quick system overview
kubectl get pods --all-namespaces | grep -v Running
kubectl get nodes
kubectl cluster-info
```

### Service Recovery
```bash
# Restart all services
kubectl rollout restart deployment --all -n <namespace>

# Force pod recreation
kubectl delete pod -l app=<app-name> -n <namespace>

# Scale to zero and back
kubectl scale deployment <name> --replicas=0 -n <namespace>
kubectl scale deployment <name> --replicas=3 -n <namespace>
```

### Database Emergency
```bash
# PostgreSQL
kubectl exec -it postgresql-0 -n storage -- pg_isready
kubectl rollout restart statefulset/postgresql -n storage

# Redis
kubectl exec -it redis-0 -n storage -- redis-cli ping
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHALL

# MongoDB
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.adminCommand('ping')"
kubectl rollout restart statefulset/mongodb -n storage
```

## Common Issues Quick Fixes

### Pod Issues
| Issue | Command |
|-------|---------|
| Pod stuck in Pending | `kubectl describe pod <pod-name> -n <namespace>` |
| ImagePullBackOff | `kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'` |
| CrashLoopBackOff | `kubectl logs <pod-name> -n <namespace> --previous` |
| Out of Memory | `kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"2Gi"}}}]}}}}'` |

### Service Issues
| Issue | Command |
|-------|---------|
| Service not accessible | `kubectl get endpoints <service-name> -n <namespace>` |
| DNS not resolving | `kubectl exec -it <pod-name> -n <namespace> -- nslookup <service-name>` |
| Load balancer issues | `kubectl get ingress <ingress-name> -n <namespace>` |
| Port conflicts | `kubectl get service <service-name> -n <namespace> -o yaml` |

### Configuration Issues
| Issue | Command |
|-------|---------|
| ConfigMap not found | `kubectl apply -f infrastructure/kubernetes/config/` |
| Secret missing | `kubectl create secret generic <name> --from-literal=key=value -n <namespace>` |
| Environment variables | `kubectl exec -it <pod-name> -n <namespace> -- env \| grep <VAR>` |
| Config validation | `./scripts/config-management.sh validate` |

### AI Services Issues
| Issue | Command |
|-------|---------|
| OpenAI connectivity | `kubectl exec -it <ai-pod> -n ai-services -- curl https://api.openai.com` |
| Model loading | `kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/models/status` |
| Rate limiting | `kubectl logs deployment/ai-services -n ai-services \| grep -i rate` |
| Cost tracking | `kubectl exec -it <ai-pod> -n ai-services -- curl http://localhost:8080/cost/status` |

## Diagnostic Commands

### System Information
```bash
# Cluster overview
kubectl cluster-info
kubectl get nodes -o wide
kubectl get pods --all-namespaces -o wide

# Resource usage
kubectl top nodes
kubectl top pods --all-namespaces --sort-by=memory

# Events
kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp
```

### Service Health
```bash
# Check specific service
kubectl get deployment <name> -n <namespace>
kubectl describe deployment <name> -n <namespace>
kubectl logs deployment/<name> -n <namespace> --tail=50

# Test connectivity
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/health
kubectl exec -it <pod-name> -n <namespace> -- curl http://<service-name>.<namespace>:80
```

### Database Health
```bash
# PostgreSQL
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT count(*) FROM pg_stat_activity;"
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;"

# Redis
kubectl exec -it redis-0 -n storage -- redis-cli INFO memory
kubectl exec -it redis-0 -n storage -- redis-cli INFO stats

# MongoDB
kubectl exec -it mongodb-0 -n storage -- mongo --eval "db.serverStatus()"
kubectl exec -it mongodb-0 -n storage -- mongo --eval "rs.status()"
```

## Monitoring Commands

### Prometheus
```bash
# Check targets
curl http://prometheus:9090/api/v1/targets

# Query metrics
curl 'http://prometheus:9090/api/v1/query?query=up'

# Check configuration
kubectl get configmap prometheus-config -n observability -o yaml
```

### Grafana
```bash
# Check data sources
kubectl exec -it grafana-<pod> -n observability -- curl -u admin:admin http://localhost:3000/api/datasources

# Test connectivity
kubectl exec -it grafana-<pod> -n observability -- curl http://prometheus:9090/api/v1/query?query=up
```

### Logs
```bash
# Application logs
kubectl logs deployment/<name> -n <namespace> --tail=100 -f

# System logs
kubectl logs -n kube-system -l component=kube-apiserver

# Log forwarding
kubectl logs daemonset/fluentd -n observability
```

## Performance Troubleshooting

### High CPU/Memory
```bash
# Check resource usage
kubectl top pods -n <namespace>
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 Limits

# Scale up
kubectl scale deployment <name> --replicas=5 -n <namespace>

# Increase resources
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"cpu":"1000m","memory":"2Gi"}}}]}}}}'
```

### Slow Responses
```bash
# Check latency
kubectl exec -it <pod-name> -n <namespace> -- curl -w "@curl-format.txt" http://localhost:8080/api/endpoint

# Check database performance
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check cache hit rates
kubectl exec -it redis-0 -n storage -- redis-cli INFO stats | grep hit_rate
```

## Security Checks

### RBAC
```bash
# Check permissions
kubectl auth can-i --list
kubectl auth can-i create pods --as=system:serviceaccount:<namespace>:<sa-name>

# Check service accounts
kubectl get serviceaccount -n <namespace>
kubectl describe serviceaccount <sa-name> -n <namespace>
```

### Network Security
```bash
# Check network policies
kubectl get networkpolicy --all-namespaces

# Test connectivity
kubectl exec -it <pod-name> -n <namespace> -- nc -zv <target-ip> <port>

# Check certificates
kubectl get certificates --all-namespaces
kubectl get secret <tls-secret> -n <namespace> -o yaml
```

## Backup and Recovery

### Backup
```bash
# Backup cluster state
kubectl get all --all-namespaces -o yaml > cluster-backup.yaml

# Backup databases
kubectl exec -it postgresql-0 -n storage -- pg_dump aic_production > backup.sql
kubectl exec -it redis-0 -n storage -- redis-cli BGSAVE
kubectl exec -it mongodb-0 -n storage -- mongodump --out /backup
```

### Recovery
```bash
# Restore from backup
kubectl apply -f cluster-backup.yaml

# Database restore
kubectl exec -i postgresql-0 -n storage -- psql aic_production < backup.sql
kubectl cp redis-backup.rdb redis-0:/data/dump.rdb -n storage
kubectl exec -it mongodb-0 -n storage -- mongorestore /backup
```

## Emergency Contacts

### Internal
- **Production Issues**: #aic-alerts
- **Infrastructure**: #aic-infrastructure  
- **Development**: #aic-development

### External
- **AWS Support**: [Support Case]
- **OpenAI Support**: [API Issues]
- **Monitoring**: [On-call Rotation]

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Kubernetes shortcuts
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
alias kdp='kubectl describe pod'
alias kl='kubectl logs'
alias kex='kubectl exec -it'

# AIC specific
alias aic-health='./scripts/troubleshoot.sh check'
alias aic-fix='./scripts/troubleshoot.sh fix'
alias aic-logs='kubectl logs -f deployment/backend-api -n backend-services'
alias aic-pods='kubectl get pods --all-namespaces | grep -v Running'
```

## Quick Scripts

### Check All Services
```bash
#!/bin/bash
for ns in backend-services ai-services cms storage observability; do
  echo "=== $ns ==="
  kubectl get pods -n $ns
  echo
done
```

### Restart All Services
```bash
#!/bin/bash
kubectl rollout restart deployment/backend-api -n backend-services
kubectl rollout restart deployment/ai-services -n ai-services
kubectl rollout restart deployment/ghost-cms -n cms
echo "All services restarted"
```

### Clear All Caches
```bash
#!/bin/bash
kubectl exec -it redis-0 -n storage -- redis-cli FLUSHALL
kubectl delete pod -l app=backend-api -n backend-services
kubectl delete pod -l app=ai-services -n ai-services
echo "Caches cleared and services restarted"
```

---

**Remember**: Always check logs first, then try the least disruptive fix, and escalate if needed.
