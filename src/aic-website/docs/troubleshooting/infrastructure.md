# Infrastructure Troubleshooting

## Kubernetes Cluster Issues

### 1. Cluster Connectivity Issues

#### Symptoms
- kubectl commands timing out
- Unable to connect to cluster
- API server unreachable

#### Diagnosis
```bash
# Check cluster status
kubectl cluster-info

# Test API server connectivity
kubectl get nodes

# Check kubeconfig
kubectl config current-context

# Verify credentials
kubectl auth can-i get pods --all-namespaces
```

#### Solutions
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name aic-cluster

# Check cluster endpoint
kubectl config view --minify

# Verify network connectivity
ping <cluster-endpoint>

# Check security groups
aws ec2 describe-security-groups --group-ids <cluster-sg>
```

### 2. Node Issues

#### Symptoms
- Nodes in NotReady state
- Pod scheduling failures
- Resource exhaustion

#### Diagnosis
```bash
# Check node status
kubectl get nodes -o wide

# Describe problematic nodes
kubectl describe node <node-name>

# Check node resources
kubectl top nodes

# Check system pods
kubectl get pods -n kube-system
```

#### Solutions
```bash
# Restart kubelet
sudo systemctl restart kubelet

# Check node logs
journalctl -u kubelet -f

# Drain and uncordon node
kubectl drain <node-name> --ignore-daemonsets
kubectl uncordon <node-name>

# Check disk space
df -h
```

### 3. Pod Scheduling Issues

#### Symptoms
- Pods stuck in Pending state
- Insufficient resources errors
- Node selector mismatches

#### Diagnosis
```bash
# Check pod status
kubectl get pods --all-namespaces | grep -v Running

# Describe pending pods
kubectl describe pod <pod-name> -n <namespace>

# Check resource requests
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 Requests

# Check node capacity
kubectl describe nodes | grep -A 5 Capacity
```

#### Solutions
```bash
# Scale cluster nodes
aws eks update-nodegroup --cluster-name aic-cluster --nodegroup-name workers --scaling-config minSize=3,maxSize=10,desiredSize=5

# Adjust resource requests
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"requests":{"memory":"256Mi","cpu":"100m"}}}]}}}}'

# Check node selectors
kubectl get pods <pod-name> -n <namespace> -o yaml | grep nodeSelector

# Add more nodes
kubectl get nodes --show-labels
```

### 4. Storage Issues

#### Symptoms
- PVC stuck in Pending state
- Volume mount failures
- Storage class issues

#### Diagnosis
```bash
# Check PVC status
kubectl get pvc --all-namespaces

# Describe PVC
kubectl describe pvc <pvc-name> -n <namespace>

# Check storage classes
kubectl get storageclass

# Check volume status
kubectl get pv
```

#### Solutions
```bash
# Check storage class provisioner
kubectl describe storageclass gp2

# Verify EBS CSI driver
kubectl get pods -n kube-system | grep ebs-csi

# Create new PVC
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: gp2
EOF

# Check AWS EBS limits
aws ec2 describe-account-attributes --attribute-names supported-platforms
```

### 5. Network Issues

#### Symptoms
- Service discovery failures
- DNS resolution issues
- Inter-pod communication problems

#### Diagnosis
```bash
# Test DNS resolution
kubectl exec -it <pod-name> -n <namespace> -- nslookup kubernetes.default

# Check CoreDNS status
kubectl get pods -n kube-system | grep coredns

# Test service connectivity
kubectl exec -it <pod-name> -n <namespace> -- curl http://service-name.namespace:port

# Check network policies
kubectl get networkpolicy --all-namespaces
```

#### Solutions
```bash
# Restart CoreDNS
kubectl rollout restart deployment/coredns -n kube-system

# Check DNS configuration
kubectl get configmap coredns -n kube-system -o yaml

# Test network connectivity
kubectl exec -it <pod-name> -n <namespace> -- ping <target-ip>

# Check CNI plugin
kubectl get pods -n kube-system | grep aws-node
```

### 6. Ingress Controller Issues

#### Symptoms
- External traffic not reaching services
- SSL certificate issues
- Load balancer problems

#### Diagnosis
```bash
# Check ingress status
kubectl get ingress --all-namespaces

# Describe ingress
kubectl describe ingress <ingress-name> -n <namespace>

# Check ingress controller
kubectl get pods -n ingress-nginx

# Test load balancer
curl -I http://<load-balancer-dns>
```

#### Solutions
```bash
# Restart ingress controller
kubectl rollout restart deployment/nginx-ingress-controller -n ingress-nginx

# Check SSL certificates
kubectl get certificates --all-namespaces

# Verify DNS records
nslookup <domain-name>

# Check AWS load balancer
aws elbv2 describe-load-balancers
```

## Container Issues

### 1. Image Pull Issues

#### Symptoms
- ImagePullBackOff errors
- ErrImagePull status
- Registry authentication failures

#### Diagnosis
```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check image name
kubectl get pod <pod-name> -n <namespace> -o yaml | grep image

# Test image pull manually
docker pull <image-name>

# Check registry credentials
kubectl get secret <registry-secret> -n <namespace> -o yaml
```

#### Solutions
```bash
# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email>

# Update deployment with image pull secret
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# Check image exists
aws ecr describe-images --repository-name <repo-name>

# Update image tag
kubectl set image deployment/<name> <container>=<new-image> -n <namespace>
```

### 2. Container Startup Issues

#### Symptoms
- CrashLoopBackOff errors
- Container exits immediately
- Init container failures

#### Diagnosis
```bash
# Check container logs
kubectl logs <pod-name> -n <namespace> -c <container-name>

# Check previous container logs
kubectl logs <pod-name> -n <namespace> -c <container-name> --previous

# Check container status
kubectl describe pod <pod-name> -n <namespace>

# Check resource limits
kubectl get pod <pod-name> -n <namespace> -o yaml | grep -A 10 resources
```

#### Solutions
```bash
# Increase resource limits
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"1Gi","cpu":"500m"}}}]}}}}'

# Check environment variables
kubectl get pod <pod-name> -n <namespace> -o yaml | grep -A 20 env

# Debug with shell
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# Check init containers
kubectl logs <pod-name> -n <namespace> -c <init-container-name>
```

### 3. Health Check Failures

#### Symptoms
- Readiness probe failures
- Liveness probe failures
- Service endpoints not ready

#### Diagnosis
```bash
# Check probe configuration
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 Liveness

# Test health endpoint manually
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/health

# Check service endpoints
kubectl get endpoints <service-name> -n <namespace>

# Check probe logs
kubectl logs <pod-name> -n <namespace> | grep -i probe
```

#### Solutions
```bash
# Adjust probe timing
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","livenessProbe":{"initialDelaySeconds":60,"periodSeconds":30}}]}}}}'

# Fix health endpoint
# Ensure /health endpoint returns 200 OK

# Check probe path
kubectl get deployment <name> -n <namespace> -o yaml | grep -A 5 livenessProbe

# Disable probes temporarily
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","livenessProbe":null}]}}}}'
```

## Resource Management

### 1. Resource Exhaustion

#### Symptoms
- Out of memory errors
- CPU throttling
- Disk space issues

#### Diagnosis
```bash
# Check resource usage
kubectl top pods --all-namespaces --sort-by=memory
kubectl top nodes

# Check resource requests vs limits
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 Requests

# Check disk usage
kubectl exec -it <pod-name> -n <namespace> -- df -h

# Check system resources
free -h
df -h
```

#### Solutions
```bash
# Increase resource limits
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# Clean up unused resources
kubectl delete pod --field-selector=status.phase=Succeeded --all-namespaces

# Add more nodes
aws eks update-nodegroup --cluster-name aic-cluster --nodegroup-name workers --scaling-config desiredSize=6

# Enable HPA
kubectl autoscale deployment <name> --cpu-percent=70 --min=2 --max=10 -n <namespace>
```

### 2. Namespace Issues

#### Symptoms
- Namespace stuck in Terminating state
- Resource quota exceeded
- RBAC permission issues

#### Diagnosis
```bash
# Check namespace status
kubectl get namespaces

# Check resource quotas
kubectl get resourcequota --all-namespaces

# Check RBAC
kubectl auth can-i create pods -n <namespace>

# Check finalizers
kubectl get namespace <namespace> -o yaml | grep finalizers
```

#### Solutions
```bash
# Force delete namespace
kubectl patch namespace <namespace> -p '{"metadata":{"finalizers":null}}' --type=merge

# Increase resource quota
kubectl patch resourcequota <quota-name> -n <namespace> -p '{"spec":{"hard":{"requests.memory":"4Gi"}}}'

# Check RBAC bindings
kubectl get rolebindings,clusterrolebindings --all-namespaces | grep <user>

# Create namespace with quotas
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: new-namespace
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: new-namespace
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
EOF
```

## Monitoring and Observability

### 1. Prometheus Issues

#### Symptoms
- Metrics not collecting
- Prometheus targets down
- High memory usage

#### Diagnosis
```bash
# Check Prometheus status
kubectl get pods -n observability | grep prometheus

# Check targets
curl http://prometheus:9090/api/v1/targets

# Check configuration
kubectl get configmap prometheus-config -n observability -o yaml

# Check storage
kubectl exec -it prometheus-0 -n observability -- df -h
```

#### Solutions
```bash
# Restart Prometheus
kubectl rollout restart deployment/prometheus -n observability

# Reload configuration
kubectl exec -it prometheus-0 -n observability -- curl -X POST http://localhost:9090/-/reload

# Increase storage
kubectl patch pvc prometheus-storage -n observability -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# Check service monitors
kubectl get servicemonitor --all-namespaces
```

### 2. Grafana Issues

#### Symptoms
- Dashboards not loading
- Data source connection issues
- Authentication problems

#### Diagnosis
```bash
# Check Grafana status
kubectl get pods -n observability | grep grafana

# Check data sources
kubectl exec -it grafana-<pod> -n observability -- curl http://localhost:3000/api/datasources

# Check logs
kubectl logs deployment/grafana -n observability

# Test Prometheus connectivity
kubectl exec -it grafana-<pod> -n observability -- curl http://prometheus:9090/api/v1/query?query=up
```

#### Solutions
```bash
# Restart Grafana
kubectl rollout restart deployment/grafana -n observability

# Reset admin password
kubectl exec -it grafana-<pod> -n observability -- grafana-cli admin reset-admin-password <new-password>

# Update data source
kubectl patch configmap grafana-datasources -n observability --patch-file=datasource-update.yaml

# Import dashboards
kubectl apply -f grafana/dashboards/
```

## Security Issues

### 1. RBAC Problems

#### Symptoms
- Permission denied errors
- Unauthorized access attempts
- Service account issues

#### Diagnosis
```bash
# Check current permissions
kubectl auth can-i --list

# Check service account
kubectl get serviceaccount <sa-name> -n <namespace> -o yaml

# Check role bindings
kubectl get rolebindings,clusterrolebindings --all-namespaces | grep <user>

# Test specific permissions
kubectl auth can-i create pods --as=system:serviceaccount:<namespace>:<sa-name>
```

#### Solutions
```bash
# Create role binding
kubectl create rolebinding <binding-name> --clusterrole=<role> --user=<user> -n <namespace>

# Update service account
kubectl patch serviceaccount <sa-name> -n <namespace> -p '{"secrets":[{"name":"<secret-name>"}]}'

# Check cluster roles
kubectl get clusterrole | grep <role-name>

# Create custom role
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: <namespace>
  name: <role-name>
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "create"]
EOF
```

### 2. Network Security

#### Symptoms
- Unauthorized network access
- Network policy violations
- Service mesh security issues

#### Diagnosis
```bash
# Check network policies
kubectl get networkpolicy --all-namespaces

# Test network connectivity
kubectl exec -it <pod-name> -n <namespace> -- nc -zv <target-ip> <port>

# Check service mesh policies
kubectl get peerauthentication --all-namespaces

# Check certificates
kubectl get certificates --all-namespaces
```

#### Solutions
```bash
# Apply network policy
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: <namespace>
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF

# Update service mesh config
kubectl apply -f service-mesh/security-policies.yaml

# Rotate certificates
kubectl delete certificate <cert-name> -n <namespace>

# Check TLS configuration
kubectl get secret <tls-secret> -n <namespace> -o yaml
```

## Disaster Recovery

### 1. Backup and Restore

```bash
# Backup cluster state
kubectl get all --all-namespaces -o yaml > cluster-backup.yaml

# Backup persistent volumes
kubectl get pv -o yaml > pv-backup.yaml

# Backup secrets and configmaps
kubectl get secrets,configmaps --all-namespaces -o yaml > configs-backup.yaml

# Restore from backup
kubectl apply -f cluster-backup.yaml
```

### 2. Cluster Recovery

```bash
# Check cluster health
kubectl get componentstatuses

# Restore etcd from backup
# Follow cloud provider specific procedures

# Recreate nodes
aws eks update-nodegroup --cluster-name aic-cluster --nodegroup-name workers --force-update-version

# Verify all services
kubectl get pods --all-namespaces
```

---

**Next**: [Database Issues](./database-issues.md)
