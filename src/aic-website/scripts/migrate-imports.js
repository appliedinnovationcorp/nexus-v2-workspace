#!/usr/bin/env node

/**
 * Import Path Migration Script
 * 
 * This script updates import paths across the codebase to follow the standardized pattern:
 * - Local imports: @/components/*, @/lib/*, etc.
 * - Workspace packages: @aic/ui, @aic/utils, etc.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

// Import patterns to replace
const importPatterns = [
  // Relative imports to standardized imports
  { 
    regex: /from ['"]\.\.\/components\/([^'"]+)['"]/g, 
    replacement: 'from \'@/components/$1\''
  },
  { 
    regex: /from ['"]\.\.\/lib\/([^'"]+)['"]/g, 
    replacement: 'from \'@/lib/$1\''
  },
  { 
    regex: /from ['"]\.\.\/hooks\/([^'"]+)['"]/g, 
    replacement: 'from \'@/hooks/$1\''
  },
  { 
    regex: /from ['"]\.\.\/utils\/([^'"]+)['"]/g, 
    replacement: 'from \'@/utils/$1\''
  },
  { 
    regex: /from ['"]\.\.\/contexts\/([^'"]+)['"]/g, 
    replacement: 'from \'@/contexts/$1\''
  },
  { 
    regex: /from ['"]\.\.\/styles\/([^'"]+)['"]/g, 
    replacement: 'from \'@/styles/$1\''
  },
  
  // Package imports
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/ui\/src\/([^'"]+)['"]/g, 
    replacement: 'from \'@aic/ui/$1\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/ui\/src['"]/g, 
    replacement: 'from \'@aic/ui\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/utils\/src\/([^'"]+)['"]/g, 
    replacement: 'from \'@aic/utils/$1\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/utils\/src['"]/g, 
    replacement: 'from \'@aic/utils\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/auth\/src\/([^'"]+)['"]/g, 
    replacement: 'from \'@aic/auth/$1\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/auth\/src['"]/g, 
    replacement: 'from \'@aic/auth\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/config\/src\/([^'"]+)['"]/g, 
    replacement: 'from \'@aic/config/$1\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/config\/src['"]/g, 
    replacement: 'from \'@aic/config\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/database\/src\/([^'"]+)['"]/g, 
    replacement: 'from \'@aic/database/$1\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/database\/src['"]/g, 
    replacement: 'from \'@aic/database\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/ai-sdk\/src\/([^'"]+)['"]/g, 
    replacement: 'from \'@aic/ai-sdk/$1\''
  },
  { 
    regex: /from ['"]\.\.\/\.\.\/packages\/ai-sdk\/src['"]/g, 
    replacement: 'from \'@aic/ai-sdk\''
  },
  
  // Inconsistent import styles
  { 
    regex: /import\s+([^*{][^'"\s]+)\s+from\s+['"]([^'"]+)['"]/g, 
    replacement: 'import { $1 } from \'$2\''
  }
];

// File extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Get all TypeScript/JavaScript files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      fileList = getFiles(filePath, fileList);
    } else if (extensions.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Process a file
function processFile(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  importPatterns.forEach(pattern => {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated imports in ${filePath}`);
    return 1;
  }
  
  return 0;
}

// Main function
async function main() {
  console.log('🔍 Scanning for files to update...');
  
  // Get all files
  const appFiles = getFiles(appsDir);
  const packageFiles = getFiles(packagesDir);
  const allFiles = [...appFiles, ...packageFiles];
  
  console.log(`Found ${allFiles.length} files to process`);
  
  // Process files
  let updatedCount = 0;
  allFiles.forEach(file => {
    updatedCount += processFile(file);
  });
  
  console.log(`\n✅ Import migration complete!`);
  console.log(`Updated ${updatedCount} files out of ${allFiles.length}`);
  
  if (updatedCount > 0) {
    console.log('\n🔧 Next steps:');
    console.log('1. Review the changes');
    console.log('2. Run tests to ensure everything works');
    console.log('3. Commit the changes');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
