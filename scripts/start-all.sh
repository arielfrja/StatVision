#!/bin/bash

# StatVision Master Production Start Script
# Runs the ALREADY BUILT production artifacts.
# This script does NOT build the project.

echo "🚀 [START] Launching production StatVision services..."

# Ensure we have a way to kill all background processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# 0. Run Database Migrations
echo "🗄️ [DB] Running migrations..."
npm run migrate:run

# 1. Start API Service (Production Build)
echo "🔌 [API] Starting from build/app.js..."
(cd api && npm run start) &

# 2. Start Worker Service (Production Build)
echo "🤖 [WORKER] Starting from build/startWorker.js..."
(cd worker && npm run start) &

# 3. Start Frontend (Next.js Production Server)
echo "🎨 [FRONTEND] Starting from .next folder..."
(cd frontend && npm run start) &

echo "✅ [START] All production services are running."
echo "📝 [LOGS] Press Ctrl+C to stop all."

# Wait for all background processes
wait
