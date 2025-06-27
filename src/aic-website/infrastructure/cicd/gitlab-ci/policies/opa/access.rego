package gitlab.access

# Default to deny
default allow = false

# Allow if all access checks pass
allow {
    valid_user_permissions
    valid_protected_variables_access
    valid_environment_access
    valid_runner_access
    valid_trigger_access
}

# Check if user has valid permissions for the job
valid_user_permissions {
    # Get user role
    user_role := input.user.role
    
    # Get job name
    job_name := input.job.name
    
    # Check if user has permission for the job
    has_permission_for_job(user_role, job_name)
}

# Helper function to check if user has permission for job
has_permission_for_job(role, job_name) {
    # Admin can run any job
    role == "admin"
}

has_permission_for_job(role, job_name) {
    # Maintainer can run any job except production deployment
    role == "maintainer"
    job_name != "trigger-jenkins-production-deploy"
}

has_permission_for_job(role, job_name) {
    # Developer can run development jobs
    role == "developer"
    
    allowed_prefixes := {
        "build-",
        "test-",
        "lint",
        "validate-",
        "deploy-dev"
    }
    
    some prefix in allowed_prefixes
    startswith(job_name, prefix)
}

has_permission_for_job(role, job_name) {
    # Release manager can run deployment jobs
    role == "release_manager"
    
    allowed_prefixes := {
        "deploy-",
        "trigger-jenkins-production-deploy"
    }
    
    some prefix in allowed_prefixes
    startswith(job_name, prefix)
}

# Check if job has valid access to protected variables
valid_protected_variables_access {
    # Get protected variables
    protected_vars := {var_name | 
        var = input.pipeline.variables[_]
        var.protected == true
        var_name = var.key
    }
    
    # If no protected variables, access is valid
    count(protected_vars) == 0
}

valid_protected_variables_access {
    # Get protected variables
    protected_vars := {var_name | 
        var = input.pipeline.variables[_]
        var.protected == true
        var_name = var.key
    }
    
    # Get job branch
    branch := input.pipeline.source_branch
    
    # Protected variables can only be accessed from protected branches
    protected_branches := {"main", "master", "production"}
    branch_is_protected(branch, protected_branches)
}

valid_protected_variables_access {
    # Get protected variables
    protected_vars := {var_name | 
        var = input.pipeline.variables[_]
        var.protected == true
        var_name = var.key
    }
    
    # Get job branch
    branch := input.pipeline.source_branch
    
    # Protected variables can only be accessed from release branches
    startswith(branch, "release/")
}

# Helper function to check if branch is protected
branch_is_protected(branch, protected_branches) {
    branch = protected_branches[_]
}

# Check if job has valid access to environments
valid_environment_access {
    # Get job environment
    not input.job.environment
}

valid_environment_access {
    # Get job environment
    env := input.job.environment.name
    
    # Get user role
    user_role := input.user.role
    
    # Check if user has permission for the environment
    has_permission_for_environment(user_role, env)
}

# Helper function to check if user has permission for environment
has_permission_for_environment(role, env) {
    # Admin can access any environment
    role == "admin"
}

has_permission_for_environment(role, env) {
    # Maintainer can access dev and staging
    role == "maintainer"
    env != "production"
}

has_permission_for_environment(role, env) {
    # Developer can access dev
    role == "developer"
    env == "development"
}

has_permission_for_environment(role, env) {
    # Release manager can access any environment
    role == "release_manager"
}

# Check if job has valid access to runners
valid_runner_access {
    # Get job tags
    job_tags := {tag | tag = input.job.tags[_]}
    
    # Get allowed tags for user role
    user_role := input.user.role
    allowed_tags := allowed_tags_for_role(user_role)
    
    # Check if all job tags are allowed
    count(job_tags - allowed_tags) == 0
}

# Helper function to get allowed tags for role
allowed_tags_for_role(role) {
    # Admin can use any tag
    role == "admin"
    
    {
        "kubernetes",
        "docker",
        "aws",
        "gcp",
        "azure",
        "production",
        "gpu"
    }
}

allowed_tags_for_role(role) {
    # Maintainer can use most tags
    role == "maintainer"
    
    {
        "kubernetes",
        "docker",
        "aws",
        "gcp",
        "azure"
    }
}

allowed_tags_for_role(role) {
    # Developer can use basic tags
    role == "developer"
    
    {
        "kubernetes",
        "docker"
    }
}

allowed_tags_for_role(role) {
    # Release manager can use deployment tags
    role == "release_manager"
    
    {
        "kubernetes",
        "docker",
        "aws",
        "gcp",
        "azure",
        "production"
    }
}

# Check if job has valid access to triggers
valid_trigger_access {
    # Check if job is triggered
    not input.job.trigger
}

valid_trigger_access {
    # Get trigger user
    trigger_user := input.job.trigger.user
    
    # Get allowed trigger users
    allowed_triggers := {
        "pipeline",
        "api",
        "schedule"
    }
    
    # Check if trigger user is allowed
    trigger_user = allowed_triggers[_]
}

valid_trigger_access {
    # Get trigger user
    trigger_user := input.job.trigger.user
    
    # Get user role
    user_role := input.user.role
    
    # Check if user has permission to trigger
    has_permission_to_trigger(user_role)
}

# Helper function to check if user has permission to trigger
has_permission_to_trigger(role) {
    # Admin, maintainer, and release manager can trigger
    role = "admin"
}

has_permission_to_trigger(role) {
    # Admin, maintainer, and release manager can trigger
    role = "maintainer"
}

has_permission_to_trigger(role) {
    # Admin, maintainer, and release manager can trigger
    role = "release_manager"
}

# Violation messages for better error reporting
violation[msg] {
    not valid_user_permissions
    msg := "User does not have permission to run this job"
}

violation[msg] {
    not valid_protected_variables_access
    msg := "Protected variables can only be accessed from protected branches"
}

violation[msg] {
    not valid_environment_access
    msg := "User does not have permission to access this environment"
}

violation[msg] {
    not valid_runner_access
    msg := "Job uses runner tags that are not allowed for this user role"
}

violation[msg] {
    not valid_trigger_access
    msg := "User does not have permission to trigger this job"
}
