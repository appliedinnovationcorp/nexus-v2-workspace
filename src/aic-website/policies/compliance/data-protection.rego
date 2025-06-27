# Data Protection and Compliance Policies for AIC Website
# Ensures GDPR, CCPA, and other data protection compliance

package kubernetes.compliance.dataprotection

# Require data classification labels
deny[msg] {
    input.kind in ["Secret", "ConfigMap", "PersistentVolumeClaim"]
    input.metadata.namespace in ["backend-services", "ai-services", "cms", "storage"]
    not input.metadata.labels["data-classification"]
    msg := sprintf("%s '%s' must have data-classification label", [input.kind, input.metadata.name])
}

# Validate data classification values
valid_classifications := ["public", "internal", "confidential", "restricted"]

deny[msg] {
    input.kind in ["Secret", "ConfigMap", "PersistentVolumeClaim"]
    input.metadata.labels["data-classification"]
    not input.metadata.labels["data-classification"] in valid_classifications
    msg := sprintf("%s '%s' has invalid data-classification. Must be one of: %v", [input.kind, input.metadata.name, valid_classifications])
}

# Require encryption for restricted data
deny[msg] {
    input.kind == "Secret"
    input.metadata.labels["data-classification"] == "restricted"
    not input.metadata.annotations["encryption.kubernetes.io/enabled"] == "true"
    msg := sprintf("Secret '%s' with restricted data must have encryption enabled", [input.metadata.name])
}

deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.annotations["volume.kubernetes.io/encrypted"] == "true"
    msg := sprintf("PVC '%s' with sensitive data must use encrypted storage", [input.metadata.name])
}

# Require data retention labels
deny[msg] {
    input.kind in ["Secret", "ConfigMap"]
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.labels["data-retention"]
    msg := sprintf("%s '%s' with sensitive data must have data-retention label", [input.kind, input.metadata.name])
}

# Validate data retention periods
valid_retention_periods := ["30d", "90d", "1y", "3y", "7y", "permanent"]

deny[msg] {
    input.kind in ["Secret", "ConfigMap"]
    input.metadata.labels["data-retention"]
    not input.metadata.labels["data-retention"] in valid_retention_periods
    msg := sprintf("%s '%s' has invalid data-retention period. Must be one of: %v", [input.kind, input.metadata.name, valid_retention_periods])
}

# Require data subject rights compliance labels
deny[msg] {
    input.kind in ["Secret", "ConfigMap", "PersistentVolumeClaim"]
    input.metadata.labels["data-classification"] == "restricted"
    contains(input.metadata.name, "user")
    not input.metadata.labels["gdpr-subject-rights"] == "enabled"
    msg := sprintf("%s '%s' containing user data must support GDPR subject rights", [input.kind, input.metadata.name])
}

# Require audit logging for sensitive data access
deny[msg] {
    input.kind == "Pod"
    input.metadata.labels["data-access"] == "restricted"
    not input.metadata.annotations["audit.kubernetes.io/enabled"] == "true"
    msg := sprintf("Pod '%s' accessing restricted data must have audit logging enabled", [input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    input.spec.template.metadata.labels["data-access"] == "restricted"
    not input.spec.template.metadata.annotations["audit.kubernetes.io/enabled"] == "true"
    msg := sprintf("Deployment '%s' accessing restricted data must have audit logging enabled", [input.metadata.name])
}

# Require data processing purpose labels
deny[msg] {
    input.kind == "Pod"
    input.metadata.labels["data-access"] in ["confidential", "restricted"]
    not input.metadata.labels["data-processing-purpose"]
    msg := sprintf("Pod '%s' accessing sensitive data must specify processing purpose", [input.metadata.name])
}

# Validate data processing purposes
valid_purposes := ["analytics", "personalization", "security", "operations", "compliance", "marketing"]

deny[msg] {
    input.kind == "Pod"
    input.metadata.labels["data-processing-purpose"]
    not input.metadata.labels["data-processing-purpose"] in valid_purposes
    msg := sprintf("Pod '%s' has invalid data processing purpose. Must be one of: %v", [input.metadata.name, valid_purposes])
}

# Require consent tracking for marketing data
deny[msg] {
    input.kind == "Pod"
    input.metadata.labels["data-processing-purpose"] == "marketing"
    not input.metadata.labels["consent-required"] == "true"
    msg := sprintf("Pod '%s' processing marketing data must require consent", [input.metadata.name])
}

# Require data minimization labels
deny[msg] {
    input.kind in ["Secret", "ConfigMap"]
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.labels["data-minimization"] == "applied"
    msg := sprintf("%s '%s' with sensitive data must apply data minimization", [input.kind, input.metadata.name])
}

# Require cross-border transfer compliance
deny[msg] {
    input.kind == "Pod"
    input.metadata.labels["data-access"] == "restricted"
    input.metadata.labels["data-location"] != "eu"
    not input.metadata.labels["cross-border-transfer"] == "compliant"
    msg := sprintf("Pod '%s' with cross-border data transfer must be compliant", [input.metadata.name])
}

# Require privacy by design labels
deny[msg] {
    input.kind == "Deployment"
    input.metadata.namespace in ["backend-services", "ai-services"]
    input.spec.template.metadata.labels["data-access"] in ["confidential", "restricted"]
    not input.spec.template.metadata.labels["privacy-by-design"] == "implemented"
    msg := sprintf("Deployment '%s' handling sensitive data must implement privacy by design", [input.metadata.name])
}

# Require data breach notification capability
deny[msg] {
    input.kind == "Service"
    input.metadata.labels["data-access"] == "restricted"
    not input.metadata.annotations["breach-notification.kubernetes.io/enabled"] == "true"
    msg := sprintf("Service '%s' handling restricted data must support breach notification", [input.metadata.name])
}

# Require data anonymization for analytics
deny[msg] {
    input.kind == "Pod"
    input.metadata.labels["data-processing-purpose"] == "analytics"
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.labels["data-anonymization"] == "enabled"
    msg := sprintf("Pod '%s' using sensitive data for analytics must enable anonymization", [input.metadata.name])
}
