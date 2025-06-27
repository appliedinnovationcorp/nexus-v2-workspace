import React, { useState, useEffect, createContext, useContext } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { keycloak, keycloakInitOptions } from './keycloak-config';

// Create Auth Context
const AuthContext = createContext(null);

// Silent check SSO iframe HTML
const silentCheckSsoHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Silent SSO check</title>
  <script>
    parent.postMessage(location.href, location.origin);
  </script>
</head>
<body>
  Silent check SSO
</body>
</html>
`;

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create silent check SSO file
  useEffect(() => {
    const createSilentCheckSsoFile = () => {
      try {
        const file = new Blob([silentCheckSsoHtml], { type: 'text/html' });
        const fileURL = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = 'silent-check-sso.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Failed to create silent check SSO file:', err);
      }
    };

    if (process.env.NODE_ENV === 'development') {
      createSilentCheckSsoFile();
    }
  }, []);

  // Event handlers for Keycloak
  const onKeycloakEvent = (event, error) => {
    console.log('Keycloak event:', event);
    if (error) {
      console.error('Keycloak error:', error);
      setError(error);
    }

    if (event === 'onReady') {
      setIsLoading(false);
    }

    if (event === 'onAuthSuccess') {
      setIsAuthenticated(true);
      updateUserInfo();
    }

    if (event === 'onAuthError') {
      setIsAuthenticated(false);
      setUser(null);
    }

    if (event === 'onAuthLogout') {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Token refresh handler
  const onKeycloakTokens = (tokens) => {
    console.log('Keycloak tokens refreshed');
  };

  // Update user info from Keycloak
  const updateUserInfo = async () => {
    if (keycloak.authenticated) {
      try {
        // Load user profile
        const profile = await keycloak.loadUserProfile();
        
        // Get user roles
        const roles = keycloak.realmAccess?.roles || [];
        
        // Create user object
        const userInfo = {
          id: keycloak.subject,
          username: profile.username,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          roles,
          isAdmin: roles.includes('admin'),
          isEditor: roles.includes('editor'),
        };
        
        setUser(userInfo);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError(err);
      }
    }
  };

  // Auth methods
  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
  };

  const register = () => {
    keycloak.register();
  };

  const updateToken = (minValidity = 5) => {
    return keycloak.updateToken(minValidity);
  };

  // Auth context value
  const authContextValue = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    updateToken,
    keycloak,
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakInitOptions}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
    >
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    </ReactKeycloakProvider>
  );
};

// Auth Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
