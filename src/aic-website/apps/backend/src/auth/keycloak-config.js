// Keycloak configuration for backend application

const KcAdminClient = require('@keycloak/keycloak-admin-client');
const { Issuer } = require('openid-client');

// Keycloak configuration for backend application

const KcAdminClient = require('@keycloak/keycloak-admin-client');
const { Issuer } = require('openid-client');

// Environment-specific configuration
const getKeycloakConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  // Validate required environment variables
  const requiredVars = ['KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  const configs = {
    development: {
      url: process.env.KEYCLOAK_URL, // No fallback - must be set
      realm: process.env.KEYCLOAK_REALM, // No fallback - must be set
      clientId: process.env.KEYCLOAK_CLIENT_ID, // No fallback - must be set
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET, // No fallback - must be set
      adminUser: process.env.KEYCLOAK_ADMIN_USER, // No fallback - must be set
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD, // No fallback - must be set
    },
    staging: {
      url: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      adminUser: process.env.KEYCLOAK_ADMIN_USER,
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
    },
    production: {
      url: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      adminUser: process.env.KEYCLOAK_ADMIN_USER,
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
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
