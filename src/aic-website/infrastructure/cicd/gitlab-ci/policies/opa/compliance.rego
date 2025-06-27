package gitlab.compliance

# Default to deny
default allow = false

# Allow if all compliance checks pass
allow {
    has_required_compliance_jobs
    has_license_scanning
    has_accessibility_check
    production_changes_have_approval
    meets_branch_protection_rules
}

# Check if pipeline has required compliance jobs
has_required_compliance_jobs {
    required_jobs := {"compliance-check"}
    pipeline_jobs := {job_name | job_name = input.pipeline.jobs[_].name}
    
    # All required jobs must be in the pipeline for main branch
    input.pipeline.source_branch == "main"
    missing_jobs := required_jobs - pipeline_jobs
    count(missing_jobs) == 0
}

# Non-main branches don't require compliance jobs
has_required_compliance_jobs {
    input.pipeline.source_branch != "main"
}

# Check if pipeline has license scanning for main branch
has_license_scanning {
    input.pipeline.source_branch == "main"
    
    license_jobs := {job | job = input.pipeline.jobs[_]; job.name == "license-scanning"}
    count(license_jobs) > 0
}

# Non-main branches don't require license scanning
has_license_scanning {
    input.pipeline.source_branch != "main"
}

# Check if pipeline has accessibility check for production deployments
has_accessibility_check {
    # Only check for production deployments
    deploy_jobs := {job | job = input.pipeline.jobs[_]; job.name == "trigger-jenkins-production-deploy"}
    count(deploy_jobs) == 0
}

has_accessibility_check {
    # If deploying to production, must have accessibility check
    deploy_jobs := {job | job = input.pipeline.jobs[_]; job.name == "trigger-jenkins-production-deploy"}
    count(deploy_jobs) > 0
    
    a11y_jobs := {job | job = input.pipeline.jobs[_]; job.name == "accessibility-check"}
    count(a11y_jobs) > 0
}

# Check if production changes have approval
production_changes_have_approval {
    # Only check for production deployments
    deploy_jobs := {job | job = input.pipeline.jobs[_]; job.name == "trigger-jenkins-production-deploy"}
    count(deploy_jobs) == 0
}

production_changes_have_approval {
    # If deploying to production, must have approval
    deploy_jobs := {job | job = input.pipeline.jobs[_]; job.name == "trigger-jenkins-production-deploy"}
    job = deploy_jobs[_]
    
    # Check if job has approval
    job.approved_by != null
    
    # Check if approval is from authorized user
    is_authorized_approver(job.approved_by)
}

# Helper function to check if user is authorized approver
is_authorized_approver(user) {
    authorized_approvers := {
        "project_owner",
        "maintainer",
        "release_manager"
    }
    
    user.role = authorized_approvers[_]
}

# Check if branch protection rules are met
meets_branch_protection_rules {
    # Only check for protected branches
    protected_branches := {"main", "master", "production"}
    branch := input.pipeline.source_branch
    
    not branch_is_protected(branch, protected_branches)
}

meets_branch_protection_rules {
    # If branch is protected, check protection rules
    protected_branches := {"main", "master", "production"}
    branch := input.pipeline.source_branch
    
    branch_is_protected(branch, protected_branches)
    
    # Check if pipeline has required status checks
    required_status_checks := {"unit-tests", "integration-tests", "sast"}
    pipeline_jobs := {job_name | job_name = input.pipeline.jobs[_].name}
    
    missing_checks := required_status_checks - pipeline_jobs
    count(missing_checks) == 0
}

# Helper function to check if branch is protected
branch_is_protected(branch, protected_branches) {
    branch = protected_branches[_]
}

branch_is_protected(branch, protected_branches) {
    startswith(branch, "release/")
}

# Violation messages for better error reporting
violation[msg] {
    not has_required_compliance_jobs
    msg := "Pipeline on main branch is missing required compliance jobs"
}

violation[msg] {
    not has_license_scanning
    msg := "Pipeline on main branch is missing license scanning"
}

violation[msg] {
    not has_accessibility_check
    msg := "Production deployment pipeline is missing accessibility check"
}

violation[msg] {
    not production_changes_have_approval
    msg := "Production deployment requires approval from an authorized user"
}

violation[msg] {
    not meets_branch_protection_rules
    msg := "Pipeline does not meet branch protection rules for protected branches"
}
