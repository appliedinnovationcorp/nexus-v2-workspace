#!/bin/bash

# AIC Website - Setup Architecture Fixes
# This script sets up the architecture fixes implementation

set -e

echo "🚀 Setting up AIC Architecture Fixes..."

# Make scripts executable
chmod +x ./scripts/install-dependencies.sh
chmod +x ./scripts/migrate-imports.js

# Create necessary directories
mkdir -p ./packages/ui/src/components/accessibility
mkdir -p ./packages/ui/src/styles
mkdir -p ./packages/ui/src/lib
mkdir -p ./packages/utils/src/store

echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Run './scripts/install-dependencies.sh' to install dependencies"
echo "2. Run 'node ./scripts/migrate-imports.js' to update import paths"
echo "3. Run 'npm run build' to build all packages"
echo "4. Run 'npm run dev' to start development servers"
