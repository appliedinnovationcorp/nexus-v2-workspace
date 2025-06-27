# cert-manager Configuration

This directory contains the configuration for cert-manager, which is used for automatic TLS certificate provisioning and renewal in the AIC Website infrastructure.

## Overview

cert-manager is a Kubernetes add-on that automates the management and issuance of TLS certificates from various issuing sources. In our implementation, we use cert-manager with Let's Encrypt to provide free, automated TLS certificates for all our services.

## Components

1. **cert-manager Helm Chart**: Installs the core cert-manager components
2. **ClusterIssuers**: Define how certificates are obtained (e.g., from Let's Encrypt)
3. **Certificates**: Request certificates for specific domains
4. **Ingress Integration**: Automatically provision certificates for Ingress resources

## ClusterIssuers

We have configured two ClusterIssuers:

1. **letsencrypt-staging**: For testing certificate issuance without hitting Let's Encrypt rate limits
2. **letsencrypt-prod**: For production-ready certificates

Both issuers support two challenge types:

- **HTTP-01**: For standard domain validation
- **DNS-01**: For wildcard certificates and domains without public HTTP access

## Certificate Issuance Methods

### Method 1: Automatic via Ingress Annotations

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - secretName: example-tls
      hosts:
        - example.com
```

### Method 2: Manual via Certificate Resources

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: example-com-tls
spec:
  secretName: example-com-tls
  dnsNames:
    - example.com
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
```

## DNS-01 Challenge Configuration

For wildcard certificates or domains without public HTTP access, we use the DNS-01 challenge with Route53:

1. Create a Route53 IAM user with appropriate permissions
2. Store the credentials in a Kubernetes secret
3. Configure the ClusterIssuer to use these credentials

## Certificate Renewal

cert-manager automatically handles certificate renewal:

- Certificates are renewed when they are within 30 days of expiration
- Renewal is attempted every 8 hours until successful
- No manual intervention is required

## Monitoring

cert-manager exposes Prometheus metrics that can be used to monitor:

- Certificate expiration
- Renewal attempts
- Issuance failures

## Troubleshooting

Common issues and solutions:

1. **Certificate not issued**: Check the Certificate and CertificateRequest resources for error messages
2. **Challenge failures**: Verify DNS or HTTP configuration
3. **Rate limiting**: Use the staging issuer for testing

Commands for troubleshooting:

```bash
# Check certificate status
kubectl get certificates -A

# Check certificate request status
kubectl get certificaterequests -A

# Check challenges
kubectl get challenges -A

# View cert-manager logs
kubectl logs -n security -l app=cert-manager
```

## References

- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Route53 DNS-01 Configuration](https://cert-manager.io/docs/configuration/acme/dns01/route53/)
