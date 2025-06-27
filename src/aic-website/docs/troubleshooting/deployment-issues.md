# Deployment Issues Troubleshooting

## CI/CD Pipeline Issues

### 1. GitHub Actions Pipeline Failures

#### Symptoms
- Build failures in GitHub Actions
- Test failures blocking deployment
- Workflow not triggering

#### Diagnosis
```bash
# Check workflow status
gh workflow list --repo aicorp/aic-website

# View workflow runs
gh run list --workflow=build-and-test.yml

# Check specific run details
gh run view <run-id> --log

# Check repository secrets
gh secret list --repo aicorp/aic-website
```

#### Solutions
```bash
# Re-run failed workflow
gh run rerun <run-id>

# Update workflow secrets
gh secret set OPENAI_API_KEY --body="<new-key>" --repo aicorp/aic-website

# Fix workflow configuration
# Edit .github/workflows/build-and-test.yml

# Check workflow permissions
gh api repos/aicorp/aic-website/actions/permissions
```

### 2. GitLab CI Pipeline Issues

#### Symptoms
- Security scanning failures
- Compliance check errors
- Harbor registry push failures

#### Diagnosis
```bash
# Check GitLab CI pipeline status
curl -H "PRIVATE-TOKEN: <token>" "https://gitlab.example.com/api/v4/projects/<project-id>/pipelines"

# Check job logs
curl -H "PRIVATE-TOKEN: <token>" "https://gitlab.example.com/api/v4/projects/<project-id>/jobs/<job-id>/trace"

# Test Harbor connectivity
docker login harbor.aicorp.com -u <username> -p <password>

# Check security scanning results
curl -H "PRIVATE-TOKEN: <token>" "https://gitlab.example.com/api/v4/projects/<project-id>/vulnerability_findings"
```

#### Solutions
```bash
# Retry failed pipeline
curl -X POST -H "PRIVATE-TOKEN: <token>" "https://gitlab.example.com/api/v4/projects/<project-id>/pipelines/<pipeline-id>/retry"

# Update GitLab CI variables
curl -X PUT -H "PRIVATE-TOKEN: <token>" -d "value=<new-value>" "https://gitlab.example.com/api/v4/projects/<project-id>/variables/HARBOR_PASSWORD"

# Fix security vulnerabilities
# Update dependencies in package.json

# Update Harbor credentials
kubectl create secret docker-registry harbor-secret --docker-server=harbor.aicorp.com --docker-username=<user> --docker-password=<pass> -n <namespace>
```

### 3. Jenkins Pipeline Issues

#### Symptoms
- Deployment job failures
- Kubernetes deployment errors
- Jenkins agent connectivity issues

#### Diagnosis
```bash
# Check Jenkins job status
curl -u <user>:<token> http://jenkins.aicorp.com/job/deploy-to-kubernetes/lastBuild/api/json

# Check Jenkins logs
curl -u <user>:<token> http://jenkins.aicorp.com/job/deploy-to-kubernetes/lastBuild/consoleText

# Test Kubernetes connectivity from Jenkins
kubectl --kubeconfig=/var/jenkins_home/.kube/config get nodes

# Check Jenkins agent status
curl -u <user>:<token> http://jenkins.aicorp.com/computer/api/json
```

#### Solutions
```bash
# Restart Jenkins job
curl -X POST -u <user>:<token> http://jenkins.aicorp.com/job/deploy-to-kubernetes/build

# Update Jenkins credentials
# Go to Jenkins UI > Manage Jenkins > Manage Credentials

# Fix Kubernetes configuration
kubectl config set-cluster aic-cluster --server=https://<cluster-endpoint>
kubectl config set-credentials jenkins --token=<service-account-token>

# Restart Jenkins agents
curl -X POST -u <user>:<token> http://jenkins.aicorp.com/computer/<agent-name>/doDisconnect
```

## Container Build Issues

### 1. Docker Build Failures

#### Symptoms
- Docker build timeouts
- Layer caching issues
- Base image pull failures

#### Diagnosis
```bash
# Check Docker build logs
docker build --no-cache -t aic-website:latest .

# Test base image availability
docker pull node:18-alpine

# Check Dockerfile syntax
docker build --dry-run -t test .

# Check build context size
du -sh .
```

#### Solutions
```bash
# Optimize Dockerfile
# Use multi-stage builds
# Minimize layer count

# Clear Docker cache
docker system prune -a

# Use specific base image versions
# FROM node:18.17.0-alpine instead of node:18-alpine

# Add .dockerignore file
echo "node_modules\n.git\n*.md" > .dockerignore
```

### 2. Image Registry Issues

#### Symptoms
- Image push failures
- Registry authentication errors
- Image pull failures in Kubernetes

#### Diagnosis
```bash
# Test registry connectivity
docker login ghcr.io -u <username> -p <token>

# Check image exists
docker pull ghcr.io/aicorp/aic-website:latest

# Check registry credentials in Kubernetes
kubectl get secret regcred -n <namespace> -o yaml

# Test image pull from Kubernetes
kubectl run test-pod --image=ghcr.io/aicorp/aic-website:latest --dry-run=client
```

#### Solutions
```bash
# Update registry credentials
docker login ghcr.io -u <username> -p <new-token>

# Create Kubernetes registry secret
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token> \
  --docker-email=<email> \
  -n <namespace>

# Update deployment with image pull secret
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# Verify image push
docker push ghcr.io/aicorp/aic-website:latest
```

### 3. Multi-Architecture Build Issues

#### Symptoms
- ARM64 build failures
- Platform-specific errors
- Cross-compilation issues

#### Diagnosis
```bash
# Check available platforms
docker buildx ls

# Test multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t aic-website:multi .

# Check base image platform support
docker manifest inspect node:18-alpine

# Check current platform
uname -m
```

#### Solutions
```bash
# Create buildx builder
docker buildx create --name multiarch --driver docker-container --use

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 --push -t ghcr.io/aicorp/aic-website:latest .

# Use platform-specific base images
# FROM --platform=$BUILDPLATFORM node:18-alpine

# Test on target platform
docker run --platform linux/arm64 ghcr.io/aicorp/aic-website:latest
```

## Kubernetes Deployment Issues

### 1. Deployment Rollout Failures

#### Symptoms
- Pods stuck in Pending state
- ImagePullBackOff errors
- CrashLoopBackOff status

#### Diagnosis
```bash
# Check deployment status
kubectl get deployment <name> -n <namespace>

# Check rollout status
kubectl rollout status deployment/<name> -n <namespace>

# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check deployment events
kubectl describe deployment <name> -n <namespace>
```

#### Solutions
```bash
# Fix image pull issues
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# Increase resource limits
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"limits":{"memory":"1Gi","cpu":"500m"}}}]}}}}'

# Fix configuration issues
kubectl get configmap <config-name> -n <namespace> -o yaml

# Rollback deployment
kubectl rollout undo deployment/<name> -n <namespace>
```

### 2. Service Discovery Issues

#### Symptoms
- Services not accessible
- DNS resolution failures
- Load balancer not working

#### Diagnosis
```bash
# Check service status
kubectl get service <service-name> -n <namespace>

# Check service endpoints
kubectl get endpoints <service-name> -n <namespace>

# Test DNS resolution
kubectl exec -it <pod-name> -n <namespace> -- nslookup <service-name>

# Check ingress status
kubectl get ingress <ingress-name> -n <namespace>
```

#### Solutions
```bash
# Fix service selector
kubectl patch service <service-name> -n <namespace> -p '{"spec":{"selector":{"app":"<correct-label>"}}}'

# Check pod labels
kubectl get pods -n <namespace> --show-labels

# Restart CoreDNS
kubectl rollout restart deployment/coredns -n kube-system

# Update ingress configuration
kubectl patch ingress <ingress-name> -n <namespace> --patch-file=ingress-fix.yaml
```

### 3. ConfigMap and Secret Issues

#### Symptoms
- Configuration not loading
- Secret mount failures
- Environment variables missing

#### Diagnosis
```bash
# Check ConfigMap exists
kubectl get configmap <configmap-name> -n <namespace>

# Check Secret exists
kubectl get secret <secret-name> -n <namespace>

# Check volume mounts
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 Mounts

# Check environment variables
kubectl exec -it <pod-name> -n <namespace> -- env | grep <VAR_NAME>
```

#### Solutions
```bash
# Create missing ConfigMap
kubectl apply -f infrastructure/kubernetes/config/

# Create missing Secret
kubectl create secret generic <secret-name> --from-literal=key=value -n <namespace>

# Fix volume mount configuration
kubectl patch deployment <name> -n <namespace> --patch-file=volume-fix.yaml

# Restart deployment to pick up changes
kubectl rollout restart deployment/<name> -n <namespace>
```

## ArgoCD GitOps Issues

### 1. Application Sync Failures

#### Symptoms
- ArgoCD applications out of sync
- Git repository access issues
- Manifest validation errors

#### Diagnosis
```bash
# Check ArgoCD application status
kubectl get application <app-name> -n argocd

# Check ArgoCD server logs
kubectl logs deployment/argocd-server -n argocd

# Check repository connectivity
kubectl exec -it argocd-repo-server-<pod> -n argocd -- git ls-remote https://github.com/aicorp/aic-website.git

# Check application details
argocd app get <app-name>
```

#### Solutions
```bash
# Sync application manually
argocd app sync <app-name>

# Update repository credentials
kubectl patch secret argocd-repo-creds -n argocd --patch '{"data":{"password":"<base64-encoded-token>"}}'

# Fix manifest validation
kubectl apply --dry-run=client -f infrastructure/kubernetes/

# Refresh application
argocd app refresh <app-name>
```

### 2. ArgoCD Performance Issues

#### Symptoms
- Slow sync operations
- High memory usage
- Application controller errors

#### Diagnosis
```bash
# Check ArgoCD resource usage
kubectl top pods -n argocd

# Check application controller logs
kubectl logs deployment/argocd-application-controller -n argocd

# Check sync performance
argocd app list --output wide

# Monitor ArgoCD metrics
kubectl port-forward svc/argocd-metrics -n argocd 8082:8082
curl http://localhost:8082/metrics
```

#### Solutions
```bash
# Increase ArgoCD resources
kubectl patch deployment argocd-application-controller -n argocd -p '{"spec":{"template":{"spec":{"containers":[{"name":"argocd-application-controller","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# Optimize sync policies
kubectl patch application <app-name> -n argocd --patch '{"spec":{"syncPolicy":{"automated":{"prune":true,"selfHeal":true}}}}'

# Configure resource exclusions
kubectl patch configmap argocd-cm -n argocd --patch '{"data":{"resource.exclusions":"- apiGroups: [\"*\"]\n  kinds: [\"Event\"]\n  clusters: [\"*\"]"}}'

# Scale ArgoCD components
kubectl scale deployment argocd-application-controller --replicas=2 -n argocd
```

### 3. GitOps Workflow Issues

#### Symptoms
- Manual deployments bypassing GitOps
- Configuration drift
- Rollback difficulties

#### Diagnosis
```bash
# Check for configuration drift
argocd app diff <app-name>

# Check manual changes
kubectl get events --field-selector reason=ScalingReplicaSet -n <namespace>

# Check Git history
git log --oneline infrastructure/kubernetes/

# Check ArgoCD sync history
argocd app history <app-name>
```

#### Solutions
```bash
# Enable auto-sync and self-heal
kubectl patch application <app-name> -n argocd --patch '{"spec":{"syncPolicy":{"automated":{"prune":true,"selfHeal":true}}}}'

# Implement admission controllers
kubectl apply -f security/admission-controllers.yaml

# Set up proper RBAC
kubectl apply -f security/rbac-policies.yaml

# Create deployment policies
kubectl apply -f policies/deployment-policies.yaml
```

## Environment-Specific Issues

### 1. Development Environment Issues

#### Symptoms
- Local development setup failures
- Docker Compose issues
- Hot reload not working

#### Diagnosis
```bash
# Check Docker Compose status
docker-compose ps

# Check service logs
docker-compose logs <service-name>

# Check port conflicts
lsof -i :3000

# Check file watching
ls -la node_modules/.bin/next
```

#### Solutions
```bash
# Restart development environment
docker-compose down && docker-compose up -d

# Clear Docker volumes
docker-compose down -v

# Fix file permissions
sudo chown -R $USER:$USER .

# Update development configuration
cp .env.example .env.local
```

### 2. Staging Environment Issues

#### Symptoms
- Staging deployment failures
- Environment variable mismatches
- Database migration issues

#### Diagnosis
```bash
# Check staging deployment
kubectl get pods -n staging

# Check environment configuration
kubectl get configmap staging-config -n backend-services -o yaml

# Check database migration status
kubectl logs job/db-migration -n staging

# Check external service connectivity
kubectl exec -it <pod-name> -n staging -- curl https://api.staging.example.com
```

#### Solutions
```bash
# Update staging configuration
./scripts/config-management.sh apply staging

# Run database migrations
kubectl create job db-migration-manual --from=cronjob/db-migration -n staging

# Fix environment variables
kubectl patch configmap staging-config -n backend-services --patch-file=staging-env-fix.yaml

# Restart staging services
kubectl rollout restart deployment --all -n staging
```

### 3. Production Deployment Issues

#### Symptoms
- Production deployment failures
- Zero-downtime deployment issues
- Rollback requirements

#### Diagnosis
```bash
# Check production deployment status
kubectl get deployment --all-namespaces | grep -v "READY.*READY"

# Check rolling update status
kubectl rollout status deployment/<name> -n <namespace>

# Check production health
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/health

# Check traffic routing
kubectl get ingress --all-namespaces
```

#### Solutions
```bash
# Implement blue-green deployment
kubectl apply -f deployment/blue-green/

# Configure rolling update strategy
kubectl patch deployment <name> -n <namespace> -p '{"spec":{"strategy":{"rollingUpdate":{"maxUnavailable":"25%","maxSurge":"25%"}}}}'

# Set up canary deployment
kubectl apply -f deployment/canary/

# Implement circuit breakers
kubectl apply -f resilience/circuit-breakers.yaml
```

## Disaster Recovery

### 1. Backup and Restore Issues

#### Symptoms
- Backup failures
- Restore process errors
- Data consistency issues

#### Diagnosis
```bash
# Check backup job status
kubectl get job backup-job -n backup

# Check backup storage
kubectl exec -it backup-pod -n backup -- ls -la /backup

# Test restore process
kubectl create job restore-test --from=cronjob/backup-job -n backup

# Check data integrity
kubectl exec -it postgresql-0 -n storage -- psql -c "SELECT count(*) FROM users;"
```

#### Solutions
```bash
# Fix backup configuration
kubectl patch cronjob backup-job -n backup --patch-file=backup-fix.yaml

# Increase backup storage
kubectl patch pvc backup-storage -n backup -p '{"spec":{"resources":{"requests":{"storage":"500Gi"}}}}'

# Test backup restoration
kubectl apply -f disaster-recovery/restore-job.yaml

# Verify data consistency
kubectl exec -it postgresql-0 -n storage -- pg_dump aic_production | wc -l
```

### 2. Cluster Recovery

#### Symptoms
- Cluster node failures
- Control plane issues
- Network partitioning

#### Diagnosis
```bash
# Check cluster health
kubectl get nodes
kubectl get componentstatuses

# Check control plane pods
kubectl get pods -n kube-system

# Check cluster networking
kubectl exec -it <pod-name> -n <namespace> -- ping 8.8.8.8

# Check etcd health
kubectl exec -it etcd-<node> -n kube-system -- etcdctl endpoint health
```

#### Solutions
```bash
# Replace failed nodes
aws eks update-nodegroup --cluster-name aic-cluster --nodegroup-name workers --force-update-version

# Restore from etcd backup
kubectl exec -it etcd-<node> -n kube-system -- etcdctl snapshot restore /backup/etcd-snapshot.db

# Fix networking issues
kubectl apply -f https://raw.githubusercontent.com/aws/amazon-vpc-cni-k8s/master/config/master/aws-k8s-cni.yaml

# Restart cluster components
kubectl delete pod -n kube-system -l component=kube-apiserver
```

## Monitoring Deployment Health

### 1. Deployment Metrics

```bash
# Check deployment success rate
kubectl get deployment --all-namespaces -o json | jq '.items[] | select(.status.replicas != .status.readyReplicas)'

# Monitor rollout progress
kubectl rollout status deployment/<name> -n <namespace> --watch

# Check deployment history
kubectl rollout history deployment/<name> -n <namespace>

# Monitor resource usage during deployment
kubectl top pods -n <namespace> --watch
```

### 2. Health Checks

```bash
# Check application health endpoints
kubectl exec -it <pod-name> -n <namespace> -- curl http://localhost:8080/health

# Check readiness probes
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 Readiness

# Check liveness probes
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 Liveness

# Monitor service endpoints
kubectl get endpoints --all-namespaces --watch
```

### 3. Automated Testing

```bash
# Run smoke tests
kubectl create job smoke-test --image=aic-website-test:latest -n testing

# Run integration tests
kubectl apply -f testing/integration-tests.yaml

# Check test results
kubectl logs job/smoke-test -n testing

# Run performance tests
kubectl apply -f testing/load-tests.yaml
```

---

**End of Troubleshooting Guide**

For additional help, refer to:
- [Main Troubleshooting Guide](./README.md)
- [Configuration Management](../configuration-management.md)
- [Architecture Documentation](../architecture.md)
