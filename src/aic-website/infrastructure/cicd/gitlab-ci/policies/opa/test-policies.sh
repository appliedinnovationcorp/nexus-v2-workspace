#!/bin/bash

# Test OPA policies for GitLab CI/CD pipeline

# Check if OPA is installed
if ! command -v opa &> /dev/null; then
    echo "OPA is not installed. Installing..."
    curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
    chmod +x opa
    mv opa /usr/local/bin/
fi

# Test security policy
echo "Testing security policy..."
opa eval --format pretty --data security.rego --data common.rego --input sample-input.json "data.gitlab.security.allow"
opa eval --format pretty --data security.rego --data common.rego --input sample-input.json "data.gitlab.security.violation"

# Test compliance policy
echo "Testing compliance policy..."
opa eval --format pretty --data compliance.rego --data common.rego --input sample-input.json "data.gitlab.compliance.allow"
opa eval --format pretty --data compliance.rego --data common.rego --input sample-input.json "data.gitlab.compliance.violation"

# Test deployment policy
echo "Testing deployment policy..."
opa eval --format pretty --data deployment.rego --data common.rego --input sample-input.json "data.gitlab.deployment.allow"
opa eval --format pretty --data deployment.rego --data common.rego --input sample-input.json "data.gitlab.deployment.violation"

# Test resource policy
echo "Testing resource policy..."
opa eval --format pretty --data resource.rego --data common.rego --input sample-input.json "data.gitlab.resource.allow"
opa eval --format pretty --data resource.rego --data common.rego --input sample-input.json "data.gitlab.resource.violation"

# Test access policy
echo "Testing access policy..."
opa eval --format pretty --data access.rego --data common.rego --input sample-input.json "data.gitlab.access.allow"
opa eval --format pretty --data access.rego --data common.rego --input sample-input.json "data.gitlab.access.violation"

echo "All policy tests completed."
