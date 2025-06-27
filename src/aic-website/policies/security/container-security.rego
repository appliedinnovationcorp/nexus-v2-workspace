# Container Security Policies for AIC Website
# Ensures containers follow security best practices

package kubernetes.security.containers

# Deny containers running as root user
deny[msg] {
    input.kind == "Pod"
    input.spec.containers[i].securityContext.runAsUser == 0
    msg := sprintf("Container '%s' should not run as root user (UID 0)", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Deployment"
    input.spec.template.spec.containers[i].securityContext.runAsUser == 0
    msg := sprintf("Container '%s' in deployment should not run as root user (UID 0)", [input.spec.template.spec.containers[i].name])
}

# Deny privileged containers
deny[msg] {
    input.kind == "Pod"
    input.spec.containers[i].securityContext.privileged == true
    msg := sprintf("Container '%s' should not run in privileged mode", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Deployment"
    input.spec.template.spec.containers[i].securityContext.privileged == true
    msg := sprintf("Container '%s' in deployment should not run in privileged mode", [input.spec.template.spec.containers[i].name])
}

# Require non-root filesystem
deny[msg] {
    input.kind == "Pod"
    not input.spec.containers[i].securityContext.readOnlyRootFilesystem
    msg := sprintf("Container '%s' should have read-only root filesystem", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Deployment"
    not input.spec.template.spec.containers[i].securityContext.readOnlyRootFilesystem
    msg := sprintf("Container '%s' in deployment should have read-only root filesystem", [input.spec.template.spec.containers[i].name])
}

# Deny privilege escalation
deny[msg] {
    input.kind == "Pod"
    input.spec.containers[i].securityContext.allowPrivilegeEscalation == true
    msg := sprintf("Container '%s' should not allow privilege escalation", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Deployment"
    input.spec.template.spec.containers[i].securityContext.allowPrivilegeEscalation == true
    msg := sprintf("Container '%s' in deployment should not allow privilege escalation", [input.spec.template.spec.containers[i].name])
}

# Require dropping all capabilities
deny[msg] {
    input.kind == "Pod"
    not input.spec.containers[i].securityContext.capabilities.drop
    msg := sprintf("Container '%s' should drop all capabilities", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Pod"
    not "ALL" in input.spec.containers[i].securityContext.capabilities.drop
    msg := sprintf("Container '%s' should drop ALL capabilities", [input.spec.containers[i].name])
}

# Require resource limits
deny[msg] {
    input.kind == "Pod"
    not input.spec.containers[i].resources.limits.memory
    msg := sprintf("Container '%s' must have memory limits", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Pod"
    not input.spec.containers[i].resources.limits.cpu
    msg := sprintf("Container '%s' must have CPU limits", [input.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Deployment"
    not input.spec.template.spec.containers[i].resources.limits.memory
    msg := sprintf("Container '%s' in deployment must have memory limits", [input.spec.template.spec.containers[i].name])
}

deny[msg] {
    input.kind == "Deployment"
    not input.spec.template.spec.containers[i].resources.limits.cpu
    msg := sprintf("Container '%s' in deployment must have CPU limits", [input.spec.template.spec.containers[i].name])
}

# Require security context at pod level
deny[msg] {
    input.kind == "Pod"
    not input.spec.securityContext.runAsNonRoot
    msg := "Pod must specify runAsNonRoot: true in security context"
}

deny[msg] {
    input.kind == "Deployment"
    not input.spec.template.spec.securityContext.runAsNonRoot
    msg := "Deployment pod template must specify runAsNonRoot: true in security context"
}

# Require seccomp profile
deny[msg] {
    input.kind == "Pod"
    not input.spec.securityContext.seccompProfile
    msg := "Pod must specify seccomp profile"
}

deny[msg] {
    input.kind == "Pod"
    input.spec.securityContext.seccompProfile.type != "RuntimeDefault"
    msg := "Pod seccomp profile must be RuntimeDefault"
}

# Deny host network access
deny[msg] {
    input.kind == "Pod"
    input.spec.hostNetwork == true
    msg := "Pod should not use host network"
}

deny[msg] {
    input.kind == "Deployment"
    input.spec.template.spec.hostNetwork == true
    msg := "Deployment pod template should not use host network"
}

# Deny host PID access
deny[msg] {
    input.kind == "Pod"
    input.spec.hostPID == true
    msg := "Pod should not use host PID namespace"
}

# Deny host IPC access
deny[msg] {
    input.kind == "Pod"
    input.spec.hostIPC == true
    msg := "Pod should not use host IPC namespace"
}
