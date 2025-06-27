# RBAC Security Policies for AIC Website
# Ensures proper role-based access control

package kubernetes.security.rbac

# Deny cluster-admin role bindings for regular users
deny[msg] {
    input.kind == "ClusterRoleBinding"
    input.roleRef.name == "cluster-admin"
    input.subjects[i].kind == "User"
    not startswith(input.subjects[i].name, "system:")
    msg := sprintf("User '%s' should not have cluster-admin privileges", [input.subjects[i].name])
}

# Deny overly permissive roles
deny[msg] {
    input.kind == "Role"
    input.rules[i].verbs[_] == "*"
    input.rules[i].resources[_] == "*"
    msg := sprintf("Role '%s' should not have wildcard permissions on all resources", [input.metadata.name])
}

deny[msg] {
    input.kind == "ClusterRole"
    input.rules[i].verbs[_] == "*"
    input.rules[i].resources[_] == "*"
    not input.metadata.name in ["cluster-admin", "admin"]
    msg := sprintf("ClusterRole '%s' should not have wildcard permissions on all resources", [input.metadata.name])
}

# Require specific resource permissions instead of wildcards
deny[msg] {
    input.kind == "Role"
    input.rules[i].resources[_] == "*"
    not input.rules[i].verbs[_] in ["get", "list", "watch"]
    msg := sprintf("Role '%s' should specify explicit resources instead of wildcards for write operations", [input.metadata.name])
}

# Deny access to secrets for non-admin roles
deny[msg] {
    input.kind == "Role"
    input.rules[i].resources[_] == "secrets"
    input.rules[i].verbs[_] in ["create", "update", "patch", "delete"]
    not input.metadata.name in ["admin", "secret-manager"]
    msg := sprintf("Role '%s' should not have write access to secrets", [input.metadata.name])
}

# Require service account for role bindings
deny[msg] {
    input.kind == "RoleBinding"
    input.subjects[i].kind == "User"
    not startswith(input.subjects[i].name, "system:")
    not input.subjects[i].name in ["admin@aicorp.com", "security@aicorp.com"]
    msg := sprintf("RoleBinding '%s' should use service accounts instead of user accounts", [input.metadata.name])
}

# Deny default service account usage in production
deny[msg] {
    input.kind == "Pod"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    input.spec.serviceAccountName == "default"
    msg := "Production pods should not use the default service account"
}

deny[msg] {
    input.kind == "Deployment"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    input.spec.template.spec.serviceAccountName == "default"
    msg := "Production deployments should not use the default service account"
}

# Require automountServiceAccountToken to be explicitly set
deny[msg] {
    input.kind == "ServiceAccount"
    not has_field(input, "automountServiceAccountToken")
    msg := sprintf("ServiceAccount '%s' should explicitly set automountServiceAccountToken", [input.metadata.name])
}

# Deny automounting service account tokens when not needed
deny[msg] {
    input.kind == "Pod"
    input.spec.automountServiceAccountToken == true
    not input.metadata.labels["requires-service-account"] == "true"
    msg := "Pod should not automount service account token unless explicitly required"
}

# Helper function to check if field exists
has_field(obj, field) {
    obj[field]
}

has_field(obj, field) {
    obj[field] == false
}
