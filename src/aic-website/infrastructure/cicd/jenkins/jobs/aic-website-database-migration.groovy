// Jenkins Job DSL for AIC Website Database Migration
// This file defines the Jenkins job for running database migrations

pipelineJob('aic-website-database-migration') {
    description('Run database migrations for AIC Website')
    
    parameters {
        stringParam('IMAGE_TAG', '', 'Docker image tag containing the migrations (usually Git commit SHA)')
        choiceParam('ENVIRONMENT', ['development', 'staging', 'production'], 'Deployment environment')
        booleanParam('DRY_RUN', true, 'Run migrations in dry-run mode first')
        booleanParam('BACKUP_BEFORE_MIGRATION', true, 'Create database backup before migration')
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
  - name: postgres
    image: postgres:14-alpine
    command:
    - cat
    tty: true
    env:
    - name: PGPASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
  volumes:
  - name: kubeconfig
    secret:
      secretName: kubeconfig-production
"""
        }
    }
    
    environment {
        SLACK_WEBHOOK = credentials('slack-webhook-url')
        DB_CREDENTIALS = credentials('database-credentials')
    }
    
    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    if (!params.IMAGE_TAG) {
                        error "IMAGE_TAG parameter is required"
                    }
                    
                    echo "Running migrations for image tag: ${params.IMAGE_TAG}"
                    echo "Environment: ${params.ENVIRONMENT}"
                    echo "Dry run: ${params.DRY_RUN}"
                    echo "Backup before migration: ${params.BACKUP_BEFORE_MIGRATION}"
                }
            }
        }
        
        stage('Approval') {
            when {
                expression { return params.ENVIRONMENT == 'production' }
            }
            steps {
                script {
                    // Get approvers from CODEOWNERS file
                    def approvers = ['admin@example.com', 'devops@example.com', 'dba@example.com']
                    
                    // Send notification to Slack
                    sh """
                        curl -X POST -H 'Content-type: application/json' --data '{
                            "text": "Database migration approval requested for AIC Website\\nImage Tag: ${params.IMAGE_TAG}\\nEnvironment: ${params.ENVIRONMENT}\\nApproval URL: ${BUILD_URL}input"
                        }' ${SLACK_WEBHOOK}
                    """
                    
                    // Request approval
                    timeout(time: 24, unit: 'HOURS') {
                        input message: "Run database migrations in ${params.ENVIRONMENT}?", 
                              submitter: approvers.join(','), 
                              submitterParameter: 'APPROVER'
                    }
                    
                    echo "Migration approved by: ${APPROVER}"
                }
            }
        }
        
        stage('Get Database Connection Info') {
            steps {
                container('kubectl') {
                    script {
                        // Get database connection info from Kubernetes secrets
                        sh """
                            # Get database host
                            DB_HOST=\$(kubectl get secret db-connection -n database -o jsonpath='{.data.host}' | base64 --decode)
                            echo "\${DB_HOST}" > db-host.txt
                            
                            # Get database name
                            DB_NAME=\$(kubectl get secret db-connection -n database -o jsonpath='{.data.database}' | base64 --decode)
                            echo "\${DB_NAME}" > db-name.txt
                            
                            # Get database port
                            DB_PORT=\$(kubectl get secret db-connection -n database -o jsonpath='{.data.port}' | base64 --decode)
                            echo "\${DB_PORT}" > db-port.txt
                            
                            # Set up port forwarding if needed
                            if [[ "\${DB_HOST}" == *"rds.amazonaws.com"* ]]; then
                                echo "Using direct connection to RDS"
                            else
                                echo "Setting up port forwarding to database pod"
                                kubectl port-forward service/postgres -n database 5432:5432 &
                                echo "localhost" > db-host.txt
                                sleep 5
                            fi
                        """
                        
                        env.DB_HOST = readFile('db-host.txt').trim()
                        env.DB_NAME = readFile('db-name.txt').trim()
                        env.DB_PORT = readFile('db-port.txt').trim()
                        
                        echo "Database host: ${env.DB_HOST}"
                        echo "Database name: ${env.DB_NAME}"
                        echo "Database port: ${env.DB_PORT}"
                    }
                }
            }
        }
        
        stage('Backup Database') {
            when {
                expression { return params.BACKUP_BEFORE_MIGRATION }
            }
            steps {
                container('postgres') {
                    sh """
                        # Create backup directory
                        mkdir -p backups
                        
                        # Create backup
                        BACKUP_FILE="backups/${params.ENVIRONMENT}-${params.IMAGE_TAG}-\$(date +%Y%m%d%H%M%S).sql.gz"
                        echo "Creating backup: \${BACKUP_FILE}"
                        
                        pg_dump -h ${env.DB_HOST} -p ${env.DB_PORT} -U ${DB_CREDENTIALS_USR} -d ${env.DB_NAME} | gzip > \${BACKUP_FILE}
                        
                        # Verify backup
                        if [ -s \${BACKUP_FILE} ]; then
                            echo "Backup created successfully"
                        else
                            echo "Backup failed"
                            exit 1
                        fi
                    """
                }
                
                // Archive backup
                archiveArtifacts artifacts: 'backups/*.sql.gz', fingerprint: true
            }
        }
        
        stage('Dry Run Migration') {
            when {
                expression { return params.DRY_RUN }
            }
            steps {
                container('kubectl') {
                    sh """
                        # Create migration job with dry-run flag
                        cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-dry-run-${BUILD_NUMBER}
  namespace: database
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      containers:
      - name: migration
        image: registry.gitlab.example.com/backend:${params.IMAGE_TAG}
        command: ["npm", "run", "migrate:dry"]
        env:
        - name: DATABASE_URL
          value: "postgresql://${DB_CREDENTIALS_USR}:${DB_CREDENTIALS_PSW}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}"
      restartPolicy: Never
  backoffLimit: 0
EOF
                        
                        # Wait for job to complete
                        kubectl wait --for=condition=complete job/db-migration-dry-run-${BUILD_NUMBER} -n database --timeout=300s
                        
                        # Get logs
                        kubectl logs job/db-migration-dry-run-${BUILD_NUMBER} -n database > dry-run-logs.txt
                        
                        # Check if dry run was successful
                        if kubectl get job db-migration-dry-run-${BUILD_NUMBER} -n database -o jsonpath='{.status.succeeded}' | grep -q 1; then
                            echo "Dry run successful"
                        else
                            echo "Dry run failed"
                            exit 1
                        fi
                    """
                }
                
                // Archive dry run logs
                archiveArtifacts artifacts: 'dry-run-logs.txt', fingerprint: true
            }
        }
        
        stage('Run Migration') {
            steps {
                container('kubectl') {
                    sh """
                        # Create migration job
                        cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-${BUILD_NUMBER}
  namespace: database
spec:
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      containers:
      - name: migration
        image: registry.gitlab.example.com/backend:${params.IMAGE_TAG}
        command: ["npm", "run", "migrate:up"]
        env:
        - name: DATABASE_URL
          value: "postgresql://${DB_CREDENTIALS_USR}:${DB_CREDENTIALS_PSW}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}"
      restartPolicy: Never
  backoffLimit: 0
EOF
                        
                        # Wait for job to complete
                        kubectl wait --for=condition=complete job/db-migration-${BUILD_NUMBER} -n database --timeout=300s
                        
                        # Get logs
                        kubectl logs job/db-migration-${BUILD_NUMBER} -n database > migration-logs.txt
                        
                        # Check if migration was successful
                        if kubectl get job db-migration-${BUILD_NUMBER} -n database -o jsonpath='{.status.succeeded}' | grep -q 1; then
                            echo "Migration successful"
                        else
                            echo "Migration failed"
                            exit 1
                        fi
                    """
                }
                
                // Archive migration logs
                archiveArtifacts artifacts: 'migration-logs.txt', fingerprint: true
            }
        }
        
        stage('Verify Migration') {
            steps {
                container('postgres') {
                    sh """
                        # Connect to database and check migration status
                        psql -h ${env.DB_HOST} -p ${env.DB_PORT} -U ${DB_CREDENTIALS_USR} -d ${env.DB_NAME} -c "SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 10;" > migration-status.txt
                        
                        # Check if the latest migration is for the current image tag
                        if grep -q "${params.IMAGE_TAG}" migration-status.txt; then
                            echo "Migration verified successfully"
                        else
                            echo "Migration verification failed"
                            cat migration-status.txt
                            exit 1
                        fi
                    """
                }
                
                // Archive migration status
                archiveArtifacts artifacts: 'migration-status.txt', fingerprint: true
            }
        }
    }
    
    post {
        success {
            script {
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "✅ Database migration successful for AIC Website\\nImage Tag: ${params.IMAGE_TAG}\\nEnvironment: ${params.ENVIRONMENT}\\nBuild URL: ${BUILD_URL}"
                    }' ${SLACK_WEBHOOK}
                """
            }
        }
        failure {
            script {
                // Send notification to Slack
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "text": "❌ Database migration failed for AIC Website\\nImage Tag: ${params.IMAGE_TAG}\\nEnvironment: ${params.ENVIRONMENT}\\nBuild URL: ${BUILD_URL}\\n\\n**URGENT: Manual intervention may be required!**"
                    }' ${SLACK_WEBHOOK}
                """
            }
        }
        always {
            // Clean up port forwarding
            sh "pkill -f 'kubectl port-forward' || true"
        }
    }
}
            ''')
            sandbox()
        }
    }
}
