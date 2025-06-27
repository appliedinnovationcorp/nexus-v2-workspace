package gitlab.security

# Import common functions
import data.gitlab.common

# Default to deny
default allow = false

# Allow if all security checks pass
allow {
    has_required_security_jobs
    has_valid_image_references
    no_privileged_jobs_without_approval
    no_sensitive_data_in_variables
    valid_deployment_targets
}

# Check if pipeline has required security jobs
has_required_security_jobs {
    required_jobs := {"sast", "dependency-scanning", "secret-detection"}
    pipeline_jobs := {job_name | job_name = input.pipeline.jobs[_].name}
    
    # All required jobs must be in the pipeline
    missing_jobs := required_jobs - pipeline_jobs
    count(missing_jobs) == 0
}

# Check if all image references are from approved registries
has_valid_image_references {
    approved_registries := {
        "registry.gitlab.com",
        "docker.io/library",
        "gcr.io/distroless",
        "mcr.microsoft.com"
    }
    
    # Get all image references from jobs
    images := {img | img = input.pipeline.jobs[_].image}
    
    # Check each image
    image_count := count(images)
    valid_count := count({img | img = images[_]; registry_is_approved(img, approved_registries)})
    
    image_count == valid_count
}

# Helper function to check if an image is from an approved registry
registry_is_approved(image, approved_registries) {
    startswith(image, registry)
    registry = approved_registries[_]
}

# Check if privileged jobs have proper approval
no_privileged_jobs_without_approval {
    privileged_jobs := {job | job = input.pipeline.jobs[_]; job.options.docker.privileged == true}
    
    # If there are privileged jobs, they must have approval
    count(privileged_jobs) == 0 or
    all_jobs_have_approval(privileged_jobs)
}

# Helper function to check if all jobs have approval
all_jobs_have_approval(jobs) {
    job = jobs[_]
    job.approved_by != null
}

# Check for sensitive data in variables
no_sensitive_data_in_variables {
    # Patterns for sensitive data
    sensitive_patterns := [
        "password",
        "token",
        "key",
        "secret",
        "credential"
    ]
    
    # Get all variable names
    variables := {var_name | var_name = input.pipeline.variables[_].key}
    
    # Check each variable name against sensitive patterns
    sensitive_vars := {var_name | 
        var_name = variables[_]
        pattern = sensitive_patterns[_]
        contains(lower(var_name), pattern)
        not is_masked_variable(var_name)
    }
    
    count(sensitive_vars) == 0
}

# Helper function to check if a variable is masked
is_masked_variable(var_name) {
    var = input.pipeline.variables[_]
    var.key == var_name
    var.masked == true
}

# Check if deployment targets are valid
valid_deployment_targets {
    # Get all deployment jobs
    deploy_jobs := {job | job = input.pipeline.jobs[_]; startswith(job.name, "deploy-")}
    
    # Check each deployment job
    count(deploy_jobs) == 0 or
    all_deploy_jobs_valid(deploy_jobs)
}

# Helper function to check if all deployment jobs are valid
all_deploy_jobs_valid(jobs) {
    job = jobs[_]
    
    # Check if environment is specified
    job.environment.name != null
    
    # Check if environment is in allowed list based on branch
    is_valid_environment_for_branch(job.environment.name, input.pipeline.source_branch)
}

# Helper function to check if environment is valid for branch
is_valid_environment_for_branch(env, branch) {
    # Main branch can deploy to dev or staging
    branch == "main"
    env = "development"
}

is_valid_environment_for_branch(env, branch) {
    # Main branch can deploy to dev or staging
    branch == "main"
    env = "staging"
}

is_valid_environment_for_branch(env, branch) {
    # Release branches can deploy to staging
    startswith(branch, "release/")
    env = "staging"
}

is_valid_environment_for_branch(env, branch) {
    # Tags can deploy to production
    startswith(branch, "v")
    contains(branch, ".")
    env = "production"
}

# Violation messages for better error reporting
violation[msg] {
    not has_required_security_jobs
    msg := "Pipeline is missing required security jobs: SAST, dependency scanning, or secret detection"
}

violation[msg] {
    not has_valid_image_references
    msg := "Pipeline contains jobs with unapproved Docker image references"
}

violation[msg] {
    not no_privileged_jobs_without_approval
    msg := "Pipeline contains privileged jobs without proper approval"
}

violation[msg] {
    not no_sensitive_data_in_variables
    msg := "Pipeline contains unmasked sensitive variables"
}

violation[msg] {
    not valid_deployment_targets
    msg := "Pipeline contains deployment jobs with invalid target environments for the branch"
}
