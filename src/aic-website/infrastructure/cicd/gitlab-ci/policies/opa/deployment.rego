package gitlab.deployment

# Default to deny
default allow = false

# Allow if all deployment checks pass
allow {
    valid_deployment_sequence
    valid_environment_variables
    valid_kubernetes_resources
    valid_deployment_schedule
    valid_rollback_strategy
}

# Check if deployment sequence is valid
valid_deployment_sequence {
    # Get all deployment jobs
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # If no deployment jobs, sequence is valid
    count(deploy_jobs) == 0
}

valid_deployment_sequence {
    # Check if deploying to staging after dev
    deploying_to_staging := count([job | job = input.pipeline.jobs[_]; job.name == "deploy-staging"]) > 0
    
    # If deploying to staging, must have deploy-dev job
    not deploying_to_staging or
    count([job | job = input.pipeline.jobs[_]; job.name == "deploy-dev"]) > 0
}

valid_deployment_sequence {
    # Check if deploying to production after staging
    deploying_to_prod := count([job | job = input.pipeline.jobs[_]; job.name == "trigger-jenkins-production-deploy"]) > 0
    
    # If deploying to production, must have deploy-staging job
    not deploying_to_prod or
    count([job | job = input.pipeline.jobs[_]; job.name == "deploy-staging"]) > 0
}

# Check if environment variables are valid for deployment
valid_environment_variables {
    # Get all deployment jobs
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # If no deployment jobs, variables are valid
    count(deploy_jobs) == 0
}

valid_environment_variables {
    # Required variables for deployment
    required_vars := {"KUBE_CONFIG", "CI_REGISTRY_USER", "CI_REGISTRY_PASSWORD"}
    
    # Get all variable names
    variables := {var_name | var_name = input.pipeline.variables[_].key}
    
    # Check if all required variables are present
    missing_vars := required_vars - variables
    count(missing_vars) == 0
}

# Check if Kubernetes resources are valid
valid_kubernetes_resources {
    # Get all deployment jobs
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # If no deployment jobs, resources are valid
    count(deploy_jobs) == 0
}

valid_kubernetes_resources {
    # Check if resource limits are set for deployments
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # For each deployment job, check if it has resource limits in script
    job = deploy_jobs[_]
    contains(job.script, "resources")
    contains(job.script, "limits")
    contains(job.script, "requests")
}

# Check if deployment schedule is valid
valid_deployment_schedule {
    # Get current time
    current_hour := time.now_ns() / 3600000000000 % 24
    
    # Get all deployment jobs
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # If no deployment jobs, schedule is valid
    count(deploy_jobs) == 0
}

valid_deployment_schedule {
    # Get current time
    current_hour := time.now_ns() / 3600000000000 % 24
    
    # Check if deploying to production during business hours (9 AM - 5 PM)
    deploying_to_prod := count([job | job = input.pipeline.jobs[_]; job.name == "trigger-jenkins-production-deploy"]) > 0
    
    # If deploying to production, must be during business hours
    not deploying_to_prod or
    (current_hour >= 9 and current_hour < 17)
}

# Check if rollback strategy is valid
valid_rollback_strategy {
    # Get all deployment jobs
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # If no deployment jobs, rollback strategy is valid
    count(deploy_jobs) == 0
}

valid_rollback_strategy {
    # Check if rollback is configured for deployments
    deploy_jobs := [job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")]
    
    # For each deployment job, check if it has rollback strategy in script
    job = deploy_jobs[_]
    contains(job.script, "rollout")
    contains(job.script, "status")
}

# Violation messages for better error reporting
violation[msg] {
    not valid_deployment_sequence
    msg := "Invalid deployment sequence: must deploy to dev before staging, and staging before production"
}

violation[msg] {
    not valid_environment_variables
    msg := "Missing required environment variables for deployment"
}

violation[msg] {
    not valid_kubernetes_resources
    msg := "Deployment jobs must specify resource limits and requests"
}

violation[msg] {
    not valid_deployment_schedule
    msg := "Production deployments must occur during business hours (9 AM - 5 PM)"
}

violation[msg] {
    not valid_rollback_strategy
    msg := "Deployment jobs must include rollback strategy"
}
