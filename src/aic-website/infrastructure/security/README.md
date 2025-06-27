# Security Implementation for AIC Website

This directory contains the security implementation for the AIC Website, based on [ADR-0008](../../docs/adr/0008-security-implementation.md).

## Overview

The security implementation consists of the following components:

1. **Keycloak**: Identity and Access Management
2. **HashiCorp Vault**: Secrets Management
3. **cert-manager**: TLS Certificate Management
4. **Network Policies**: Service Isolation
5. **mTLS**: Service-to-Service Communication Security

## Keycloak

Keycloak provides identity and access management for the AIC Website, including:

- User authentication and authorization
- Single sign-on (SSO)
- OAuth2/OpenID Connect implementation
- User federation with LDAP
- Role-based access control (RBAC)

### Configuration

The Keycloak configuration is defined in the following files:

- `../helm/keycloak-values.yaml`: Helm values for Keycloak deployment
- `../kubernetes/services/security/keycloak-theme-configmap.yaml`: Custom theme for Keycloak
- `../kubernetes/services/security/keycloak-secrets.yaml`: Secrets for Keycloak
- `../kubernetes/services/api-gateway/kong-keycloak-plugin.yaml`: Kong plugins for Keycloak integration
- `../kubernetes/services/api-gateway/kong-keycloak-ingress.yaml`: Kong Ingress for Keycloak

### Realm Configuration

The Keycloak realm configuration includes:

- Realm settings (name, display name, themes, etc.)
- Realm roles (user, admin, editor, api-user)
- Client scopes (profile, api-access)
- Clients (frontend, backend API, AI services, Kong API Gateway)
- User federation (LDAP)
- Authentication flows
- Required actions
- SMTP server configuration

### Client Configuration

The following clients are configured:

1. **aic-website-frontend**: Frontend web application
   - Standard flow enabled (Authorization Code)
   - PKCE enabled
   - Redirect URIs for all environments
   - Access to profile and email scopes

2. **aic-website-backend-api**: Backend API services
   - Service accounts enabled
   - Authorization services enabled
   - Resource-based permissions
   - Access to api-access scope

3. **aic-website-ai-services**: AI Services API
   - Service accounts enabled
   - Access to api-access scope

4. **kong-api-gateway**: Kong API Gateway
   - Service accounts enabled
   - Standard flow enabled
   - Access to api-access scope

### User Federation

Keycloak is configured to integrate with an LDAP server for user federation:

- Connection to LDAP server in the security namespace
- Read-only mode
- Synchronization of users
- Mapping of LDAP attributes to Keycloak attributes

### Custom Theme

A custom theme is provided for Keycloak to match the AIC Website branding:

- Login theme
- Account theme
- Email theme
- Admin theme

## Integration with API Gateway

Keycloak is integrated with Kong API Gateway using the OIDC plugin:

- Bearer token validation
- JWT validation
- Introspection endpoint configuration
- Audience validation
- Redirect URIs for login and logout
- CORS configuration for Keycloak

## Integration with Frontend Applications

Frontend applications integrate with Keycloak using the Authorization Code flow with PKCE:

1. User is redirected to Keycloak for authentication
2. After successful authentication, user is redirected back to the frontend with an authorization code
3. Frontend exchanges the authorization code for an access token and refresh token
4. Frontend uses the access token for API calls
5. Frontend refreshes the access token using the refresh token when needed

## Integration with Backend Services

Backend services integrate with Keycloak using the Client Credentials flow:

1. Service authenticates with Keycloak using client ID and client secret
2. Service receives an access token
3. Service uses the access token for API calls to other services

## Deployment

To deploy Keycloak:

```bash
./deploy-keycloak.sh
```

This script will:
1. Create the security namespace
2. Apply secrets and ConfigMaps
3. Deploy Keycloak using Helm
4. Apply Kong plugins and Ingress for Keycloak

## Security Best Practices

The Keycloak configuration follows these security best practices:

- TLS encryption for all communications
- PKCE for public clients
- Short-lived access tokens (5 minutes)
- Refresh tokens with limited reuse
- Role-based access control
- Resource-based permissions
- Brute force protection
- Email verification
- Password policies
- Secure session management

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect](https://openid.net/connect/)
- [OAuth 2.0](https://oauth.net/2/)
- [Kong OIDC Plugin](https://docs.konghq.com/hub/kong-inc/openid-connect/)
- [Bitnami Keycloak Helm Chart](https://github.com/bitnami/charts/tree/master/bitnami/keycloak)
