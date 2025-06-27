// Keycloak configuration for backend application

const KcAdminClient = require('@keycloak/keycloak-admin-client');
const { Issuer } = require('openid-client');

// Environment-specific configuration
const getKeycloakConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      url: process.env.KEYCLOAK_URL || 'https://auth.dev.example.com',
      realm: process.env.KEYCLOAK_REALM || 'aic-website',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'aic-website-backend-api',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'client-secret',
      adminUser: process.env.KEYCLOAK_ADMIN_USER || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
    staging: {
      url: process.env.KEYCLOAK_URL || 'https://auth.staging.example.com',
      realm: process.env.KEYCLOAK_REALM || 'aic-website',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'aic-website-backend-api',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'client-secret',
      adminUser: process.env.KEYCLOAK_ADMIN_USER || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
    production: {
      url: process.env.KEYCLOAK_URL || 'https://auth.example.com',
      realm: process.env.KEYCLOAK_REALM || 'aic-website',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'aic-website-backend-api',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'client-secret',
      adminUser: process.env.KEYCLOAK_ADMIN_USER || 'admin',
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
  };
  
  return configs[env];
};

// Initialize Keycloak Admin Client
const initKeycloakAdminClient = async () => {
  const config = getKeycloakConfig();
  
  const kcAdminClient = new KcAdminClient({
    baseUrl: `${config.url}/`,
    realmName: config.realm,
  });
  
  await kcAdminClient.auth({
    grantType: 'password',
    clientId: 'admin-cli',
    username: config.adminUser,
    password: config.adminPassword,
  });
  
  // Refresh token periodically
  setInterval(() => {
    kcAdminClient.auth({
      grantType: 'refresh_token',
      refreshToken: kcAdminClient.refreshToken,
    });
  }, 58 * 1000); // Refresh every 58 seconds
  
  return kcAdminClient;
};

// Initialize OpenID Client
const initOpenIdClient = async () => {
  const config = getKeycloakConfig();
  
  const keycloakIssuer = await Issuer.discover(
    `${config.url}/realms/${config.realm}/.well-known/openid-configuration`
  );
  
  const client = new keycloakIssuer.Client({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    token_endpoint_auth_method: 'client_secret_basic',
  });
  
  return client;
};

// Get service account token
const getServiceAccountToken = async () => {
  const config = getKeycloakConfig();
  const client = await initOpenIdClient();
  
  const tokenSet = await client.grant({
    grant_type: 'client_credentials',
    scope: 'openid',
  });
  
  return tokenSet.access_token;
};

// Verify JWT token
const verifyToken = async (token) => {
  const client = await initOpenIdClient();
  
  try {
    const tokenSet = await client.introspect(token);
    return tokenSet.active ? tokenSet : null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

module.exports = {
  getKeycloakConfig,
  initKeycloakAdminClient,
  initOpenIdClient,
  getServiceAccountToken,
  verifyToken,
};
