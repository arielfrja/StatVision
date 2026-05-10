#!/bin/bash

# StatVision Master Run Script
# Runs all services concurrently for debugging and development.

echo "🚀 [RUN] Starting all StatVision services..."

# Ensure we have a way to kill all background processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# 1. Start API Service
echo "🔌 [API] Starting on port 3000..."
(cd api && npm run dev) &

# 2. Start Worker Service
echo "🤖 [WORKER] Starting video processor..."
(cd worker && npm run dev) &

# 3. Start Frontend
echo "🎨 [FRONTEND] Starting on port 3001..."
(cd frontend && npm run dev) &

echo "✅ [RUN] All services are running in background."
echo "📝 [LOGS] Combined logs will stream below. Press Ctrl+C to stop all."

# Wait for all background processes
wait
