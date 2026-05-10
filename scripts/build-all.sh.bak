#!/bin/bash

# StatVision Master Build Script
# Builds all components of the monorepo in the correct order.

set -e # Exit on error

echo "🚀 [BUILD] Starting Master Build..."

# Force production environment for the build phase
export NODE_ENV=production

# 1. Common Library (Essential Foundation)
echo "📦 [1/4] Building @statvision/common..."
cd common && npm run build
cd ..

# 2. API Service
echo "🔌 [2/4] Building API Service..."
cd api && npm run build
cd ..

# 3. Worker Service
echo "🤖 [3/4] Building Worker Service..."
cd worker && npm run build
cd ..

# 4. Frontend (Next.js)
echo "🎨 [4/4] Building Frontend..."
cd frontend && npm run build
cd ..

echo "✅ [BUILD] All components built successfully!"
