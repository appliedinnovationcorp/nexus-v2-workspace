# Security Incident Response Runbook

## Overview

This runbook provides detailed procedures for responding to security incidents affecting the AIC Website platform. It defines roles, responsibilities, and step-by-step actions to ensure rapid and effective incident response.

## Incident Response Team (IRT)

### Core Team Roles

#### Incident Commander (IC)
- **Primary**: Security Team Lead
- **Backup**: Senior DevOps Engineer
- **Responsibilities**:
  - Overall incident coordination and decision-making
  - Stakeholder communication and escalation
  - Resource allocation and team coordination
  - Post-incident review leadership

#### Security Analyst
- **Primary**: SOC Analyst
- **Backup**: Security Engineer
- **Responsibilities**:
  - Threat analysis and investigation
  - Evidence collection and preservation
  - Forensic analysis coordination
  - Threat intelligence correlation

#### Technical Lead
- **Primary**: Platform Architect
- **Backup**: Senior Developer
- **Responsibilities**:
  - Technical containment and mitigation
  - System recovery and restoration
  - Code analysis and remediation
  - Infrastructure security hardening

#### Communications Lead
- **Primary**: Product Manager
- **Backup**: Engineering Manager
- **Responsibilities**:
  - Internal and external communications
  - Customer notification coordination
  - Media relations (if required)
  - Regulatory notification management

## Incident Classification

### Severity Levels

#### Critical (P0) - Immediate Response Required
**Criteria:**
- Active data breach with confirmed exfiltration
- Complete system compromise or ransomware
- Public-facing service completely compromised
- Imminent threat to business operations

**Response Time:** 15 minutes
**Escalation:** Immediate C-level notification

#### High (P1) - Urgent Response Required
**Criteria:**
- Unauthorized access to sensitive systems
- Malware detected in production environment
- Privilege escalation or lateral movement
- Significant service disruption due to security

**Response Time:** 30 minutes
**Escalation:** VP-level notification within 1 hour

#### Medium (P2) - Standard Response
**Criteria:**
- Suspicious activity requiring investigation
- Failed authentication patterns (brute force)
- Non-critical vulnerability exploitation
- Security policy violations

**Response Time:** 2 hours
**Escalation:** Manager-level notification within 4 hours

#### Low (P3) - Routine Response
**Criteria:**
- Security configuration drift
- Non-exploitable vulnerability discovery
- Security awareness violations
- Routine security events

**Response Time:** 24 hours
**Escalation:** Team-level notification

## Incident Response Process

### Phase 1: Detection and Analysis (0-30 minutes)

#### 1.1 Initial Detection
```bash
# Check security alerts
kubectl get events --all-namespaces | grep -i security
kubectl logs -n observability deployment/prometheus | grep -i alert

# Check system integrity
./scripts/security-check.sh --immediate

# Review recent access logs
kubectl logs -n backend-services deployment/backend-api | grep -E "401|403|500"
```

#### 1.2 Incident Classification
- **Assess severity** using classification criteria
- **Determine scope** of potential impact
- **Identify affected systems** and data
- **Estimate business impact**

#### 1.3 Initial Response Actions
```bash
# Activate incident response
./scripts/incident-response.sh activate --severity=<P0|P1|P2|P3>

# Preserve evidence
./scripts/evidence-collection.sh --snapshot

# Begin monitoring
./scripts/security-monitoring.sh --enhanced
```

#### 1.4 Team Activation
- **Notify Incident Commander** via emergency channels
- **Activate core IRT members** based on severity
- **Establish communication channels** (Slack #incident-response)
- **Begin incident documentation**

### Phase 2: Containment (30 minutes - 2 hours)

#### 2.1 Short-term Containment
```bash
# Isolate affected systems
kubectl patch networkpolicy deny-all -n <affected-namespace> --patch-file=isolation.yaml

# Block malicious IPs
kubectl apply -f security/ip-blocklist.yaml

# Disable compromised accounts
kubectl patch serviceaccount <compromised-sa> -n <namespace> --patch '{"secrets":[]}'

# Enable enhanced monitoring
kubectl apply -f monitoring/security-enhanced.yaml
```

#### 2.2 Evidence Preservation
```bash
# Create forensic snapshots
kubectl exec -it <affected-pod> -n <namespace> -- tar -czf /tmp/evidence-$(date +%Y%m%d-%H%M%S).tar.gz /var/log /app/data

# Preserve memory dumps
kubectl exec -it <affected-pod> -n <namespace> -- gcore $(pgrep -f <process-name>)

# Collect network traffic
kubectl exec -it <network-pod> -n kube-system -- tcpdump -w /tmp/traffic-$(date +%Y%m%d-%H%M%S).pcap

# Export logs
./scripts/log-export.sh --incident-id=<incident-id> --timerange="last 24h"
```

#### 2.3 System Isolation
```bash
# Network isolation
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: incident-isolation
  namespace: <affected-namespace>
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress: []
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
EOF

# Service isolation
kubectl patch service <affected-service> -n <namespace> --patch '{"spec":{"selector":{"incident":"isolated"}}}'

# Pod quarantine
kubectl label pod <affected-pod> -n <namespace> incident=quarantined
```

#### 2.4 Long-term Containment
- **Implement permanent fixes** for identified vulnerabilities
- **Update security controls** to prevent recurrence
- **Coordinate with external partners** if needed
- **Prepare for recovery phase**

### Phase 3: Eradication (2-8 hours)

#### 3.1 Root Cause Analysis
```bash
# Analyze attack vectors
./scripts/attack-analysis.sh --incident-id=<incident-id>

# Check for persistence mechanisms
kubectl get pods --all-namespaces -o yaml | grep -E "hostPath|privileged|runAsUser.*0"

# Scan for malware
kubectl exec -it <pod-name> -n <namespace> -- clamscan -r /

# Vulnerability assessment
./scripts/vulnerability-scan.sh --comprehensive
```

#### 3.2 Threat Removal
```bash
# Remove malicious files
kubectl exec -it <affected-pod> -n <namespace> -- rm -f /tmp/malicious-file

# Kill malicious processes
kubectl exec -it <affected-pod> -n <namespace> -- pkill -f <malicious-process>

# Remove backdoors
kubectl exec -it <affected-pod> -n <namespace> -- find / -name "*.backdoor" -delete

# Clean registry entries (if applicable)
kubectl delete secret <compromised-registry-secret> -n <namespace>
```

#### 3.3 System Hardening
```bash
# Update container images
kubectl set image deployment/<name> <container>=<new-secure-image> -n <namespace>

# Apply security patches
kubectl apply -f security/patches/

# Strengthen access controls
kubectl apply -f security/rbac-hardened.yaml

# Update network policies
kubectl apply -f security/network-policies-strict.yaml
```

#### 3.4 Credential Rotation
```bash
# Rotate API keys
kubectl create secret generic <secret-name> --from-literal=api-key=<new-key> -n <namespace>

# Rotate database passwords
kubectl patch secret <db-secret> -n <namespace> --patch '{"data":{"password":"'$(echo -n "new-password" | base64)'"}}'

# Rotate TLS certificates
kubectl delete certificate <cert-name> -n <namespace>
kubectl apply -f security/certificates/new-cert.yaml

# Update service account tokens
kubectl delete secret $(kubectl get serviceaccount <sa-name> -n <namespace> -o jsonpath='{.secrets[0].name}') -n <namespace>
```

### Phase 4: Recovery (4-24 hours)

#### 4.1 System Restoration
```bash
# Restore from clean backups
./scripts/restore-from-backup.sh --backup-date=<pre-incident-date>

# Verify system integrity
./scripts/integrity-check.sh --comprehensive

# Gradual service restoration
kubectl scale deployment <name> --replicas=1 -n <namespace>
# Monitor for 30 minutes, then scale up gradually

# Remove isolation measures
kubectl delete networkpolicy incident-isolation -n <namespace>
```

#### 4.2 Security Validation
```bash
# Security scan post-recovery
./scripts/security-scan.sh --post-incident

# Penetration testing
./scripts/pentest.sh --targeted --scope=<recovered-systems>

# Vulnerability assessment
./scripts/vulnerability-assessment.sh --full-scan

# Configuration audit
./scripts/config-audit.sh --security-focused
```

#### 4.3 Monitoring Enhancement
```bash
# Deploy enhanced monitoring
kubectl apply -f monitoring/post-incident-monitoring.yaml

# Configure additional alerts
kubectl apply -f monitoring/security-alerts-enhanced.yaml

# Enable detailed logging
kubectl patch configmap <app-config> -n <namespace> --patch '{"data":{"log-level":"debug","security-logging":"enabled"}}'

# Implement behavioral monitoring
kubectl apply -f monitoring/behavioral-analysis.yaml
```

### Phase 5: Post-Incident Activities (24-72 hours)

#### 5.1 Lessons Learned
- **Conduct post-incident review** meeting within 48 hours
- **Document timeline** of events and response actions
- **Identify improvement opportunities** in processes and tools
- **Update runbooks** based on lessons learned

#### 5.2 Communication and Reporting
```bash
# Generate incident report
./scripts/incident-report.sh --incident-id=<incident-id> --format=executive

# Prepare regulatory notifications
./scripts/compliance-report.sh --incident-id=<incident-id> --regulations=gdpr,ccpa

# Customer communication
./scripts/customer-notification.sh --template=security-incident --severity=<level>
```

#### 5.3 Process Improvements
- **Update security controls** based on attack vectors
- **Enhance detection capabilities** to prevent similar incidents
- **Improve response procedures** based on experience
- **Conduct additional training** if gaps identified

## Communication Procedures

### Internal Communication

#### Immediate Notification (P0/P1)
```bash
# Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 SECURITY INCIDENT P0 - <brief-description> - IC: <name>"}' \
  $SLACK_SECURITY_WEBHOOK

# Email notification
./scripts/notify-security-team.sh --severity=P0 --incident-id=<id>

# SMS notification (P0 only)
./scripts/sms-alert.sh --recipients=security-leadership --message="P0 Security Incident"
```

#### Status Updates
- **Every 30 minutes** for P0 incidents
- **Every 2 hours** for P1 incidents
- **Daily** for P2/P3 incidents

#### Escalation Matrix
| Severity | Immediate | 1 Hour | 4 Hours | 24 Hours |
|----------|-----------|--------|---------|----------|
| P0 | IC, Security Team | CISO, CTO | CEO, Board | Legal, PR |
| P1 | IC, Security Team | CISO, CTO | VP Engineering | Legal |
| P2 | IC, Security Team | Security Manager | VP Engineering | - |
| P3 | Security Team | Security Manager | - | - |

### External Communication

#### Customer Notification
```bash
# Prepare customer communication
./scripts/customer-comms.sh --template=security-incident \
  --severity=<level> --estimated-impact=<description>

# Regulatory notification
./scripts/regulatory-notification.sh --incident-id=<id> \
  --regulations=gdpr --timeline=72hours
```

#### Media Relations (P0 only)
- **Coordinate with PR team** before any public statements
- **Prepare holding statements** for media inquiries
- **Monitor social media** for mentions and concerns
- **Coordinate with legal team** on disclosure requirements

## Evidence Collection and Forensics

### Digital Evidence Collection
```bash
# System snapshots
kubectl exec -it <pod-name> -n <namespace> -- dd if=/dev/sda of=/tmp/disk-image.dd bs=4096

# Memory dumps
kubectl exec -it <pod-name> -n <namespace> -- gcore -o /tmp/memory-dump $(pgrep <process>)

# Network captures
kubectl exec -it <network-pod> -n kube-system -- tcpdump -w /tmp/network-$(date +%Y%m%d-%H%M%S).pcap

# Log collection
./scripts/forensic-log-collection.sh --incident-id=<id> --preserve-chain-of-custody
```

### Chain of Custody
1. **Document evidence collection** with timestamps and personnel
2. **Calculate and record hashes** of all evidence files
3. **Store evidence securely** with access controls
4. **Maintain custody log** for all evidence handling

### Forensic Analysis
```bash
# Analyze disk images
./scripts/forensic-analysis.sh --image=/tmp/disk-image.dd --output-report

# Memory analysis
volatility -f /tmp/memory-dump.raw --profile=<profile> pslist

# Network analysis
wireshark -r /tmp/network-capture.pcap -Y "suspicious.filter"

# Log analysis
./scripts/log-forensics.sh --logs=/tmp/incident-logs --timeline-analysis
```

## Legal and Regulatory Considerations

### Data Breach Notification Requirements

#### GDPR (72-hour notification)
```bash
# Generate GDPR notification
./scripts/gdpr-notification.sh --incident-id=<id> \
  --data-subjects-affected=<number> \
  --data-categories="personal,financial" \
  --likelihood-of-harm="high"
```

#### CCPA (California Consumer Privacy Act)
```bash
# Generate CCPA notification
./scripts/ccpa-notification.sh --incident-id=<id> \
  --california-residents-affected=<number> \
  --personal-information-categories="identifiers,commercial"
```

#### Industry-Specific Requirements
- **Healthcare**: HIPAA breach notification (60 days)
- **Financial**: SOX, PCI DSS requirements
- **Government**: FedRAMP incident reporting

### Legal Hold Procedures
1. **Preserve all relevant data** and communications
2. **Implement litigation hold** on affected systems
3. **Coordinate with legal counsel** on evidence handling
4. **Document all preservation actions**

## Recovery and Business Continuity

### Service Recovery Priorities
1. **Critical customer-facing services** (P0)
2. **Core business applications** (P1)
3. **Supporting services** (P2)
4. **Development and testing** (P3)

### Recovery Procedures
```bash
# Activate disaster recovery
./scripts/disaster-recovery.sh --activate --scenario=security-incident

# Restore from clean backups
./scripts/restore-services.sh --backup-timestamp=<pre-incident>

# Validate service integrity
./scripts/service-validation.sh --comprehensive

# Gradual traffic restoration
./scripts/traffic-restoration.sh --gradual --monitoring-enhanced
```

### Business Impact Assessment
- **Revenue impact** calculation and tracking
- **Customer impact** assessment and communication
- **Regulatory impact** evaluation and response
- **Reputation impact** monitoring and management

## Training and Preparedness

### Regular Drills
- **Monthly tabletop exercises** for different incident scenarios
- **Quarterly technical response drills** with simulated incidents
- **Annual comprehensive incident simulation** with all stakeholders
- **Continuous improvement** based on drill outcomes

### Training Requirements
- **New team member** incident response training within 30 days
- **Annual refresher training** for all team members
- **Specialized training** for forensics and advanced threats
- **Cross-training** to ensure coverage and redundancy

### Documentation Maintenance
- **Monthly review** of contact information and escalation paths
- **Quarterly update** of procedures based on lessons learned
- **Annual comprehensive review** of entire runbook
- **Version control** and change management for all updates

---

**Next**: [Threat Detection & Response](./threat-detection.md)
