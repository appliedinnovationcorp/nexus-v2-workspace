# OPA Policies for GitLab CI/CD Pipeline

This directory contains Open Policy Agent (OPA) policies for enforcing security and compliance requirements in the GitLab CI/CD pipeline.

## Overview

OPA is a policy engine that enables unified policy enforcement across the stack. In our CI/CD pipeline, we use OPA to enforce policies related to:

- Security requirements
- Compliance standards
- Deployment rules
- Resource constraints
- Access control

## Policy Structure

The policies are organized into the following categories:

- **Security**: Policies related to security requirements
- **Compliance**: Policies related to compliance standards
- **Deployment**: Policies related to deployment rules
- **Resource**: Policies related to resource constraints
- **Access**: Policies related to access control

## Integration with GitLab CI

The policies are integrated with GitLab CI using the GitLab CI/CD External Policy project. This integration allows GitLab CI to evaluate policies before running jobs, ensuring that all jobs comply with the defined policies.

### Setup

1. Configure the GitLab CI/CD External Policy project in your GitLab instance
2. Set up the OPA server with these policies
3. Configure GitLab CI to use the OPA server for policy evaluation

## Policy Evaluation

Policies are evaluated at different stages of the CI/CD pipeline:

- **Pre-job**: Policies evaluated before a job starts
- **Post-job**: Policies evaluated after a job completes
- **Pre-pipeline**: Policies evaluated before a pipeline starts
- **Post-pipeline**: Policies evaluated after a pipeline completes

## Policy Files

| File | Description |
|------|-------------|
| `security.rego` | Security policies for the CI/CD pipeline |
| `compliance.rego` | Compliance policies for the CI/CD pipeline |
| `deployment.rego` | Deployment policies for the CI/CD pipeline |
| `resource.rego` | Resource constraint policies for the CI/CD pipeline |
| `access.rego` | Access control policies for the CI/CD pipeline |

## Testing Policies

To test the policies locally:

```bash
# Install OPA
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa

# Test a policy
./opa eval --data security.rego --input input.json "data.gitlab.security"
```

## References

- [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/latest/)
- [GitLab CI/CD External Policy](https://docs.gitlab.com/ee/ci/external_policy/)
- [Rego Policy Language](https://www.openpolicyagent.org/docs/latest/policy-language/)
