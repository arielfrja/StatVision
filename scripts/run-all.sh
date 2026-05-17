#!/bin/bash

# StatVision Master Run Script
# Runs all services concurrently for debugging and development.

echo "🚀 [RUN] Starting all StatVision services..."

# Set environment variables for local Pub/Sub emulator
export PUBSUB_EMULATOR_HOST=localhost:8085
export GCP_PROJECT_ID=statvision-local

# Ensure we have a way to kill all background processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# 0. Start Pub/Sub Emulator
echo "📡 [PUBSUB] Starting emulator..."
./scripts/start-pubsub-emulator.sh > /dev/null 2>&1 &

# 1. Initialize Pub/Sub (Wait for emulator in background)
(sleep 3 && ./scripts/init-pubsub.sh) &

# 2. Start API Service
echo "🔌 [API] Starting on port 3000..."
(cd api && npm run dev) &

# 3. Start Worker Service
echo "🤖 [WORKER] Starting video processor..."
(cd worker && npm run dev) &

# 4. Start Frontend
echo "🎨 [FRONTEND] Starting on port 3001..."
(cd frontend && npm run dev) &

echo "✅ [RUN] All services are running in background."
echo "📝 [LOGS] Combined logs will stream below. Press Ctrl+C to stop all."

# Wait for all background processes
wait
