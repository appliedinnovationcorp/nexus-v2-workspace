// Jenkins Job DSL for AIC Website Smoke Tests
// This file defines the Jenkins job for running smoke tests after deployment

pipelineJob('aic-website-smoke-test') {
    description('Run smoke tests for AIC Website')
    
    parameters {
        choiceParam('ENVIRONMENT', ['development', 'staging', 'production'], 'Environment to test')
        stringParam('DEPLOYMENT_ID', '', 'Deployment ID or build number (optional)')
        booleanParam('NOTIFY_ON_SUCCESS', true, 'Send notification on successful tests')
    }
    
    properties {
        disableConcurrentBuilds()
        buildDiscarder {
            strategy {
                logRotator {
                    daysToKeepStr('7')
                    numToKeepStr('10')
                    artifactDaysToKeepStr('3')
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
  - name: playwright
    image: mcr.microsoft.com/playwright:v1.32.0-focal
    command:
    - cat
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
    volumeMounts:
    - name: kubeconfig
      mountPath: /root/.kube
  volumes:
  - name: kubeconfig
    secret:
      secretName: kubeconfig-production
"""
        }
    }
    
    environment {
        SLACK_WEBHOOK = credentials('slack-webhook-url')
    }
    
    stages {
        stage('Determine Test URL') {
            steps {
                script {
                    switch(params.ENVIRONMENT) {
                        case 'development':
                            env.TEST_URL = 'https://dev.example.com'
                            break
                        case 'staging':
                            env.TEST_URL = 'https://staging.example.com'
                            break
                        case 'production':
                            env.TEST_URL = 'https://www.example.com'
                            break
                        default:
                            error "Invalid environment: ${params.ENVIRONMENT}"
                    }
                    
                    echo "Running smoke tests against: ${env.TEST_URL}"
                }
            }
        }
        
        stage('Get Deployment Info') {
            steps {
                container('kubectl') {
                    script {
                        // Get deployment info from ConfigMap
                        sh """
                            # Get deployment info
                            kubectl get configmap deployment-info -n frontend -o yaml > deployment-info.yaml
                            
                            # Extract version
                            VERSION=\$(kubectl get configmap deployment-info -n frontend -o jsonpath='{.data.version}')
                            echo "\${VERSION}" > version.txt
                            
                            # Extract timestamp
                            TIMESTAMP=\$(kubectl get configmap deployment-info -n frontend -o jsonpath='{.data.timestamp}')
                            echo "\${TIMESTAMP}" > timestamp.txt
                        """
                        
                        env.DEPLOYED_VERSION = readFile('version.txt').trim()
                        env.DEPLOYED_TIMESTAMP = readFile('timestamp.txt').trim()
                        
                        echo "Deployed version: ${env.DEPLOYED_VERSION}"
                        echo "Deployed timestamp: ${env.DEPLOYED_TIMESTAMP}"
                    }
                }
            }
        }
        
        stage('Checkout Tests') {
            steps {
                checkout scm: [
                    $class: 'GitSCM',
                    branches: [[name: "*/${env.DEPLOYED_VERSION}"]],
                    userRemoteConfigs: [[
                        url: 'git@gitlab.example.com:aic-website/aic-website.git',
                        credentialsId: 'gitlab-ssh-key'
                    ]]
                ]
            }
        }
        
        stage('Install Dependencies') {
            steps {
                container('playwright') {
                    sh '''
                        cd src/aic-website/tests/smoke
                        npm ci
                    '''
                }
            }
        }
        
        stage('Run Smoke Tests') {
            steps {
                container('playwright') {
                    sh """
                        cd src/aic-website/tests/smoke
                        
                        # Set environment variables for tests
                        export BASE_URL=${env.TEST_URL}
                        export ENVIRONMENT=${params.ENVIRONMENT}
                        
                        # Run tests
                        npx playwright test --reporter=list,html,junit
                    """
                }
            }
        }
        
        stage('Run API Health Checks') {
            steps {
                container('playwright') {
                    sh """
                        cd src/aic-website/tests/smoke
                        
                        # Set environment variables for tests
                        export API_URL=${env.TEST_URL}/api
                        
                        # Run API health checks
                        node api-health-check.js > api-health-results.json
                    """
                }
            }
        }
        
        stage('Run Performance Checks') {
            steps {
                container('playwright') {
                    sh """
                        cd src/aic-website/tests/smoke
                        
                        # Install Lighthouse
                        npm install -g lighthouse
                        
                        # Run Lighthouse
                        lighthouse ${env.TEST_URL} --output json --output html --output-path=./lighthouse-report --chrome-flags="--headless --no-sandbox"
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Archive test results
            archiveArtifacts artifacts: 'src/aic-website/tests/smoke/playwright-report/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'src/aic-website/tests/smoke/api-health-results.json', allowEmptyArchive: true
            archiveArtifacts artifacts: 'src/aic-website/tests/smoke/lighthouse-report.*', allowEmptyArchive: true
            
            // Publish JUnit results
            junit 'src/aic-website/tests/smoke/results.xml'
        }
        success {
            script {
                if (params.NOTIFY_ON_SUCCESS) {
                    // Send notification to Slack
                    sh """
                        curl -X POST -H 'Content-type: application/json' --data '{
                            "text": "✅ Smoke tests passed for AIC Website\\nEnvironment: ${params.ENVIRONMENT}\\nVersion: ${env.DEPLOYED_VERSION}\\nBuild URL: ${BUILD_URL}"
                        }' ${SLACK_WEBHOOK}
                    """
                }
            }
        }
        failure {
            script {
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "❌ Smoke tests failed for AIC Website\\nEnvironment: ${params.ENVIRONMENT}\\nVersion: ${env.DEPLOYED_VERSION}\\nBuild URL: ${BUILD_URL}\\n\\n**Investigation required!**"
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
