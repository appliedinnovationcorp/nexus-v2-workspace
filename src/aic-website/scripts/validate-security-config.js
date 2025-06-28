#!/usr/bin/env node

/**
 * Security Configuration Validation Script
 * 
 * This script validates that all required security environment variables
 * are properly configured before deployment.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Load environment variables
require('dotenv').config();

const requiredSecrets = [
  'JWT_SECRET',
  'NEXTAUTH_SECRET'
];

const requiredKeycloakVars = [
  'KEYCLOAK_URL',
  'KEYCLOAK_REALM',
  'KEYCLOAK_CLIENT_ID',
  'KEYCLOAK_CLIENT_SECRET',
  'KEYCLOAK_ADMIN_USER',
  'KEYCLOAK_ADMIN_PASSWORD'
];

const weakSecrets = [
  'your-secret-key-change-in-production',
  'aic-jwt-secret-development-key',
  'dev-only-jwt-secret-CHANGE-IN-PRODUCTION',
  'aic-development-secret-key-for-local-testing-only-min-32-chars',
  'dev-only-secret-CHANGE-IN-PRODUCTION-min-32-chars',
  'secret',
  'password',
  '123456',
  'admin',
  'test',
  'development',
  'localhost'
];

let hasErrors = false;
let hasWarnings = false;

function validateSecret(name, value) {
  if (!value) {
    logError(`${name} is not set`);
    hasErrors = true;
    return false;
  }

  if (value.length < 32) {
    logError(`${name} must be at least 32 characters long (current: ${value.length})`);
    hasErrors = true;
    return false;
  }

  if (weakSecrets.includes(value.toLowerCase())) {
    logError(`${name} is using a weak/default value`);
    hasErrors = true;
    return false;
  }

  // Check if it looks like a development placeholder
  if (value.toLowerCase().includes('change') || 
      value.toLowerCase().includes('dev-only') ||
      value.toLowerCase().includes('development')) {
    logError(`${name} appears to be a development placeholder`);
    hasErrors = true;
    return false;
  }

  // Check entropy (basic check)
  const uniqueChars = new Set(value).size;
  if (uniqueChars < 10) {
    logWarning(`${name} has low character diversity (${uniqueChars} unique characters)`);
    hasWarnings = true;
  }

  logSuccess(`${name} is properly configured`);
  return true;
}

function validateUrl(name, value) {
  if (!value) {
    logError(`${name} is not set`);
    hasErrors = true;
    return false;
  }

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      logError(`${name} must use HTTP or HTTPS protocol`);
      hasErrors = true;
      return false;
    }

    if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
      logError(`${name} should use HTTPS in production`);
      hasErrors = true;
      return false;
    }

    logSuccess(`${name} is properly configured`);
    return true;
  } catch (error) {
    logError(`${name} is not a valid URL: ${error.message}`);
    hasErrors = true;
    return false;
  }
}

function validateRequired(name, value) {
  if (!value) {
    logError(`${name} is not set`);
    hasErrors = true;
    return false;
  }

  if (weakSecrets.includes(value.toLowerCase())) {
    logError(`${name} is using a weak/default value`);
    hasErrors = true;
    return false;
  }

  logSuccess(`${name} is set`);
  return true;
}

function validateCorsOrigins() {
  const corsOrigins = process.env.CORS_ORIGINS;
  
  if (corsOrigins) {
    const origins = corsOrigins.split(',').map(o => o.trim());
    
    for (const origin of origins) {
      try {
        new URL(origin);
        logSuccess(`CORS origin ${origin} is valid`);
      } catch (error) {
        logError(`CORS origin ${origin} is not a valid URL`);
        hasErrors = true;
      }
    }
  } else {
    logInfo('CORS_ORIGINS not set - using environment defaults');
  }
}

function validateRedisConfig() {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisHost) {
    logWarning('REDIS_HOST not set - rate limiting will use in-memory store');
    hasWarnings = true;
  } else {
    logSuccess(`Redis host configured: ${redisHost}`);
  }

  if (redisPort && (isNaN(redisPort) || redisPort < 1 || redisPort > 65535)) {
    logError('REDIS_PORT must be a valid port number (1-65535)');
    hasErrors = true;
  }

  if (process.env.NODE_ENV === 'production' && !redisPassword) {
    logWarning('REDIS_PASSWORD not set - consider using authentication in production');
    hasWarnings = true;
  }
}

function generateSecureSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function main() {
  log('\n🔒 Security Configuration Validation', 'bold');
  log('=====================================\n');

  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logInfo(`Validation started at: ${new Date().toISOString()}\n`);

  // Validate secrets
  log('Validating Secrets:', 'bold');
  for (const secret of requiredSecrets) {
    validateSecret(secret, process.env[secret]);
  }

  // Validate Keycloak configuration
  log('\nValidating Keycloak Configuration:', 'bold');
  validateUrl('KEYCLOAK_URL', process.env.KEYCLOAK_URL);
  for (const variable of requiredKeycloakVars.slice(1)) {
    validateRequired(variable, process.env[variable]);
  }

  // Validate CORS configuration
  log('\nValidating CORS Configuration:', 'bold');
  validateCorsOrigins();

  // Validate Redis configuration
  log('\nValidating Redis Configuration:', 'bold');
  validateRedisConfig();

  // Summary
  log('\n📊 Validation Summary:', 'bold');
  log('====================');

  if (hasErrors) {
    logError('Validation failed! Please fix the errors above before deploying.');
    log('\n💡 To generate secure secrets, run:', 'blue');
    log('   openssl rand -base64 32\n');
    process.exit(1);
  } else if (hasWarnings) {
    logWarning('Validation passed with warnings. Review the warnings above.');
    log('\n✨ Example secure secrets:', 'green');
    log(`   JWT_SECRET="${generateSecureSecret()}"`);
    log(`   NEXTAUTH_SECRET="${generateSecureSecret()}"\n`);
    process.exit(0);
  } else {
    logSuccess('All security configurations are valid!');
    log('\n🚀 Ready for deployment!\n');
    process.exit(0);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateSecret,
  validateUrl,
  validateRequired,
  generateSecureSecret
};
