# Jenkins CI/CD Integration

This directory contains Jenkins job configurations and scripts for the AIC Website project. Jenkins is used as part of our hybrid CI/CD approach as defined in [ADR-0007](../../../docs/adr/0007-ci-cd-pipeline.md), focusing on complex deployment orchestration, particularly for production environments.

## Overview

Jenkins is responsible for:

1. Production deployments with approval workflows
2. Complex deployment orchestrations
3. Environment-specific configurations
4. Custom deployment scripts
5. Integration with legacy systems

## Integration with GitLab CI

GitLab CI triggers Jenkins jobs for production deployments using the Jenkins API. The workflow is as follows:

1. GitLab CI builds and tests the application
2. GitLab CI deploys to development and staging environments
3. When ready for production, GitLab CI triggers a Jenkins job
4. Jenkins handles the production deployment with approval gates

## Job Structure

The Jenkins jobs are organized as follows:

- `aic-website-production-deploy`: Main production deployment job
- `aic-website-rollback`: Rollback job for reverting failed deployments
- `aic-website-database-migration`: Database migration job
- `aic-website-smoke-test`: Post-deployment smoke tests

## Configuration as Code

Jenkins is configured using the "Configuration as Code" (JCasC) approach. The configuration files are stored in the `config` directory.

## Shared Libraries

Custom Jenkins shared libraries are stored in the `shared-libraries` directory. These libraries provide reusable functions for deployments, notifications, and other common tasks.

## Credentials

Jenkins credentials are managed using the Jenkins Credentials Plugin. The credentials are referenced in the job configurations but are not stored in the repository.

## Usage

### Setting Up Jenkins

1. Install Jenkins with the required plugins
2. Configure Jenkins using the JCasC files in the `config` directory
3. Set up the required credentials in Jenkins

### Creating Jobs

1. Use the Jenkins Job DSL to create jobs from the configurations in the `jobs` directory
2. Alternatively, import the job configurations manually through the Jenkins UI

### Triggering Jobs

Jobs can be triggered in several ways:

1. From GitLab CI using the Jenkins API
2. Manually through the Jenkins UI
3. Via webhooks for specific events

## Required Plugins

- Kubernetes Plugin
- Pipeline Plugin
- Job DSL Plugin
- Configuration as Code Plugin
- Credentials Plugin
- Approval Plugin
- Blue Ocean Plugin
- GitLab Plugin

## References

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Jenkins Kubernetes Plugin](https://plugins.jenkins.io/kubernetes/)
- [Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/)
- [Jenkins Job DSL](https://plugins.jenkins.io/job-dsl/)
- [Jenkins Configuration as Code](https://www.jenkins.io/projects/jcasc/)
