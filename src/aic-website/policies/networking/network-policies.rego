# Network Security Policies for AIC Website
# Ensures proper network segmentation and security

package kubernetes.networking.security

# Require network policies in production namespaces
deny[msg] {
    input.kind == "Namespace"
    input.metadata.name in ["backend-services", "ai-services", "cms", "storage"]
    not input.metadata.labels["network-policy"] == "enabled"
    msg := sprintf("Production namespace '%s' must have network policies enabled", [input.metadata.name])
}

# Deny pods without network policy labels in production
deny[msg] {
    input.kind == "Pod"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    not input.metadata.labels["network-policy-group"]
    msg := sprintf("Pod '%s' in production namespace must have network-policy-group label", [input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    not input.spec.template.metadata.labels["network-policy-group"]
    msg := sprintf("Deployment '%s' in production namespace must have network-policy-group label", [input.metadata.name])
}

# Deny overly permissive network policies
deny[msg] {
    input.kind == "NetworkPolicy"
    input.spec.ingress[i].from == []
    msg := sprintf("NetworkPolicy '%s' should not allow ingress from all sources", [input.metadata.name])
}

deny[msg] {
    input.kind == "NetworkPolicy"
    input.spec.egress[i].to == []
    not input.spec.egress[i].ports
    msg := sprintf("NetworkPolicy '%s' should not allow unrestricted egress", [input.metadata.name])
}

# Require explicit port specifications
deny[msg] {
    input.kind == "NetworkPolicy"
    input.spec.ingress[i]
    not input.spec.ingress[i].ports
    msg := sprintf("NetworkPolicy '%s' ingress rules must specify explicit ports", [input.metadata.name])
}

# Deny access to sensitive ports
sensitive_ports := [22, 3389, 5432, 6379, 27017, 9200, 9300]

deny[msg] {
    input.kind == "Service"
    input.spec.ports[i].port in sensitive_ports
    input.spec.type == "LoadBalancer"
    msg := sprintf("Service '%s' should not expose sensitive port %d via LoadBalancer", [input.metadata.name, input.spec.ports[i].port])
}

deny[msg] {
    input.kind == "Service"
    input.spec.ports[i].port in sensitive_ports
    input.spec.type == "NodePort"
    msg := sprintf("Service '%s' should not expose sensitive port %d via NodePort", [input.metadata.name, input.spec.ports[i].port])
}

# Require TLS for external services
deny[msg] {
    input.kind == "Ingress"
    not input.spec.tls
    msg := sprintf("Ingress '%s' must use TLS", [input.metadata.name])
}

deny[msg] {
    input.kind == "Ingress"
    input.spec.tls[i]
    not input.spec.tls[i].secretName
    msg := sprintf("Ingress '%s' TLS configuration must specify secretName", [input.metadata.name])
}

# Deny HTTP-only ingress for production
deny[msg] {
    input.kind == "Ingress"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    input.metadata.annotations["nginx.ingress.kubernetes.io/ssl-redirect"] == "false"
    msg := sprintf("Production ingress '%s' should not disable SSL redirect", [input.metadata.name])
}

# Require network policy for database services
deny[msg] {
    input.kind == "Service"
    input.metadata.labels["app"] in ["postgresql", "redis", "mongodb"]
    input.spec.type != "ClusterIP"
    msg := sprintf("Database service '%s' should only use ClusterIP type", [input.metadata.name])
}

# Deny external access to internal services
internal_services := ["postgresql", "redis", "mongodb", "elasticsearch"]

deny[msg] {
    input.kind == "Service"
    input.metadata.labels["app"] in internal_services
    input.spec.type in ["LoadBalancer", "NodePort"]
    msg := sprintf("Internal service '%s' should not be exposed externally", [input.metadata.name])
}

# Require service mesh annotations for production services
deny[msg] {
    input.kind == "Service"
    input.metadata.namespace in ["backend-services", "ai-services", "cms"]
    not input.metadata.annotations["kuma.io/service"]
    msg := sprintf("Production service '%s' should have service mesh annotations", [input.metadata.name])
}

# Deny privileged ports for non-system services
deny[msg] {
    input.kind == "Pod"
    input.spec.containers[i].ports[j].containerPort < 1024
    input.spec.containers[i].ports[j].containerPort != 80
    input.spec.containers[i].ports[j].containerPort != 443
    not input.metadata.namespace in ["kube-system", "kuma-system"]
    msg := sprintf("Container '%s' should not use privileged port %d", [input.spec.containers[i].name, input.spec.containers[i].ports[j].containerPort])
}
