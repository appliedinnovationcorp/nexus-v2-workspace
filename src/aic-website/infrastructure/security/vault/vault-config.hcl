# HashiCorp Vault Configuration for AIC Website
# This configuration provides enterprise-grade secret management with Kubernetes integration

# Cluster configuration
cluster_name = "aic-website-vault"

# Storage backend configuration - Consul for HA
storage "consul" {
  address = "consul.vault-system.svc.cluster.local:8500"
  path    = "vault/"
  
  # Consul configuration
  scheme = "http"
  token  = ""
  
  # High availability settings
  consistency_mode = "strong"
  max_parallel     = "128"
  
  # Session configuration
  session_ttl = "15s"
  lock_wait_time = "15s"
  
  # TLS configuration for Consul (if enabled)
  tls_ca_file   = "/vault/tls/consul-ca.pem"
  tls_cert_file = "/vault/tls/consul-client.pem"
  tls_key_file  = "/vault/tls/consul-client-key.pem"
  tls_skip_verify = false
}

# Alternative storage backend - Integrated Storage (Raft)
# Uncomment to use Raft instead of Consul
# storage "raft" {
#   path    = "/vault/data"
#   node_id = "vault-0"
#   
#   # Retry configuration
#   retry_join {
#     leader_api_addr = "https://vault-0.vault-internal.vault-system.svc.cluster.local:8200"
#   }
#   retry_join {
#     leader_api_addr = "https://vault-1.vault-internal.vault-system.svc.cluster.local:8200"
#   }
#   retry_join {
#     leader_api_addr = "https://vault-2.vault-internal.vault-system.svc.cluster.local:8200"
#   }
# }

# Listener configuration
listener "tcp" {
  address       = "0.0.0.0:8200"
  cluster_addr  = "0.0.0.0:8201"
  tls_cert_file = "/vault/tls/vault-server.pem"
  tls_key_file  = "/vault/tls/vault-server-key.pem"
  
  # TLS configuration
  tls_min_version = "tls12"
  tls_cipher_suites = "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305"
  tls_prefer_server_cipher_suites = true
  tls_require_and_verify_client_cert = false
  
  # HTTP configuration
  http_idle_timeout = "5m"
  http_read_header_timeout = "10s"
  http_read_timeout = "30s"
  http_write_timeout = "0"
  
  # Proxy configuration
  proxy_protocol_behavior = "use_always"
  proxy_protocol_authorized_addrs = "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
}

# Cluster listener for HA
listener "tcp" {
  address     = "0.0.0.0:8201"
  tls_cert_file = "/vault/tls/vault-server.pem"
  tls_key_file  = "/vault/tls/vault-server-key.pem"
  tls_min_version = "tls12"
}

# Seal configuration - Auto-unseal with AWS KMS
seal "awskms" {
  region     = "us-west-2"
  kms_key_id = "arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012"
  endpoint   = "https://kms.us-west-2.amazonaws.com"
}

# Alternative seal configuration - Transit seal (Vault-to-Vault)
# seal "transit" {
#   address            = "https://vault-transit.example.com:8200"
#   token              = "s.Qf1s5zigZ4OX6akYjQXJC1jY"
#   disable_renewal    = "false"
#   key_name           = "autounseal"
#   mount_path         = "transit/"
#   namespace          = "ns1/"
# }

# API address configuration
api_addr = "https://vault.aicorp.com:8200"
cluster_addr = "https://vault.aicorp.com:8201"

# UI configuration
ui = true

# Logging configuration
log_level = "INFO"
log_format = "json"
log_file = "/vault/logs/vault.log"
log_rotate_duration = "24h"
log_rotate_max_files = 30

# Performance and resource configuration
default_lease_ttl = "768h"    # 32 days
max_lease_ttl = "8760h"       # 365 days

# Disable mlock for containerized environments
disable_mlock = true

# Cache configuration
cache_size = "32000"

# Plugin directory
plugin_directory = "/vault/plugins"

# Telemetry configuration
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
  
  # StatsD configuration
  statsd_address = "statsd.monitoring.svc.cluster.local:8125"
  
  # Circonus configuration (optional)
  circonus_api_token = ""
  circonus_api_app = "vault"
  circonus_api_url = "https://api.circonus.com/v2"
  circonus_submission_interval = "10s"
  circonus_submission_url = ""
  circonus_check_id = ""
  circonus_check_force_metric_activation = "false"
  circonus_check_instance_id = ""
  circonus_check_search_tag = ""
  circonus_check_display_name = ""
  circonus_check_tags = ""
  circonus_broker_id = ""
  circonus_broker_select_tag = ""
}

# Entropy configuration
entropy "seal" {
  mode = "augmentation"
}

# Service registration
service_registration "kubernetes" {
  namespace      = "vault-system"
  pod_name       = "vault-0"
}

# Raw storage endpoint (for debugging)
raw_storage_endpoint = true

# Cluster configuration
cluster_cipher_suites = "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"

# License configuration (for Enterprise)
# license_path = "/vault/license/vault.hclic"

# Sentinel configuration (Enterprise feature)
# sentinel {
#   additional_enabled_modules = []
# }

# HSM configuration (Enterprise feature)
# pkcs11 {
#   lib            = "/usr/lib/libCryptoki2_64.so"
#   slot           = "0"
#   pin            = "AAAA-BBBB-CCCC-DDDD"
#   key_label      = "vault-hsm-key"
#   hmac_key_label = "vault-hsm-hmac-key"
#   generate_key   = "true"
# }
