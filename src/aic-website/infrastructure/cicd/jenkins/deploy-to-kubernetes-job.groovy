// Jenkins Pipeline for AIC Website Kubernetes Deployment
// Triggered by GitLab CI after successful security scanning and registry push

pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins-deployer
  containers:
  - name: kubectl
    image: bitnami/kubectl:1.28
    command:
    - sleep
    args:
    - 99d
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
  - name: helm
    image: alpine/helm:3.13.0
    command:
    - sleep
    args:
    - 99d
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
  - name: docker
    image: docker:24.0.5
    command:
    - sleep
    args:
    - 99d
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "1Gi"
        cpu: "500m"
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
"""
        }
    }
    
    parameters {
        string(
            name: 'IMAGE_TAG',
            defaultValue: '',
            description: 'Container image tag to deploy (from Harbor registry)'
        )
        choice(
            name: 'ENVIRONMENT',
            choices: ['develop', 'staging', 'main'],
            description: 'Target environment for deployment'
        )
        string(
            name: 'GITLAB_PROJECT',
            defaultValue: 'aic-website',
            description: 'GitLab project name'
        )
        string(
            name: 'GITLAB_COMMIT',
            defaultValue: '',
            description: 'GitLab commit SHA'
        )
        booleanParam(
            name: 'DRY_RUN',
            defaultValue: false,
            description: 'Perform dry run deployment (validation only)'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip post-deployment tests'
        )
    }
    
    environment {
        // Harbor registry configuration
        HARBOR_REGISTRY = credentials('harbor-registry-url')
        HARBOR_CREDENTIALS = credentials('harbor-credentials')
        
        // Kubernetes configuration
        KUBECONFIG = credentials('kubernetes-config')
        
        // Slack notification
        SLACK_WEBHOOK = credentials('slack-webhook-deployments')
        
        // Environment-specific configurations
        NAMESPACE_MAP = '{"develop":"development","staging":"staging","main":"production"}'
        CLUSTER_MAP = '{"develop":"aic-dev-cluster","staging":"aic-staging-cluster","main":"aic-prod-cluster"}'
        
        // Deployment configuration
        DEPLOYMENT_TIMEOUT = '600s'
        ROLLBACK_TIMEOUT = '300s'
        HEALTH_CHECK_TIMEOUT = '180s'
    }
    
    stages {
        stage('Initialize') {
            steps {
                script {
                    // Validate required parameters
                    if (!params.IMAGE_TAG) {
                        error("IMAGE_TAG parameter is required")
                    }
                    
                    // Set environment variables
                    env.TARGET_NAMESPACE = readJSON(text: env.NAMESPACE_MAP)[params.ENVIRONMENT]
                    env.TARGET_CLUSTER = readJSON(text: env.CLUSTER_MAP)[params.ENVIRONMENT]
                    env.DEPLOYMENT_NAME = "aic-website-${params.ENVIRONMENT}"
                    
                    // Extract image components
                    def imageComponents = params.IMAGE_TAG.split('/')
                    env.IMAGE_REPOSITORY = imageComponents[0..-2].join('/')
                    env.IMAGE_NAME_TAG = imageComponents[-1]
                    
                    echo "Deployment Configuration:"
                    echo "- Environment: ${params.ENVIRONMENT}"
                    echo "- Namespace: ${env.TARGET_NAMESPACE}"
                    echo "- Cluster: ${env.TARGET_CLUSTER}"
                    echo "- Image: ${params.IMAGE_TAG}"
                    echo "- Deployment: ${env.DEPLOYMENT_NAME}"
                    echo "- Dry Run: ${params.DRY_RUN}"
                }
            }
        }
        
        stage('Pre-deployment Validation') {
            parallel {
                stage('Validate Image') {
                    steps {
                        container('docker') {
                            script {
                                // Login to Harbor registry
                                sh """
                                    echo \$HARBOR_CREDENTIALS_PSW | docker login \$HARBOR_REGISTRY -u \$HARBOR_CREDENTIALS_USR --password-stdin
                                """
                                
                                // Verify image exists and pull for validation
                                sh """
                                    echo "Validating image: ${params.IMAGE_TAG}"
                                    docker pull ${params.IMAGE_TAG}
                                    docker inspect ${params.IMAGE_TAG}
                                """
                                
                                // Check image security scan results
                                sh """
                                    echo "Checking image security scan status..."
                                    # This would integrate with Harbor API to check scan results
                                    curl -f -u \$HARBOR_CREDENTIALS_USR:\$HARBOR_CREDENTIALS_PSW \\
                                        "\$HARBOR_REGISTRY/api/v2.0/projects/aic-website/repositories/${env.IMAGE_NAME_TAG.split(':')[0]}/artifacts/${env.IMAGE_NAME_TAG.split(':')[1]}/scan" || {
                                        echo "Warning: Could not verify security scan results"
                                    }
                                """
                            }
                        }
                    }
                }
                
                stage('Validate Kubernetes Config') {
                    steps {
                        container('kubectl') {
                            script {
                                // Test cluster connectivity
                                sh """
                                    echo "Testing Kubernetes cluster connectivity..."
                                    kubectl cluster-info
                                    kubectl get nodes
                                """
                                
                                // Validate namespace exists
                                sh """
                                    echo "Validating target namespace: ${env.TARGET_NAMESPACE}"
                                    kubectl get namespace ${env.TARGET_NAMESPACE} || {
                                        echo "Creating namespace ${env.TARGET_NAMESPACE}"
                                        kubectl create namespace ${env.TARGET_NAMESPACE}
                                        kubectl label namespace ${env.TARGET_NAMESPACE} \\
                                            environment=${params.ENVIRONMENT} \\
                                            managed-by=jenkins \\
                                            part-of=aic-website
                                    }
                                """
                                
                                // Validate RBAC permissions
                                sh """
                                    echo "Validating RBAC permissions..."
                                    kubectl auth can-i create deployments -n ${env.TARGET_NAMESPACE}
                                    kubectl auth can-i create services -n ${env.TARGET_NAMESPACE}
                                    kubectl auth can-i create configmaps -n ${env.TARGET_NAMESPACE}
                                    kubectl auth can-i create secrets -n ${env.TARGET_NAMESPACE}
                                """
                            }
                        }
                    }
                }
                
                stage('Validate Helm Charts') {
                    steps {
                        container('helm') {
                            script {
                                // Validate Helm charts
                                sh """
                                    echo "Validating Helm charts..."
                                    cd infrastructure/helm/aic-website
                                    
                                    # Lint Helm chart
                                    helm lint . --values values-${params.ENVIRONMENT}.yaml
                                    
                                    # Template and validate
                                    helm template ${env.DEPLOYMENT_NAME} . \\
                                        --values values-${params.ENVIRONMENT}.yaml \\
                                        --set image.tag=${env.IMAGE_NAME_TAG.split(':')[1]} \\
                                        --set image.repository=${env.IMAGE_REPOSITORY}/${env.IMAGE_NAME_TAG.split(':')[0]} \\
                                        --namespace ${env.TARGET_NAMESPACE} \\
                                        --dry-run > /tmp/rendered-manifests.yaml
                                """
                                
                                // Validate rendered manifests
                                container('kubectl') {
                                    sh """
                                        echo "Validating rendered Kubernetes manifests..."
                                        kubectl apply --dry-run=client -f /tmp/rendered-manifests.yaml
                                    """
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy Application') {
            when {
                not { params.DRY_RUN }
            }
            steps {
                container('helm') {
                    script {
                        try {
                            // Create backup of current deployment
                            sh """
                                echo "Creating backup of current deployment..."
                                kubectl get deployment ${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} -o yaml > /tmp/deployment-backup.yaml 2>/dev/null || echo "No existing deployment to backup"
                            """
                            
                            // Deploy using Helm
                            sh """
                                echo "Deploying ${env.DEPLOYMENT_NAME} to ${env.TARGET_NAMESPACE}..."
                                cd infrastructure/helm/aic-website
                                
                                helm upgrade --install ${env.DEPLOYMENT_NAME} . \\
                                    --values values-${params.ENVIRONMENT}.yaml \\
                                    --set image.tag=${env.IMAGE_NAME_TAG.split(':')[1]} \\
                                    --set image.repository=${env.IMAGE_REPOSITORY}/${env.IMAGE_NAME_TAG.split(':')[0]} \\
                                    --set deployment.gitlabCommit=${params.GITLAB_COMMIT} \\
                                    --set deployment.jenkinsJob=${env.BUILD_NUMBER} \\
                                    --set deployment.timestamp=\$(date -u +%Y%m%d-%H%M%S) \\
                                    --namespace ${env.TARGET_NAMESPACE} \\
                                    --timeout ${env.DEPLOYMENT_TIMEOUT} \\
                                    --wait \\
                                    --atomic
                            """
                            
                            // Record deployment
                            sh """
                                echo "Recording deployment..."
                                kubectl annotate deployment ${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} \\
                                    deployment.kubernetes.io/revision=\$(date -u +%Y%m%d-%H%M%S) \\
                                    deployment.aicorp.com/image=${params.IMAGE_TAG} \\
                                    deployment.aicorp.com/gitlab-commit=${params.GITLAB_COMMIT} \\
                                    deployment.aicorp.com/jenkins-job=${env.BUILD_NUMBER} \\
                                    --overwrite
                            """
                            
                        } catch (Exception e) {
                            echo "Deployment failed: ${e.getMessage()}"
                            currentBuild.result = 'FAILURE'
                            throw e
                        }
                    }
                }
            }
        }
        
        stage('Post-deployment Validation') {
            when {
                not { params.DRY_RUN }
            }
            parallel {
                stage('Health Checks') {
                    steps {
                        container('kubectl') {
                            script {
                                // Wait for deployment to be ready
                                sh """
                                    echo "Waiting for deployment to be ready..."
                                    kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} --timeout=${env.HEALTH_CHECK_TIMEOUT}
                                """
                                
                                // Check pod health
                                sh """
                                    echo "Checking pod health..."
                                    kubectl get pods -n ${env.TARGET_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                                    
                                    # Wait for all pods to be ready
                                    kubectl wait --for=condition=ready pod -l app=${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} --timeout=${env.HEALTH_CHECK_TIMEOUT}
                                """
                                
                                // Check service endpoints
                                sh """
                                    echo "Checking service endpoints..."
                                    kubectl get endpoints -n ${env.TARGET_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                                """
                            }
                        }
                    }
                }
                
                stage('Application Tests') {
                    when {
                        not { params.SKIP_TESTS }
                    }
                    steps {
                        container('kubectl') {
                            script {
                                // Get service URL for testing
                                def serviceUrl = sh(
                                    script: "kubectl get service ${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo 'localhost'",
                                    returnStdout: true
                                ).trim()
                                
                                // Run health check tests
                                sh """
                                    echo "Running application health tests..."
                                    
                                    # Test health endpoint
                                    kubectl exec -n ${env.TARGET_NAMESPACE} deployment/${env.DEPLOYMENT_NAME} -- curl -f http://localhost:8080/health || {
                                        echo "Health check failed"
                                        exit 1
                                    }
                                    
                                    # Test readiness endpoint
                                    kubectl exec -n ${env.TARGET_NAMESPACE} deployment/${env.DEPLOYMENT_NAME} -- curl -f http://localhost:8080/ready || {
                                        echo "Readiness check failed"
                                        exit 1
                                    }
                                """
                                
                                // Run smoke tests
                                sh """
                                    echo "Running smoke tests..."
                                    
                                    # Create test job
                                    kubectl create job ${env.DEPLOYMENT_NAME}-smoke-test-${env.BUILD_NUMBER} \\
                                        --image=${params.IMAGE_TAG} \\
                                        -n ${env.TARGET_NAMESPACE} \\
                                        -- /bin/sh -c "npm run test:smoke" || echo "Smoke test job creation failed"
                                    
                                    # Wait for test completion
                                    kubectl wait --for=condition=complete job/${env.DEPLOYMENT_NAME}-smoke-test-${env.BUILD_NUMBER} \\
                                        -n ${env.TARGET_NAMESPACE} --timeout=300s || {
                                        echo "Smoke tests failed or timed out"
                                        kubectl logs job/${env.DEPLOYMENT_NAME}-smoke-test-${env.BUILD_NUMBER} -n ${env.TARGET_NAMESPACE}
                                        exit 1
                                    }
                                    
                                    # Cleanup test job
                                    kubectl delete job ${env.DEPLOYMENT_NAME}-smoke-test-${env.BUILD_NUMBER} -n ${env.TARGET_NAMESPACE}
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Update Monitoring') {
            when {
                not { params.DRY_RUN }
            }
            steps {
                container('kubectl') {
                    script {
                        // Update monitoring labels
                        sh """
                            echo "Updating monitoring configuration..."
                            kubectl label deployment ${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} \\
                                monitoring.aicorp.com/enabled=true \\
                                monitoring.aicorp.com/environment=${params.ENVIRONMENT} \\
                                --overwrite
                        """
                        
                        // Create or update ServiceMonitor for Prometheus
                        sh """
                            cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ${env.DEPLOYMENT_NAME}
  namespace: ${env.TARGET_NAMESPACE}
  labels:
    app: ${env.DEPLOYMENT_NAME}
    environment: ${params.ENVIRONMENT}
spec:
  selector:
    matchLabels:
      app: ${env.DEPLOYMENT_NAME}
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
EOF
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Collect deployment logs
                container('kubectl') {
                    sh """
                        echo "Collecting deployment information..."
                        kubectl get all -n ${env.TARGET_NAMESPACE} -l app=${env.DEPLOYMENT_NAME} > deployment-status.txt || true
                        kubectl describe deployment ${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} > deployment-details.txt || true
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} --tail=100 > deployment-logs.txt || true
                    """
                }
                
                // Archive artifacts
                archiveArtifacts artifacts: '*.txt', allowEmptyArchive: true
                
                // Clean up Docker images
                container('docker') {
                    sh """
                        docker rmi ${params.IMAGE_TAG} || true
                        docker system prune -f || true
                    """
                }
            }
        }
        
        success {
            script {
                // Send success notification
                def message = """
✅ **Deployment Successful**
• **Project**: ${params.GITLAB_PROJECT}
• **Environment**: ${params.ENVIRONMENT}
• **Image**: `${params.IMAGE_TAG}`
• **Commit**: ${params.GITLAB_COMMIT}
• **Jenkins Job**: ${env.BUILD_URL}
• **Duration**: ${currentBuild.durationString}
"""
                
                sh """
                    curl -X POST -H 'Content-type: application/json' \\
                        --data '{"text":"${message}"}' \\
                        ${env.SLACK_WEBHOOK} || echo "Failed to send Slack notification"
                """
                
                // Update deployment status in GitLab
                sh """
                    curl -X POST \\
                        -H "PRIVATE-TOKEN: \${GITLAB_TOKEN}" \\
                        -H "Content-Type: application/json" \\
                        -d '{"state":"success","target_url":"${env.BUILD_URL}","description":"Deployment successful"}' \\
                        "https://gitlab.example.com/api/v4/projects/${params.GITLAB_PROJECT}/statuses/${params.GITLAB_COMMIT}" || echo "Failed to update GitLab status"
                """
            }
        }
        
        failure {
            script {
                // Send failure notification
                def message = """
❌ **Deployment Failed**
• **Project**: ${params.GITLAB_PROJECT}
• **Environment**: ${params.ENVIRONMENT}
• **Image**: `${params.IMAGE_TAG}`
• **Commit**: ${params.GITLAB_COMMIT}
• **Jenkins Job**: ${env.BUILD_URL}
• **Error**: ${currentBuild.description ?: 'See Jenkins logs for details'}
"""
                
                sh """
                    curl -X POST -H 'Content-type: application/json' \\
                        --data '{"text":"${message}"}' \\
                        ${env.SLACK_WEBHOOK} || echo "Failed to send Slack notification"
                """
                
                // Attempt rollback for production
                if (params.ENVIRONMENT == 'main') {
                    container('kubectl') {
                        sh """
                            echo "Attempting rollback for production deployment..."
                            kubectl rollout undo deployment/${env.DEPLOYMENT_NAME} -n ${env.TARGET_NAMESPACE} --timeout=${env.ROLLBACK_TIMEOUT} || echo "Rollback failed"
                        """
                    }
                }
                
                // Update deployment status in GitLab
                sh """
                    curl -X POST \\
                        -H "PRIVATE-TOKEN: \${GITLAB_TOKEN}" \\
                        -H "Content-Type: application/json" \\
                        -d '{"state":"failed","target_url":"${env.BUILD_URL}","description":"Deployment failed"}' \\
                        "https://gitlab.example.com/api/v4/projects/${params.GITLAB_PROJECT}/statuses/${params.GITLAB_COMMIT}" || echo "Failed to update GitLab status"
                """
            }
        }
        
        unstable {
            script {
                def message = """
⚠️ **Deployment Unstable**
• **Project**: ${params.GITLAB_PROJECT}
• **Environment**: ${params.ENVIRONMENT}
• **Image**: `${params.IMAGE_TAG}`
• **Jenkins Job**: ${env.BUILD_URL}
• **Warning**: Some tests failed but deployment completed
"""
                
                sh """
                    curl -X POST -H 'Content-type: application/json' \\
                        --data '{"text":"${message}"}' \\
                        ${env.SLACK_WEBHOOK} || echo "Failed to send Slack notification"
                """
            }
        }
    }
}
