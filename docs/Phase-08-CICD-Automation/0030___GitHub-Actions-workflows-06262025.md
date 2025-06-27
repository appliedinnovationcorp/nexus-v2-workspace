GitHub Actions workflows have been created in this codebase as part of the CI/CD pipeline 
implementation. Specifically, I can see that a GitHub Actions workflow file has been created at:

/home/oss/Business/workspaces/nexus-v2-workspace/src/aic-website/infrastructure/cicd/github-actions/build-and-test.yml

This workflow file implements several key CI/CD processes:

1. Build and Test Job:
   • Triggered on pushes to main and develop branches, as well as pull requests
   • Sets up Node.js environment
   • Installs dependencies
   • Runs linting
   • Builds the application
   • Runs tests
   • Uploads build artifacts for use in subsequent jobs

2. Security Scan Job:
   • Runs npm audit to check for vulnerabilities
   • Executes OWASP Dependency Check
   • Generates and uploads security reports
   • Fails the build if high severity vulnerabilities are found (CVSS score ≥ 7)

3. Docker Build Job:
   • Only runs on pushes to main or develop branches
   • Downloads the build artifacts from the previous job
   • Sets up Docker Buildx
   • Logs in to GitHub Container Registry
   • Builds and pushes Docker images with appropriate tags
   • Triggers a GitLab CI pipeline via webhook for further processing

The workflow is designed to integrate with the hybrid CI/CD strategy outlined in Feature 002, where 
GitHub Actions handles the initial build and testing, and then hands off to GitLab CI for security 
scanning and compliance checks, which ultimately triggers Jenkins for deployment.