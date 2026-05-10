#!/bin/bash

# StatVision Master Restart Script
# Kills all node/npm processes associated with the project and restarts.

echo "🔄 [RESTART] Cleaning up existing processes..."

# Kill any node/npm processes running in this directory's subfolders
pkill -f "node|npm" || true

echo "🧹 [RESTART] Clearing build artifacts..."
rm -rf common/build api/build worker/build frontend/.next

echo "🚀 [RESTART] Launching all services..."
./scripts/run-all.sh
