#!/usr/bin/env node

/**
 * Update Package.json Script
 * 
 * This script updates the package.json file to add new scripts for
 * accessibility testing, error boundary testing, and state management.
 */

const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// New scripts to add
const newScripts = {
  // Accessibility scripts
  'test:accessibility': 'node ./scripts/test-accessibility.js',
  'test:a11y': 'npm run test:accessibility',
  
  // Architecture fix scripts
  'setup:architecture': './scripts/setup-architecture-fixes.sh',
  'migrate:imports': 'node ./scripts/migrate-imports.js',
  
  // Error boundary testing
  'test:error-boundaries': 'playwright test tests/error-boundaries',
  
  // State management
  'analyze:state': 'node ./scripts/analyze-state-usage.js',
  
  // Combined scripts
  'fix:architecture': 'npm run setup:architecture && npm run install-dependencies && npm run migrate:imports && npm run build',
};

// Add new scripts to package.json
packageJson.scripts = {
  ...packageJson.scripts,
  ...newScripts,
};

// New devDependencies to add
const newDevDependencies = {
  '@axe-core/playwright': '^4.7.3',
  'playwright': '^1.40.1',
  '@testing-library/react': '^14.1.2',
  '@testing-library/jest-dom': '^6.1.5',
};

// Add new devDependencies to package.json
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  ...newDevDependencies,
};

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ package.json updated successfully!');
console.log('\n🔧 New scripts added:');
Object.keys(newScripts).forEach(script => {
  console.log(`- ${script}: ${newScripts[script]}`);
});

console.log('\n📦 New devDependencies added:');
Object.keys(newDevDependencies).forEach(dep => {
  console.log(`- ${dep}: ${newDevDependencies[dep]}`);
});

console.log('\n🚀 Next steps:');
console.log('1. Run "npm install" to install new dependencies');
console.log('2. Run "npm run setup:architecture" to set up architecture fixes');
console.log('3. Run "npm run fix:architecture" to apply all fixes');
