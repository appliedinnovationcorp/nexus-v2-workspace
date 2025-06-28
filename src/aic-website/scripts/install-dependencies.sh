#!/bin/bash

# AIC Website - Install Dependencies for Architecture Fixes
# This script installs all necessary dependencies for the new architecture

set -e

echo "🚀 Installing AIC Architecture Fix Dependencies..."

# Root dependencies
echo "📦 Installing root dependencies..."
npm install zustand@^4.4.7 immer@^10.0.3

# UI package dependencies
echo "📦 Installing UI package dependencies..."
cd packages/ui
npm install lucide-react@^0.294.0 clsx@^2.0.0 class-variance-authority@^0.7.0
cd ../..

# Utils package dependencies
echo "📦 Installing Utils package dependencies..."
cd packages/utils
npm install zustand@^4.4.7 immer@^10.0.3
cd ../..

# App-specific dependencies
echo "📦 Installing app dependencies..."

# BI Dashboard
cd apps/bi-dashboard
npm install react-query@^3.39.3 socket.io-client@^4.7.4 react-hot-toast@^2.4.1
cd ../..

# Customer Journey Mapping
cd apps/customer-journey-mapping
npm install react-query@^3.39.3 socket.io-client@^4.7.4
cd ../..

# Threat Detection
cd apps/threat-detection
npm install react-query@^3.39.3 socket.io-client@^4.7.4
cd ../..

# Install all workspace dependencies
echo "📦 Installing workspace dependencies..."
npm install

echo "✅ All dependencies installed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Run 'npm run build' to build all packages"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Check the ARCHITECTURE_FIXES_IMPLEMENTATION.md for usage examples"
