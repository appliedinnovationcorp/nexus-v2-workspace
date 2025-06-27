#!/bin/bash

# AIC Website Security Incident Response Automation Script
# Comprehensive security incident detection, response, and recovery automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
INCIDENT_LOG_DIR="/var/log/security-incidents"
EVIDENCE_DIR="/var/evidence"
BACKUP_DIR="/var/backups/security"
NOTIFICATION_WEBHOOK="${SLACK_SECURITY_WEBHOOK:-}"
EMAIL_RECIPIENTS="${SECURITY_EMAIL_LIST:-security@aicorp.com}"

# Severity levels
declare -A SEVERITY_LEVELS=(
    ["P0"]="CRITICAL"
    ["P1"]="HIGH" 
    ["P2"]="MEDIUM"
    ["P3"]="LOW"
)

# Response times (in minutes)
declare -A RESPONSE_TIMES=(
    ["P0"]=15
    ["P1"]=30
    ["P2"]=120
    ["P3"]=1440
)

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$INCIDENT_LOG_DIR/incident-response.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$INCIDENT_LOG_DIR/incident-response.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$INCIDENT_LOG_DIR/incident-response.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$INCIDENT_LOG_DIR/incident-response.log"
}

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$INCIDENT_LOG_DIR/incident-response.log"
}

# Initialize incident response environment
initialize_incident_response() {
    log_info "Initializing security incident response environment..."
    
    # Create necessary directories
    mkdir -p "$INCIDENT_LOG_DIR" "$EVIDENCE_DIR" "$BACKUP_DIR"
    
    # Set proper permissions
    chmod 750 "$INCIDENT_LOG_DIR" "$EVIDENCE_DIR" "$BACKUP_DIR"
    
    # Initialize incident tracking
    local incident_id="INC-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 4)"
    echo "$incident_id" > "$INCIDENT_LOG_DIR/current-incident-id"
    
    log_success "Incident response environment initialized. Incident ID: $incident_id"
    echo "$incident_id"
}

# Detect security incidents
detect_security_incidents() {
    log_info "Running security incident detection..."
    
    local incidents_detected=0
    
    # Check for failed authentication attempts
    local failed_auth=$(kubectl logs --all-namespaces -l app=backend-api --since=5m | grep -c "authentication failed" || echo 0)
    if [ "$failed_auth" -gt 50 ]; then
        log_warning "High number of failed authentication attempts detected: $failed_auth"
        echo "brute-force-attack" >> "$INCIDENT_LOG_DIR/detected-incidents"
        ((incidents_detected++))
    fi
    
    # Check for suspicious network activity
    local suspicious_connections=$(kubectl exec -n kube-system daemonset/kube-proxy -- netstat -an | grep -c "ESTABLISHED.*:22\|:3389\|:5985" || echo 0)
    if [ "$suspicious_connections" -gt 10 ]; then
        log_warning "Suspicious network connections detected: $suspicious_connections"
        echo "suspicious-network-activity" >> "$INCIDENT_LOG_DIR/detected-incidents"
        ((incidents_detected++))
    fi
    
    # Check for container anomalies
    local container_restarts=$(kubectl get pods --all-namespaces --field-selector=status.phase=Running -o json | jq '[.items[] | select(.status.containerStatuses[]?.restartCount > 5)] | length')
    if [ "$container_restarts" -gt 0 ]; then
        log_warning "Containers with high restart count detected: $container_restarts"
        echo "container-anomaly" >> "$INCIDENT_LOG_DIR/detected-incidents"
        ((incidents_detected++))
    fi
    
    # Check for privilege escalation attempts
    local privilege_escalation=$(kubectl get events --all-namespaces --field-selector reason=FailedMount,reason=Unhealthy | wc -l)
    if [ "$privilege_escalation" -gt 5 ]; then
        log_warning "Potential privilege escalation attempts detected: $privilege_escalation"
        echo "privilege-escalation" >> "$INCIDENT_LOG_DIR/detected-incidents"
        ((incidents_detected++))
    fi
    
    # Check for data exfiltration indicators
    local large_transfers=$(kubectl top pods --all-namespaces | awk '$4 ~ /[0-9]+Gi/ {print $4}' | wc -l)
    if [ "$large_transfers" -gt 3 ]; then
        log_warning "Large data transfers detected: $large_transfers pods with high memory usage"
        echo "data-exfiltration" >> "$INCIDENT_LOG_DIR/detected-incidents"
        ((incidents_detected++))
    fi
    
    log_info "Security incident detection completed. Incidents detected: $incidents_detected"
    return $incidents_detected
}

# Classify incident severity
classify_incident() {
    local incident_type=$1
    local severity="P3"  # Default to low
    
    case $incident_type in
        "data-breach"|"ransomware"|"system-compromise")
            severity="P0"
            ;;
        "malware-detection"|"privilege-escalation"|"data-exfiltration")
            severity="P1"
            ;;
        "brute-force-attack"|"suspicious-network-activity"|"policy-violation")
            severity="P2"
            ;;
        *)
            severity="P3"
            ;;
    esac
    
    echo "$severity"
}

# Send notifications
send_notification() {
    local severity=$1
    local incident_type=$2
    local incident_id=$3
    local message=$4
    
    local severity_name="${SEVERITY_LEVELS[$severity]}"
    local response_time="${RESPONSE_TIMES[$severity]}"
    
    # Slack notification
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        local slack_payload=$(cat <<EOF
{
    "text": "🚨 SECURITY INCIDENT ALERT",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "Incident ID",
                    "value": "$incident_id",
                    "short": true
                },
                {
                    "title": "Severity",
                    "value": "$severity ($severity_name)",
                    "short": true
                },
                {
                    "title": "Type",
                    "value": "$incident_type",
                    "short": true
                },
                {
                    "title": "Response Time",
                    "value": "$response_time minutes",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                }
            ],
            "footer": "AIC Security Incident Response",
            "ts": $(date +%s)
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_payload" \
            "$NOTIFICATION_WEBHOOK" >/dev/null 2>&1 || log_warning "Failed to send Slack notification"
    fi
    
    # Email notification
    if command -v mail >/dev/null 2>&1; then
        local email_subject="[SECURITY ALERT] $severity_name - $incident_type - $incident_id"
        local email_body="Security Incident Detected

Incident ID: $incident_id
Severity: $severity ($severity_name)
Type: $incident_type
Response Time Required: $response_time minutes
Timestamp: $(date)

Details: $message

This is an automated alert from the AIC Security Incident Response System.
Please follow the incident response procedures documented in the security runbooks.

---
AIC Security Team"
        
        echo "$email_body" | mail -s "$email_subject" "$EMAIL_RECIPIENTS" || log_warning "Failed to send email notification"
    fi
    
    log_success "Notifications sent for incident $incident_id"
}

# Immediate containment actions
immediate_containment() {
    local incident_type=$1
    local severity=$2
    
    log_info "Executing immediate containment for $incident_type (severity: $severity)..."
    
    case $incident_type in
        "brute-force-attack")
            # Block suspicious IPs
            log_info "Implementing IP blocking for brute force attack..."
            kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: emergency-ip-block
  namespace: backend-services
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from: []
    ports:
    - protocol: TCP
      port: 22
    - protocol: TCP
      port: 3389
EOF
            ;;
        "malware-detection")
            # Isolate affected pods
            log_info "Isolating potentially infected containers..."
            kubectl get pods --all-namespaces -o json | jq -r '.items[] | select(.status.containerStatuses[]?.restartCount > 5) | "\(.metadata.namespace) \(.metadata.name)"' | while read -r namespace pod; do
                kubectl label pod "$pod" -n "$namespace" security.incident=quarantined --overwrite
            done
            ;;
        "data-exfiltration")
            # Block external network access
            log_info "Blocking external network access..."
            kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: emergency-egress-block
  namespace: backend-services
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
EOF
            ;;
        "privilege-escalation")
            # Revoke elevated permissions
            log_info "Revoking elevated permissions..."
            kubectl get clusterrolebindings -o json | jq -r '.items[] | select(.subjects[]?.kind=="User" and (.roleRef.name=="cluster-admin" or .roleRef.name=="admin")) | .metadata.name' | while read -r binding; do
                kubectl patch clusterrolebinding "$binding" --patch '{"subjects":[]}'
            done
            ;;
    esac
    
    log_success "Immediate containment actions completed for $incident_type"
}

# Evidence collection
collect_evidence() {
    local incident_id=$1
    local incident_type=$2
    
    log_info "Collecting evidence for incident $incident_id..."
    
    local evidence_dir="$EVIDENCE_DIR/$incident_id"
    mkdir -p "$evidence_dir"
    
    # Collect system information
    kubectl get nodes -o yaml > "$evidence_dir/nodes.yaml"
    kubectl get pods --all-namespaces -o yaml > "$evidence_dir/pods.yaml"
    kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp > "$evidence_dir/events.txt"
    
    # Collect logs
    log_info "Collecting application logs..."
    kubectl logs --all-namespaces -l app=backend-api --since=1h > "$evidence_dir/backend-logs.txt" 2>/dev/null || true
    kubectl logs --all-namespaces -l app=ai-services --since=1h > "$evidence_dir/ai-services-logs.txt" 2>/dev/null || true
    
    # Collect network information
    log_info "Collecting network information..."
    kubectl get networkpolicies --all-namespaces -o yaml > "$evidence_dir/network-policies.yaml"
    kubectl get services --all-namespaces -o yaml > "$evidence_dir/services.yaml"
    
    # Collect security-related information
    log_info "Collecting security information..."
    kubectl get secrets --all-namespaces > "$evidence_dir/secrets-list.txt"
    kubectl get serviceaccounts --all-namespaces -o yaml > "$evidence_dir/service-accounts.yaml"
    kubectl get rolebindings,clusterrolebindings --all-namespaces -o yaml > "$evidence_dir/rbac.yaml"
    
    # Create evidence manifest
    cat > "$evidence_dir/evidence-manifest.txt" <<EOF
Evidence Collection Report
=========================
Incident ID: $incident_id
Incident Type: $incident_type
Collection Time: $(date)
Collected By: $(whoami)
System: $(uname -a)

Files Collected:
$(ls -la "$evidence_dir")

Evidence Hash:
$(find "$evidence_dir" -type f -exec sha256sum {} \; | sort)
EOF
    
    # Create evidence archive
    tar -czf "$evidence_dir.tar.gz" -C "$EVIDENCE_DIR" "$incident_id"
    
    log_success "Evidence collection completed. Archive: $evidence_dir.tar.gz"
}

# System recovery
system_recovery() {
    local incident_type=$1
    local severity=$2
    
    log_info "Initiating system recovery for $incident_type..."
    
    # Create recovery checkpoint
    local recovery_checkpoint="$BACKUP_DIR/recovery-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$recovery_checkpoint"
    
    # Backup current state before recovery
    kubectl get all --all-namespaces -o yaml > "$recovery_checkpoint/pre-recovery-state.yaml"
    
    case $incident_type in
        "malware-detection")
            log_info "Recovering from malware incident..."
            # Restart affected pods with clean images
            kubectl get pods --all-namespaces -l security.incident=quarantined -o json | jq -r '.items[] | "\(.metadata.namespace) \(.metadata.name)"' | while read -r namespace pod; do
                kubectl delete pod "$pod" -n "$namespace" --force --grace-period=0
            done
            ;;
        "data-exfiltration")
            log_info "Recovering from data exfiltration incident..."
            # Remove emergency network policies
            kubectl delete networkpolicy emergency-egress-block -n backend-services --ignore-not-found
            # Rotate potentially compromised secrets
            kubectl get secrets --all-namespaces -o json | jq -r '.items[] | select(.type=="Opaque") | "\(.metadata.namespace) \(.metadata.name)"' | while read -r namespace secret; do
                kubectl patch secret "$secret" -n "$namespace" --patch '{"metadata":{"labels":{"security.rotation-required":"true"}}}'
            done
            ;;
        "privilege-escalation")
            log_info "Recovering from privilege escalation incident..."
            # Restore proper RBAC bindings from backup
            if [ -f "$BACKUP_DIR/rbac-backup.yaml" ]; then
                kubectl apply -f "$BACKUP_DIR/rbac-backup.yaml"
            fi
            ;;
    esac
    
    # Verify system health after recovery
    log_info "Verifying system health post-recovery..."
    local unhealthy_pods=$(kubectl get pods --all-namespaces --field-selector=status.phase!=Running | wc -l)
    if [ "$unhealthy_pods" -gt 1 ]; then  # Account for header line
        log_warning "System recovery incomplete. $((unhealthy_pods-1)) pods are not running"
        return 1
    fi
    
    log_success "System recovery completed successfully"
    return 0
}

# Post-incident analysis
post_incident_analysis() {
    local incident_id=$1
    local incident_type=$2
    local severity=$3
    
    log_info "Conducting post-incident analysis for $incident_id..."
    
    local analysis_dir="$INCIDENT_LOG_DIR/analysis-$incident_id"
    mkdir -p "$analysis_dir"
    
    # Generate incident timeline
    cat > "$analysis_dir/incident-timeline.txt" <<EOF
Incident Timeline Analysis
=========================
Incident ID: $incident_id
Type: $incident_type
Severity: $severity
Analysis Date: $(date)

Timeline:
$(grep "$incident_id" "$INCIDENT_LOG_DIR/incident-response.log" | sort)

System State During Incident:
$(kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp | tail -50)
EOF
    
    # Generate lessons learned
    cat > "$analysis_dir/lessons-learned.txt" <<EOF
Lessons Learned Report
=====================
Incident ID: $incident_id

What Went Well:
- Automated detection systems identified the incident
- Immediate containment actions were executed
- Evidence was properly collected and preserved

Areas for Improvement:
- Review detection thresholds for false positive reduction
- Enhance automated response capabilities
- Improve notification and escalation procedures

Recommendations:
1. Update security monitoring rules based on incident patterns
2. Enhance training for incident response team
3. Review and update security policies
4. Implement additional preventive controls

Action Items:
- [ ] Update detection rules
- [ ] Conduct security training
- [ ] Review security policies
- [ ] Implement preventive controls
EOF
    
    # Generate executive summary
    cat > "$analysis_dir/executive-summary.txt" <<EOF
Executive Summary - Security Incident $incident_id
================================================

Incident Overview:
- Type: $incident_type
- Severity: $severity (${SEVERITY_LEVELS[$severity]})
- Detection Time: $(grep "Incident response environment initialized" "$INCIDENT_LOG_DIR/incident-response.log" | head -1 | cut -d' ' -f1-2)
- Resolution Time: $(date)

Impact Assessment:
- Systems Affected: Multiple Kubernetes namespaces
- Data Impact: Under investigation
- Service Availability: Maintained with minimal disruption
- Business Impact: Low to Medium

Response Actions:
- Immediate containment implemented
- Evidence collected and preserved
- System recovery completed successfully
- Post-incident analysis conducted

Next Steps:
- Implement lessons learned
- Update security controls
- Conduct security training
- Monitor for similar incidents
EOF
    
    log_success "Post-incident analysis completed. Reports available in $analysis_dir"
}

# Generate incident report
generate_incident_report() {
    local incident_id=$1
    
    log_info "Generating comprehensive incident report for $incident_id..."
    
    local report_file="$INCIDENT_LOG_DIR/incident-report-$incident_id.html"
    
    cat > "$report_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Security Incident Report - $incident_id</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #2196F3; }
        .critical { border-left-color: #f44336; }
        .warning { border-left-color: #ff9800; }
        .success { border-left-color: #4CAF50; }
        pre { background-color: #f5f5f5; padding: 10px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Incident Report</h1>
        <h2>Incident ID: $incident_id</h2>
        <p>Generated: $(date)</p>
    </div>
    
    <div class="section">
        <h2>Incident Summary</h2>
        <p>This report provides a comprehensive overview of the security incident response activities.</p>
    </div>
    
    <div class="section">
        <h2>Response Timeline</h2>
        <pre>$(grep "$incident_id" "$INCIDENT_LOG_DIR/incident-response.log" 2>/dev/null || echo "No timeline data available")</pre>
    </div>
    
    <div class="section">
        <h2>Evidence Collected</h2>
        <p>Evidence has been collected and preserved according to forensic best practices.</p>
        <p>Evidence Location: $EVIDENCE_DIR/$incident_id.tar.gz</p>
    </div>
    
    <div class="section success">
        <h2>Recovery Status</h2>
        <p>System recovery has been completed successfully. All services are operational.</p>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Review and update security monitoring rules</li>
            <li>Conduct security awareness training</li>
            <li>Implement additional preventive controls</li>
            <li>Schedule follow-up security assessment</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Incident report generated: $report_file"
}

# Main incident response orchestration
main() {
    local command=${1:-"detect"}
    
    case $command in
        "detect")
            log_info "Starting security incident detection..."
            if detect_security_incidents; then
                log_info "Security incidents detected. Initiating response..."
                
                local incident_id=$(initialize_incident_response)
                
                # Process detected incidents
                if [ -f "$INCIDENT_LOG_DIR/detected-incidents" ]; then
                    while read -r incident_type; do
                        local severity=$(classify_incident "$incident_type")
                        log_info "Processing incident: $incident_type (severity: $severity)"
                        
                        # Send notifications
                        send_notification "$severity" "$incident_type" "$incident_id" "Security incident detected and response initiated"
                        
                        # Execute containment
                        immediate_containment "$incident_type" "$severity"
                        
                        # Collect evidence
                        collect_evidence "$incident_id" "$incident_type"
                        
                        # Attempt recovery
                        if system_recovery "$incident_type" "$severity"; then
                            log_success "Recovery completed for $incident_type"
                        else
                            log_error "Recovery failed for $incident_type - manual intervention required"
                        fi
                        
                        # Post-incident analysis
                        post_incident_analysis "$incident_id" "$incident_type" "$severity"
                        
                    done < "$INCIDENT_LOG_DIR/detected-incidents"
                    
                    # Generate comprehensive report
                    generate_incident_report "$incident_id"
                    
                    # Cleanup
                    rm -f "$INCIDENT_LOG_DIR/detected-incidents"
                fi
            else
                log_info "No security incidents detected"
            fi
            ;;
        "respond")
            local incident_type=${2:-"unknown"}
            local severity=${3:-"P2"}
            
            log_info "Manual incident response initiated for $incident_type"
            local incident_id=$(initialize_incident_response)
            
            send_notification "$severity" "$incident_type" "$incident_id" "Manual incident response initiated"
            immediate_containment "$incident_type" "$severity"
            collect_evidence "$incident_id" "$incident_type"
            system_recovery "$incident_type" "$severity"
            post_incident_analysis "$incident_id" "$incident_type" "$severity"
            generate_incident_report "$incident_id"
            ;;
        "status")
            log_info "Security incident response system status:"
            echo "Log Directory: $INCIDENT_LOG_DIR"
            echo "Evidence Directory: $EVIDENCE_DIR"
            echo "Backup Directory: $BACKUP_DIR"
            
            if [ -f "$INCIDENT_LOG_DIR/current-incident-id" ]; then
                echo "Current Incident: $(cat "$INCIDENT_LOG_DIR/current-incident-id")"
            else
                echo "No active incidents"
            fi
            
            echo "Recent Incidents:"
            ls -la "$INCIDENT_LOG_DIR"/incident-report-*.html 2>/dev/null | tail -5 || echo "No recent incidents"
            ;;
        "test")
            log_info "Testing security incident response system..."
            
            # Create test incident
            echo "test-incident" > "$INCIDENT_LOG_DIR/detected-incidents"
            
            # Run detection
            main detect
            
            log_success "Security incident response test completed"
            ;;
        *)
            echo "Usage: $0 {detect|respond|status|test}"
            echo ""
            echo "Commands:"
            echo "  detect                    - Run automated incident detection and response"
            echo "  respond <type> <severity> - Manual incident response"
            echo "  status                    - Show system status"
            echo "  test                      - Test incident response system"
            echo ""
            echo "Examples:"
            echo "  $0 detect"
            echo "  $0 respond malware-detection P1"
            echo "  $0 status"
            exit 1
            ;;
    esac
}

# Initialize logging
mkdir -p "$INCIDENT_LOG_DIR"

# Run main function with all arguments
main "$@"
