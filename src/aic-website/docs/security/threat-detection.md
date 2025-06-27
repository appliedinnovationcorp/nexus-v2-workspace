# Threat Detection & Response Runbook

## Overview

This runbook provides procedures for automated threat detection, security alert triage, threat hunting, and response to various types of security threats targeting the AIC Website platform.

## Threat Detection Architecture

### Detection Layers

#### 1. Network Layer Detection
- **Service Mesh Monitoring**: Kuma/Istio traffic analysis
- **Network Policies**: Kubernetes network policy violations
- **DNS Monitoring**: Suspicious domain queries and DGA detection
- **Traffic Analysis**: Anomalous network patterns and flows

#### 2. Application Layer Detection
- **API Security**: Rate limiting, authentication failures, injection attempts
- **Application Logs**: Error patterns, suspicious user behavior
- **Code Execution**: Runtime application self-protection (RASP)
- **Business Logic**: Unusual transaction patterns

#### 3. Infrastructure Layer Detection
- **Container Security**: Runtime threat detection in containers
- **Host-based Detection**: System call monitoring, file integrity
- **Cloud Security**: AWS/GCP/Azure security events
- **Kubernetes Security**: RBAC violations, privilege escalation

#### 4. Data Layer Detection
- **Database Activity**: Unusual queries, data access patterns
- **Data Loss Prevention**: Sensitive data exfiltration attempts
- **Encryption Monitoring**: Key usage and certificate anomalies
- **Backup Integrity**: Backup tampering detection

## Automated Threat Detection

### Security Information and Event Management (SIEM)

#### SIEM Configuration
```bash
# Deploy SIEM stack
kubectl apply -f monitoring/siem/elasticsearch.yaml
kubectl apply -f monitoring/siem/logstash.yaml
kubectl apply -f monitoring/siem/kibana.yaml

# Configure log forwarding
kubectl apply -f monitoring/siem/fluentd-security.yaml

# Deploy security rules
kubectl apply -f monitoring/siem/security-rules.yaml
```

#### Detection Rules
```yaml
# Example: Brute Force Detection Rule
apiVersion: v1
kind: ConfigMap
metadata:
  name: siem-rules
  namespace: observability
data:
  brute-force-detection.yml: |
    rules:
      - name: "Brute Force Authentication"
        condition: |
          count(authentication_failure) > 10 
          AND timeframe = "5m" 
          AND source_ip = same
        severity: "HIGH"
        action: "block_ip"
        notification: "security-team"
```

### Intrusion Detection System (IDS)

#### Network IDS Deployment
```bash
# Deploy Suricata IDS
kubectl apply -f security/ids/suricata-daemonset.yaml

# Configure IDS rules
kubectl create configmap suricata-rules --from-file=security/ids/rules/ -n security

# Deploy Zeek network analyzer
kubectl apply -f security/ids/zeek-deployment.yaml
```

#### Host-based IDS
```bash
# Deploy OSSEC HIDS
kubectl apply -f security/hids/ossec-daemonset.yaml

# Configure file integrity monitoring
kubectl apply -f security/hids/fim-config.yaml

# Deploy Falco for runtime security
kubectl apply -f security/runtime/falco-daemonset.yaml
```

### Behavioral Analytics

#### User and Entity Behavior Analytics (UEBA)
```bash
# Deploy behavioral analytics engine
kubectl apply -f security/ueba/analytics-engine.yaml

# Configure baseline learning
kubectl apply -f security/ueba/baseline-config.yaml

# Set up anomaly detection
kubectl apply -f security/ueba/anomaly-detection.yaml
```

## Alert Triage and Analysis

### Alert Classification

#### Severity Levels
- **Critical**: Active attack in progress, immediate threat
- **High**: Suspicious activity with high confidence, potential threat
- **Medium**: Anomalous behavior requiring investigation
- **Low**: Policy violations or informational events

#### Alert Categories
- **Malware**: Virus, trojan, ransomware detection
- **Intrusion**: Unauthorized access attempts
- **Data Exfiltration**: Unusual data transfer patterns
- **Privilege Escalation**: Unauthorized permission changes
- **Denial of Service**: Service availability attacks
- **Policy Violation**: Security policy non-compliance

### Triage Process

#### Level 1 Triage (SOC Analyst)
```bash
# Check alert details
./scripts/alert-details.sh --alert-id=<alert-id>

# Verify alert legitimacy
./scripts/alert-verification.sh --alert-id=<alert-id>

# Check for false positives
./scripts/false-positive-check.sh --alert-id=<alert-id>

# Initial containment if needed
./scripts/initial-containment.sh --alert-id=<alert-id>
```

#### Level 2 Analysis (Security Engineer)
```bash
# Deep dive investigation
./scripts/deep-investigation.sh --alert-id=<alert-id>

# Threat intelligence correlation
./scripts/threat-intel-lookup.sh --indicators=<IOCs>

# Impact assessment
./scripts/impact-assessment.sh --alert-id=<alert-id>

# Escalation decision
./scripts/escalation-decision.sh --alert-id=<alert-id>
```

#### Level 3 Response (Senior Security Analyst)
```bash
# Advanced threat analysis
./scripts/advanced-analysis.sh --alert-id=<alert-id>

# Incident response activation
./scripts/incident-response.sh activate --alert-id=<alert-id>

# Stakeholder notification
./scripts/stakeholder-notification.sh --alert-id=<alert-id>
```

## Threat Hunting Procedures

### Proactive Threat Hunting

#### Hypothesis-Driven Hunting
```bash
# Hunt for lateral movement
./scripts/threat-hunt.sh --hypothesis="lateral-movement" \
  --timerange="last 7 days" \
  --indicators="unusual_network_connections,privilege_escalation"

# Hunt for data exfiltration
./scripts/threat-hunt.sh --hypothesis="data-exfiltration" \
  --timerange="last 30 days" \
  --indicators="large_data_transfers,unusual_access_patterns"

# Hunt for persistence mechanisms
./scripts/threat-hunt.sh --hypothesis="persistence" \
  --timerange="last 14 days" \
  --indicators="scheduled_tasks,startup_modifications,backdoors"
```

#### IOC-Based Hunting
```bash
# Hunt using threat intelligence IOCs
./scripts/ioc-hunt.sh --ioc-feed="misp" --timerange="last 24h"

# Hunt for specific malware families
./scripts/malware-hunt.sh --family="apt29,lazarus" --timerange="last 7d"

# Hunt for known attack techniques
./scripts/technique-hunt.sh --mitre-attack="T1055,T1078,T1190" --timerange="last 30d"
```

### Threat Intelligence Integration

#### IOC Management
```bash
# Update threat intelligence feeds
./scripts/threat-intel-update.sh --feeds="all" --auto-import

# Check IOCs against current environment
./scripts/ioc-check.sh --scope="all-systems" --format="json"

# Generate threat intelligence report
./scripts/threat-intel-report.sh --timerange="last 7d" --format="executive"
```

#### Attribution Analysis
```bash
# Analyze attack patterns for attribution
./scripts/attribution-analysis.sh --incident-id=<id> --techniques="mitre-attack"

# Compare with known threat actor TTPs
./scripts/ttp-comparison.sh --incident-id=<id> --threat-actors="apt1,lazarus,carbanak"

# Generate attribution assessment
./scripts/attribution-report.sh --incident-id=<id> --confidence-level="medium"
```

## Specific Threat Response Procedures

### Malware Response

#### Malware Detection Response
```bash
# Isolate infected systems
kubectl patch networkpolicy malware-isolation -n <namespace> --patch-file=isolation.yaml

# Collect malware samples
kubectl exec -it <infected-pod> -n <namespace> -- cp /tmp/malware-sample /evidence/

# Analyze malware
./scripts/malware-analysis.sh --sample=/evidence/malware-sample --sandbox="cuckoo"

# Update detection signatures
./scripts/signature-update.sh --malware-hash=<hash> --distribute="all-sensors"
```

#### Ransomware Response
```bash
# Immediate isolation
kubectl apply -f security/ransomware/emergency-isolation.yaml

# Backup verification
./scripts/backup-verification.sh --check-integrity --timerange="pre-infection"

# Decryption assessment
./scripts/ransomware-analysis.sh --sample=<encrypted-file> --check-decryptors

# Recovery planning
./scripts/recovery-plan.sh --scenario="ransomware" --priority="critical-systems"
```

### Advanced Persistent Threat (APT) Response

#### APT Detection Indicators
- **Long-term persistence** mechanisms
- **Lateral movement** patterns
- **Data staging** and exfiltration
- **Command and control** communications
- **Living off the land** techniques

#### APT Response Procedures
```bash
# Comprehensive system analysis
./scripts/apt-analysis.sh --deep-scan --timerange="last 90d"

# Network traffic analysis
./scripts/network-analysis.sh --apt-indicators --timerange="last 30d"

# Memory forensics
./scripts/memory-forensics.sh --hunt-apt --all-systems

# Timeline reconstruction
./scripts/timeline-analysis.sh --incident-type="apt" --comprehensive
```

### Insider Threat Response

#### Insider Threat Indicators
- **Unusual access patterns** outside normal hours
- **Data access anomalies** beyond job requirements
- **Privilege escalation** attempts
- **Policy violations** and security bypasses
- **Behavioral changes** in system usage

#### Response Procedures
```bash
# User behavior analysis
./scripts/user-behavior-analysis.sh --user=<username> --timerange="last 30d"

# Access pattern review
./scripts/access-review.sh --user=<username> --anomaly-detection

# Data access audit
./scripts/data-access-audit.sh --user=<username> --sensitive-data-only

# HR coordination
./scripts/hr-notification.sh --user=<username> --concern="security-violation"
```

### DDoS Attack Response

#### DDoS Detection and Mitigation
```bash
# Activate DDoS protection
kubectl apply -f security/ddos/protection-enhanced.yaml

# Traffic analysis
./scripts/traffic-analysis.sh --ddos-detection --real-time

# Rate limiting enhancement
kubectl patch configmap nginx-config -n ingress --patch-file=ddos-rate-limits.yaml

# CDN activation
./scripts/cdn-activation.sh --ddos-mode --provider="cloudflare"
```

#### Application Layer DDoS
```bash
# Application-specific rate limiting
kubectl apply -f security/ddos/app-rate-limits.yaml

# Bot detection and blocking
kubectl apply -f security/ddos/bot-protection.yaml

# Captcha activation
./scripts/captcha-activation.sh --threshold="high-traffic"

# API protection
kubectl apply -f security/ddos/api-protection.yaml
```

## Automated Response Actions

### Immediate Response Automation

#### Automated Containment
```yaml
# Automated isolation policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: auto-isolation
  namespace: security
spec:
  podSelector:
    matchLabels:
      security.threat-level: "high"
  policyTypes:
  - Ingress
  - Egress
  ingress: []
  egress: []
```

#### Automated Blocking
```bash
# IP blocking automation
./scripts/auto-block.sh --trigger="brute-force" --duration="1h"

# User account suspension
./scripts/auto-suspend.sh --trigger="anomalous-behavior" --review-required

# Service isolation
./scripts/auto-isolate.sh --trigger="malware-detection" --scope="affected-service"
```

### Response Orchestration

#### Security Orchestration, Automation and Response (SOAR)
```bash
# Deploy SOAR platform
kubectl apply -f security/soar/phantom-deployment.yaml

# Configure playbooks
kubectl apply -f security/soar/playbooks/

# Set up automated workflows
kubectl apply -f security/soar/workflows/
```

#### Playbook Examples
```yaml
# Phishing response playbook
apiVersion: v1
kind: ConfigMap
metadata:
  name: phishing-playbook
  namespace: security
data:
  playbook.yml: |
    name: "Phishing Email Response"
    trigger: "phishing_email_detected"
    actions:
      - name: "quarantine_email"
        type: "email_action"
        parameters:
          action: "quarantine"
      - name: "notify_users"
        type: "notification"
        parameters:
          message: "Phishing email detected and quarantined"
      - name: "update_filters"
        type: "email_filter"
        parameters:
          sender: "block"
          domain: "block"
```

## Threat Intelligence and IOC Management

### IOC Collection and Processing
```bash
# Collect IOCs from incident
./scripts/ioc-extraction.sh --incident-id=<id> --auto-extract

# Validate IOCs
./scripts/ioc-validation.sh --iocs=<ioc-list> --confidence-check

# Distribute IOCs
./scripts/ioc-distribution.sh --iocs=<validated-iocs> --feeds="internal,external"

# Update detection rules
./scripts/detection-update.sh --iocs=<iocs> --auto-generate-rules
```

### Threat Intelligence Feeds
```bash
# Configure threat intelligence feeds
kubectl apply -f security/threat-intel/feeds-config.yaml

# Update feed subscriptions
./scripts/threat-feeds.sh --update --feeds="misp,otx,virustotal"

# Process new intelligence
./scripts/intel-processing.sh --auto-process --confidence-threshold="medium"
```

## Metrics and Reporting

### Security Metrics
```bash
# Generate security metrics
./scripts/security-metrics.sh --timerange="last 30d" --format="dashboard"

# Alert metrics
./scripts/alert-metrics.sh --metrics="volume,accuracy,response-time"

# Threat hunting metrics
./scripts/hunting-metrics.sh --metrics="coverage,findings,false-positives"

# Incident response metrics
./scripts/incident-metrics.sh --metrics="mttd,mttr,severity-distribution"
```

### Reporting
```bash
# Daily security report
./scripts/security-report.sh --type="daily" --recipients="security-team"

# Weekly executive summary
./scripts/security-report.sh --type="executive" --timerange="last 7d"

# Monthly threat landscape report
./scripts/threat-landscape.sh --timerange="last 30d" --format="executive"

# Quarterly security posture assessment
./scripts/security-posture.sh --comprehensive --timerange="last 90d"
```

## Integration with External Services

### Threat Intelligence Platforms
```bash
# MISP integration
./scripts/misp-integration.sh --sync --auto-import

# OpenCTI integration
./scripts/opencti-integration.sh --sync --confidence-threshold="high"

# Commercial threat intel
./scripts/commercial-intel.sh --providers="crowdstrike,fireeye" --sync
```

### Security Service Providers
```bash
# MDR service integration
./scripts/mdr-integration.sh --provider="crowdstrike" --sync-alerts

# Threat hunting service
./scripts/hunting-service.sh --provider="external" --scope="monthly"

# Incident response retainer
./scripts/ir-retainer.sh --provider="mandiant" --activation-criteria="p0-incidents"
```

## Continuous Improvement

### Detection Tuning
```bash
# Analyze false positives
./scripts/false-positive-analysis.sh --timerange="last 30d"

# Tune detection rules
./scripts/rule-tuning.sh --auto-tune --false-positive-threshold="5%"

# Update detection coverage
./scripts/coverage-analysis.sh --mitre-attack --gaps-identification
```

### Process Improvement
- **Monthly detection effectiveness review**
- **Quarterly threat hunting assessment**
- **Annual threat detection strategy review**
- **Continuous training and skill development**

---

**Next**: [Access Control & Authentication](./access-control.md)
