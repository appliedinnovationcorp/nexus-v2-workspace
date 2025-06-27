// Jenkins Job DSL for AIC Website Production Deployment
// This file defines the Jenkins job for deploying to production Kubernetes cluster

pipelineJob('aic-website-production-deploy') {
    description('Deploy AIC Website to production Kubernetes cluster')
    
    parameters {
        stringParam('IMAGE_TAG', '', 'Docker image tag to deploy (usually Git commit SHA)')
        choiceParam('ENVIRONMENT', ['production'], 'Deployment environment')
        booleanParam('SKIP_TESTS', false, 'Skip smoke tests after deployment')
        booleanParam('ENABLE_CANARY', false, 'Enable canary deployment')
        stringParam('CANARY_WEIGHT', '10', 'Canary deployment weight (percentage)')
    }
    
    properties {
        disableConcurrentBuilds()
        buildDiscarder {
            strategy {
                logRotator {
                    daysToKeepStr('30')
                    numToKeepStr('10')
                    artifactDaysToKeepStr('7')
                    artifactNumToKeepStr('3')
                }
            }
        }
    }
    
    definition {
        cps {
            script('''
pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-agent
spec:
  serviceAccountName: jenkins
  containers:
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
    volumeMounts:
    - name: kubeconfig
      mountPath: /root/.kube
  - name: helm
    image: alpine/helm:3.11.1
    command:
    - cat
    tty: true
    volumeMounts:
    - name: kubeconfig
      mountPath: /root/.kube
  - name: git
    image: alpine/git:latest
    command:
    - cat
    tty: true
  volumes:
  - name: kubeconfig
    secret:
      secretName: kubeconfig-production
"""
        }
    }
    
    environment {
        GITLAB_API_TOKEN = credentials('gitlab-api-token')
        GITLAB_API_URL = 'https://gitlab.example.com/api/v4'
        GITLAB_PROJECT_ID = '12345'
        SLACK_WEBHOOK = credentials('slack-webhook-url')
        REGISTRY = 'registry.gitlab.example.com'
        REGISTRY_CREDENTIALS = credentials('gitlab-registry-credentials')
    }
    
    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    if (!params.IMAGE_TAG) {
                        error "IMAGE_TAG parameter is required"
                    }
                    
                    echo "Deploying image tag: ${params.IMAGE_TAG}"
                    echo "Environment: ${params.ENVIRONMENT}"
                    
                    // Validate image tag format (should be a Git SHA)
                    if (!(params.IMAGE_TAG ==~ /^[0-9a-f]{40}$/)) {
                        echo "Warning: IMAGE_TAG does not appear to be a Git SHA"
                    }
                }
            }
        }
        
        stage('Approval') {
            steps {
                script {
                    // Get approvers from CODEOWNERS file
                    def approvers = ['admin@example.com', 'devops@example.com']
                    
                    // Send notification to Slack
                    sh """
                        curl -X POST -H 'Content-type: application/json' --data '{
                            "text": "Production deployment approval requested for AIC Website\\nImage Tag: ${params.IMAGE_TAG}\\nEnvironment: ${params.ENVIRONMENT}\\nApproval URL: ${BUILD_URL}input"
                        }' ${SLACK_WEBHOOK}
                    """
                    
                    // Request approval
                    timeout(time: 24, unit: 'HOURS') {
                        input message: "Deploy to ${params.ENVIRONMENT}?", 
                              submitter: approvers.join(','), 
                              submitterParameter: 'APPROVER'
                    }
                    
                    echo "Deployment approved by: ${APPROVER}"
                }
            }
        }
        
        stage('Checkout GitOps Repo') {
            steps {
                container('git') {
                    withCredentials([sshUserPrivateKey(credentialsId: 'gitops-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            mkdir -p ~/.ssh
                            cp ${SSH_KEY} ~/.ssh/id_rsa
                            chmod 600 ~/.ssh/id_rsa
                            ssh-keyscan -t rsa gitlab.example.com >> ~/.ssh/known_hosts
                            
                            git clone git@gitlab.example.com:aic-website/gitops.git
                            cd gitops
                            git config user.email "jenkins@example.com"
                            git config user.name "Jenkins CI"
                        """
                    }
                }
            }
        }
        
        stage('Update Manifests') {
            steps {
                container('git') {
                    sh """
                        cd gitops
                        
                        # Update image tags in Kustomize files
                        sed -i "s|image: ${REGISTRY}/frontend:.*|image: ${REGISTRY}/frontend:${params.IMAGE_TAG}|" apps/frontend/overlays/${params.ENVIRONMENT}/kustomization.yaml
                        sed -i "s|image: ${REGISTRY}/backend:.*|image: ${REGISTRY}/backend:${params.IMAGE_TAG}|" apps/backend/overlays/${params.ENVIRONMENT}/kustomization.yaml
                        sed -i "s|image: ${REGISTRY}/ai-services:.*|image: ${REGISTRY}/ai-services:${params.IMAGE_TAG}|" apps/ai-services/overlays/${params.ENVIRONMENT}/kustomization.yaml
                        
                        # Commit and push changes
                        git add .
                        git commit -m "Update image tags for ${params.ENVIRONMENT} environment [skip ci]" || echo "No changes to commit"
                        git push origin main
                    """
                }
            }
        }
        
        stage('Pre-deployment Tasks') {
            steps {
                container('kubectl') {
                    sh """
                        # Create backup of current deployment state
                        kubectl get deployments -n frontend -o yaml > frontend-deployments-backup.yaml
                        kubectl get deployments -n backend-services -o yaml > backend-deployments-backup.yaml
                        kubectl get deployments -n ai-services -o yaml > ai-services-deployments-backup.yaml
                        
                        # Scale up resources if needed
                        kubectl scale deployment/frontend -n frontend --replicas=5
                        kubectl scale deployment/backend-api -n backend-services --replicas=5
                        kubectl scale deployment/ai-services -n ai-services --replicas=3
                    """
                }
            }
        }
        
        stage('Deploy Canary') {
            when {
                expression { return params.ENABLE_CANARY }
            }
            steps {
                container('kubectl') {
                    sh """
                        # Apply canary manifests
                        cd gitops/apps/frontend/overlays/${params.ENVIRONMENT}-canary
                        kubectl apply -k .
                        
                        # Set canary weight
                        kubectl patch virtualservice frontend -n frontend --type=json -p='[{"op": "replace", "path": "/spec/http/0/route/1/weight", "value": ${params.CANARY_WEIGHT}}]'
                        
                        # Wait for canary deployment to be ready
                        kubectl rollout status deployment/frontend-canary -n frontend
                    """
                    
                    // Wait for canary validation
                    timeout(time: 30, unit: 'MINUTES') {
                        input message: "Canary deployment is running with ${params.CANARY_WEIGHT}% traffic. Proceed with full deployment?"
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                container('kubectl') {
                    sh """
                        # Apply production manifests
                        cd gitops
                        kubectl apply -k apps/frontend/overlays/${params.ENVIRONMENT}
                        kubectl apply -k apps/backend/overlays/${params.ENVIRONMENT}
                        kubectl apply -k apps/ai-services/overlays/${params.ENVIRONMENT}
                        
                        # Wait for deployments to be ready
                        kubectl rollout status deployment/frontend -n frontend
                        kubectl rollout status deployment/backend-api -n backend-services
                        kubectl rollout status deployment/ai-services -n ai-services
                    """
                }
            }
        }
        
        stage('Post-deployment Tasks') {
            steps {
                container('kubectl') {
                    sh """
                        # Remove canary if it exists
                        kubectl delete deployment/frontend-canary -n frontend || true
                        
                        # Reset virtual service weights if needed
                        kubectl patch virtualservice frontend -n frontend --type=json -p='[{"op": "replace", "path": "/spec/http/0/route/0/weight", "value": 100}]' || true
                        
                        # Update ConfigMap with deployment info
                        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: deployment-info
  namespace: frontend
data:
  version: "${params.IMAGE_TAG}"
  timestamp: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  deployer: "${APPROVER}"
EOF
                    """
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                expression { return !params.SKIP_TESTS }
            }
            steps {
                container('kubectl') {
                    sh """
                        # Run smoke tests
                        kubectl create job --from=cronjob/smoke-tests smoke-tests-${BUILD_NUMBER} -n qa
                        
                        # Wait for smoke tests to complete
                        kubectl wait --for=condition=complete job/smoke-tests-${BUILD_NUMBER} -n qa --timeout=300s
                        
                        # Check if smoke tests passed
                        if kubectl get job smoke-tests-${BUILD_NUMBER} -n qa -o jsonpath='{.status.succeeded}' | grep -q 1; then
                            echo "Smoke tests passed"
                        else
                            echo "Smoke tests failed"
                            exit 1
                        fi
                    """
                }
            }
        }
    }
    
    post {
        success {
            script {
                // Update deployment status in GitLab
                sh """
                    curl --request POST --header "PRIVATE-TOKEN: ${GITLAB_API_TOKEN}" \\
                        "${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/statuses/${params.IMAGE_TAG}" \\
                        --form "state=success" \\
                        --form "name=production-deployment" \\
                        --form "target_url=${BUILD_URL}" \\
                        --form "description=Deployment to production completed successfully"
                """
                
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "✅ Production deployment successful for AIC Website\\nImage Tag: ${params.IMAGE_TAG}\\nEnvironment: ${params.ENVIRONMENT}\\nApproved by: ${APPROVER}\\nBuild URL: ${BUILD_URL}"
                    }' ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                // Update deployment status in GitLab
                sh """
                    curl --request POST --header "PRIVATE-TOKEN: ${GITLAB_API_TOKEN}" \\
                        "${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/statuses/${params.IMAGE_TAG}" \\
                        --form "state=failed" \\
                        --form "name=production-deployment" \\
                        --form "target_url=${BUILD_URL}" \\
                        --form "description=Deployment to production failed"
                """
                
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "❌ Production deployment failed for AIC Website\\nImage Tag: ${params.IMAGE_TAG}\\nEnvironment: ${params.ENVIRONMENT}\\nBuild URL: ${BUILD_URL}"
                    }' ${SLACK_WEBHOOK}
                """
                
                // Trigger rollback job
                build job: 'aic-website-rollback', 
                      parameters: [
                          string(name: 'ENVIRONMENT', value: params.ENVIRONMENT),
                          string(name: 'FAILED_BUILD', value: BUILD_NUMBER)
                      ],
                      wait: false
            }
        }
        always {
            // Archive artifacts
            archiveArtifacts artifacts: '*-deployments-backup.yaml', allowEmptyArchive: true
        }
    }
}
            ''')
            sandbox()
        }
    }
}
