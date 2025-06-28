#!/usr/bin/env node

/**
 * Accessibility Testing Script
 * 
 * This script runs automated accessibility tests on the AIC website
 * using axe-core and Playwright.
 */

const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const outputDir = path.join(__dirname, '../accessibility-reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(outputDir, `accessibility-report-${timestamp}.json`);

// Pages to test
const pagesToTest = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/services', name: 'Services' },
  { path: '/contact', name: 'Contact' },
  // Add more pages as needed
];

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Run accessibility tests
async function runAccessibilityTests() {
  console.log('🧪 Running accessibility tests...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];
  
  for (const page of pagesToTest) {
    console.log(`Testing ${page.name} page (${page.path})...`);
    
    const pageObj = await context.newPage();
    await pageObj.goto(`${baseUrl}${page.path}`);
    
    // Wait for page to be fully loaded
    await pageObj.waitForLoadState('networkidle');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page: pageObj })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    results.push({
      page: page.name,
      path: page.path,
      violations: accessibilityScanResults.violations,
      passes: accessibilityScanResults.passes.length,
      incomplete: accessibilityScanResults.incomplete.length,
      inapplicable: accessibilityScanResults.inapplicable.length,
    });
    
    await pageObj.close();
  }
  
  await browser.close();
  
  // Save results to file
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n📊 Accessibility Test Summary:');
  let totalViolations = 0;
  
  results.forEach(result => {
    const violationCount = result.violations.length;
    totalViolations += violationCount;
    
    console.log(`\n${result.page} (${result.path}):`);
    console.log(`- Violations: ${violationCount}`);
    console.log(`- Passes: ${result.passes}`);
    console.log(`- Incomplete: ${result.incomplete}`);
    console.log(`- Inapplicable: ${result.inapplicable}`);
    
    if (violationCount > 0) {
      console.log('\nViolations:');
      result.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description} (Impact: ${violation.impact})`);
        console.log(`  Help: ${violation.help}`);
        console.log(`  Elements affected: ${violation.nodes.length}`);
      });
    }
  });
  
  console.log(`\n🔍 Total violations across all pages: ${totalViolations}`);
  console.log(`📝 Detailed report saved to: ${outputFile}`);
  
  return totalViolations;
}

// Main function
async function main() {
  try {
    const violations = await runAccessibilityTests();
    
    if (violations > 0) {
      console.log('\n⚠️ Accessibility issues found. Please fix them before deploying.');
      process.exit(1);
    } else {
      console.log('\n✅ No accessibility issues found!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error running accessibility tests:', error);
    process.exit(1);
  }
}

// Run the script
main();
