// Jenkins Job DSL for AIC Website Rollback
// This file defines the Jenkins job for rolling back failed deployments

pipelineJob('aic-website-rollback') {
    description('Rollback AIC Website deployment in case of failure')
    
    parameters {
        stringParam('ENVIRONMENT', 'production', 'Environment to rollback')
        stringParam('FAILED_BUILD', '', 'Build number of the failed deployment')
        stringParam('ROLLBACK_TO_TAG', '', 'Specific image tag to rollback to (optional)')
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
        SLACK_WEBHOOK = credentials('slack-webhook-url')
        REGISTRY = 'registry.gitlab.example.com'
    }
    
    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    if (!params.ENVIRONMENT) {
                        error "ENVIRONMENT parameter is required"
                    }
                    
                    if (!params.FAILED_BUILD && !params.ROLLBACK_TO_TAG) {
                        error "Either FAILED_BUILD or ROLLBACK_TO_TAG parameter is required"
                    }
                    
                    echo "Rolling back environment: ${params.ENVIRONMENT}"
                    if (params.FAILED_BUILD) {
                        echo "Failed build: ${params.FAILED_BUILD}"
                    }
                    if (params.ROLLBACK_TO_TAG) {
                        echo "Rolling back to tag: ${params.ROLLBACK_TO_TAG}"
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
                            "text": "⚠️ Rollback approval requested for AIC Website\\nEnvironment: ${params.ENVIRONMENT}\\nFailed Build: ${params.FAILED_BUILD}\\nRollback Tag: ${params.ROLLBACK_TO_TAG ?: 'N/A'}\\nApproval URL: ${BUILD_URL}input"
                        }' ${SLACK_WEBHOOK}
                    """
                    
                    // Request approval
                    timeout(time: 1, unit: 'HOURS') {
                        input message: "Rollback ${params.ENVIRONMENT}?", 
                              submitter: approvers.join(','), 
                              submitterParameter: 'APPROVER'
                    }
                    
                    echo "Rollback approved by: ${APPROVER}"
                }
            }
        }
        
        stage('Determine Rollback Version') {
            steps {
                script {
                    if (params.ROLLBACK_TO_TAG) {
                        env.ROLLBACK_TAG = params.ROLLBACK_TO_TAG
                    } else {
                        // Get previous successful deployment from deployment history
                        container('kubectl') {
                            sh """
                                # Get deployment history
                                kubectl rollout history deployment/frontend -n frontend > frontend-history.txt
                                kubectl rollout history deployment/backend-api -n backend-services > backend-history.txt
                                
                                # Get previous revision number
                                FRONTEND_PREV_REVISION=\$(grep -B 1 "successful" frontend-history.txt | head -n 1 | awk '{print \$1}')
                                BACKEND_PREV_REVISION=\$(grep -B 1 "successful" backend-history.txt | head -n 1 | awk '{print \$1}')
                                
                                echo "Previous frontend revision: \${FRONTEND_PREV_REVISION}"
                                echo "Previous backend revision: \${BACKEND_PREV_REVISION}"
                                
                                # Get image tag from previous revision
                                FRONTEND_IMAGE=\$(kubectl rollout history deployment/frontend -n frontend --revision=\${FRONTEND_PREV_REVISION} | grep Image | awk '{print \$2}')
                                BACKEND_IMAGE=\$(kubectl rollout history deployment/backend-api -n backend-services --revision=\${BACKEND_PREV_REVISION} | grep Image | awk '{print \$2}')
                                
                                echo "Previous frontend image: \${FRONTEND_IMAGE}"
                                echo "Previous backend image: \${BACKEND_IMAGE}"
                                
                                # Extract tag from image
                                FRONTEND_TAG=\$(echo \${FRONTEND_IMAGE} | cut -d ':' -f 2)
                                BACKEND_TAG=\$(echo \${BACKEND_IMAGE} | cut -d ':' -f 2)
                                
                                echo "Previous frontend tag: \${FRONTEND_TAG}"
                                echo "Previous backend tag: \${BACKEND_TAG}"
                                
                                # Use frontend tag as rollback tag (assuming all components use same tag)
                                echo "\${FRONTEND_TAG}" > rollback-tag.txt
                            """
                            
                            env.ROLLBACK_TAG = readFile('rollback-tag.txt').trim()
                        }
                    }
                    
                    echo "Rolling back to tag: ${env.ROLLBACK_TAG}"
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
        
        stage('Update Manifests for Rollback') {
            steps {
                container('git') {
                    sh """
                        cd gitops
                        
                        # Update image tags in Kustomize files to rollback version
                        sed -i "s|image: ${REGISTRY}/frontend:.*|image: ${REGISTRY}/frontend:${env.ROLLBACK_TAG}|" apps/frontend/overlays/${params.ENVIRONMENT}/kustomization.yaml
                        sed -i "s|image: ${REGISTRY}/backend:.*|image: ${REGISTRY}/backend:${env.ROLLBACK_TAG}|" apps/backend/overlays/${params.ENVIRONMENT}/kustomization.yaml
                        sed -i "s|image: ${REGISTRY}/ai-services:.*|image: ${REGISTRY}/ai-services:${env.ROLLBACK_TAG}|" apps/ai-services/overlays/${params.ENVIRONMENT}/kustomization.yaml
                        
                        # Commit and push changes
                        git add .
                        git commit -m "Rollback ${params.ENVIRONMENT} to ${env.ROLLBACK_TAG} [skip ci]" || echo "No changes to commit"
                        git push origin main
                    """
                }
            }
        }
        
        stage('Execute Rollback') {
            steps {
                container('kubectl') {
                    script {
                        // Option 1: Use kubectl rollout undo
                        if (params.FAILED_BUILD && !params.ROLLBACK_TO_TAG) {
                            sh """
                                # Rollback using kubectl rollout undo
                                kubectl rollout undo deployment/frontend -n frontend
                                kubectl rollout undo deployment/backend-api -n backend-services
                                kubectl rollout undo deployment/ai-services -n ai-services
                                
                                # Wait for rollback to complete
                                kubectl rollout status deployment/frontend -n frontend
                                kubectl rollout status deployment/backend-api -n backend-services
                                kubectl rollout status deployment/ai-services -n ai-services
                            """
                        } 
                        // Option 2: Apply updated manifests
                        else {
                            sh """
                                # Apply updated manifests
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
            }
        }
        
        stage('Verify Rollback') {
            steps {
                container('kubectl') {
                    sh """
                        # Verify deployment status
                        kubectl get deployments -n frontend
                        kubectl get deployments -n backend-services
                        kubectl get deployments -n ai-services
                        
                        # Verify pods are running
                        kubectl get pods -n frontend
                        kubectl get pods -n backend-services
                        kubectl get pods -n ai-services
                        
                        # Update ConfigMap with rollback info
                        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: deployment-info
  namespace: frontend
data:
  version: "${env.ROLLBACK_TAG}"
  timestamp: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  deployer: "${APPROVER}"
  rollback: "true"
  rollback_from: "${params.FAILED_BUILD}"
EOF
                    """
                }
            }
        }
        
        stage('Smoke Tests') {
            steps {
                container('kubectl') {
                    sh """
                        # Run smoke tests
                        kubectl create job --from=cronjob/smoke-tests smoke-tests-rollback-${BUILD_NUMBER} -n qa
                        
                        # Wait for smoke tests to complete
                        kubectl wait --for=condition=complete job/smoke-tests-rollback-${BUILD_NUMBER} -n qa --timeout=300s
                        
                        # Check if smoke tests passed
                        if kubectl get job smoke-tests-rollback-${BUILD_NUMBER} -n qa -o jsonpath='{.status.succeeded}' | grep -q 1; then
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
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "✅ Rollback successful for AIC Website\\nEnvironment: ${params.ENVIRONMENT}\\nRolled back to: ${env.ROLLBACK_TAG}\\nApproved by: ${APPROVER}\\nBuild URL: ${BUILD_URL}"
                    }' ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "❌ Rollback failed for AIC Website\\nEnvironment: ${params.ENVIRONMENT}\\nAttempted rollback to: ${env.ROLLBACK_TAG}\\nBuild URL: ${BUILD_URL}\\n\\n**URGENT: Manual intervention required!**"
                    }' ${SLACK_WEBHOOK}
                """
            }
        }
    }
}
            ''')
            sandbox()
        }
    }
}
