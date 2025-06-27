# Storage Security Policies for AIC Website
# Ensures secure storage configuration and data protection

package kubernetes.storage.security

# Require encryption for persistent volumes
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.namespace in ["backend-services", "ai-services", "cms", "storage"]
    not input.metadata.annotations["volume.kubernetes.io/encrypted"] == "true"
    msg := sprintf("PVC '%s' in production namespace must use encrypted storage", [input.metadata.name])
}

# Require specific storage classes for sensitive data
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.spec.storageClassName in ["encrypted-ssd", "encrypted-premium"]
    msg := sprintf("PVC '%s' with sensitive data must use encrypted storage class", [input.metadata.name])
}

# Deny hostPath volumes in production
deny[msg] {
    input.kind == "Pod"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    input.spec.volumes[i].hostPath
    msg := sprintf("Pod '%s' should not use hostPath volumes in production", [input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    input.spec.template.spec.volumes[i].hostPath
    msg := sprintf("Deployment '%s' should not use hostPath volumes in production", [input.metadata.name])
}

# Require backup labels for persistent data
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.labels["backup-required"] == "true"
    msg := sprintf("PVC '%s' with sensitive data must have backup enabled", [input.metadata.name])
}

# Require retention policy for backups
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["backup-required"] == "true"
    not input.metadata.labels["backup-retention"]
    msg := sprintf("PVC '%s' with backup enabled must specify retention policy", [input.metadata.name])
}

# Validate backup retention periods
valid_backup_retention := ["7d", "30d", "90d", "1y", "3y", "7y"]

deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["backup-retention"]
    not input.metadata.labels["backup-retention"] in valid_backup_retention
    msg := sprintf("PVC '%s' has invalid backup retention. Must be one of: %v", [input.metadata.name, valid_backup_retention])
}

# Require access mode restrictions
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] == "restricted"
    "ReadWriteMany" in input.spec.accessModes
    msg := sprintf("PVC '%s' with restricted data should not use ReadWriteMany access mode", [input.metadata.name])
}

# Require volume size limits
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    not input.spec.resources.requests.storage
    msg := sprintf("PVC '%s' must specify storage size", [input.metadata.name])
}

# Validate storage size for different data classifications
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] == "restricted"
    storage_size := input.spec.resources.requests.storage
    not regex.match("^[0-9]+[GT]i$", storage_size)
    msg := sprintf("PVC '%s' with restricted data has invalid storage size format", [input.metadata.name])
}

# Require snapshot policies for critical data
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.annotations["snapshot.kubernetes.io/policy"]
    msg := sprintf("PVC '%s' with sensitive data must have snapshot policy", [input.metadata.name])
}

# Deny emptyDir for persistent data
deny[msg] {
    input.kind == "Pod"
    input.spec.volumes[i].emptyDir
    input.metadata.labels["data-persistence"] == "required"
    msg := sprintf("Pod '%s' requiring data persistence should not use emptyDir volumes", [input.metadata.name])
}

# Require volume mount security
deny[msg] {
    input.kind == "Pod"
    input.spec.containers[i].volumeMounts[j]
    input.spec.containers[i].volumeMounts[j].readOnly != true
    input.metadata.labels["data-classification"] == "restricted"
    not input.spec.containers[i].volumeMounts[j].name in ["data", "config", "secrets"]
    msg := sprintf("Container '%s' should mount restricted data volumes as read-only when possible", [input.spec.containers[i].name])
}

# Require secure volume permissions
deny[msg] {
    input.kind == "Pod"
    input.spec.securityContext.fsGroup
    input.spec.securityContext.fsGroup == 0
    msg := sprintf("Pod '%s' should not use root group for volume access", [input.metadata.name])
}

# Require storage monitoring labels
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.namespace in ["backend-services", "ai-services", "cms", "storage"]
    not input.metadata.labels["monitoring-enabled"] == "true"
    msg := sprintf("PVC '%s' in production namespace must have monitoring enabled", [input.metadata.name])
}

# Require disaster recovery labels
deny[msg] {
    input.kind == "PersistentVolumeClaim"
    input.metadata.labels["data-classification"] in ["confidential", "restricted"]
    not input.metadata.labels["disaster-recovery"] == "enabled"
    msg := sprintf("PVC '%s' with sensitive data must have disaster recovery enabled", [input.metadata.name])
}

# Validate storage class security features
secure_storage_classes := ["encrypted-ssd", "encrypted-premium", "encrypted-standard"]

deny[msg] {
    input.kind == "StorageClass"
    input.metadata.name in secure_storage_classes
    not input.parameters.encrypted == "true"
    msg := sprintf("StorageClass '%s' marked as encrypted must have encryption parameter", [input.metadata.name])
}

# Require volume expansion capability for production
deny[msg] {
    input.kind == "StorageClass"
    input.metadata.labels["environment"] == "production"
    not input.allowVolumeExpansion == true
    msg := sprintf("Production StorageClass '%s' should allow volume expansion", [input.metadata.name])
}

# Require reclaim policy for production volumes
deny[msg] {
    input.kind == "PersistentVolume"
    input.metadata.labels["environment"] == "production"
    input.spec.persistentVolumeReclaimPolicy == "Delete"
    msg := sprintf("Production PV '%s' should use Retain reclaim policy", [input.metadata.name])
}
