// Keycloak configuration for frontend application

import Keycloak from 'keycloak-js';

// Environment-specific configuration
const getKeycloakConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      url: 'https://auth.dev.example.com',
      realm: 'aic-website',
      clientId: 'aic-website-frontend',
      redirectUri: 'https://dev.example.com/auth/callback',
    },
    staging: {
      url: 'https://auth.staging.example.com',
      realm: 'aic-website',
      clientId: 'aic-website-frontend',
      redirectUri: 'https://staging.example.com/auth/callback',
    },
    production: {
      url: 'https://auth.example.com',
      realm: 'aic-website',
      clientId: 'aic-website-frontend',
      redirectUri: 'https://www.example.com/auth/callback',
    },
  };
  
  return configs[env];
};

// Initialize Keycloak
const initKeycloak = () => {
  const config = getKeycloakConfig();
  
  return new Keycloak({
    url: config.url,
    realm: config.realm,
    clientId: config.clientId,
  });
};

// Keycloak instance
const keycloak = initKeycloak();

// Keycloak initialization options
const keycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
  checkLoginIframe: false,
  enableLogging: process.env.NODE_ENV !== 'production',
};

export { keycloak, keycloakInitOptions };
