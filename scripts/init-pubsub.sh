#!/bin/bash

# Initialize Pub/Sub topics and subscriptions in the emulator
# This script should be run AFTER the emulator has started.

echo "🏗️ [PUBSUB] Initializing topics and subscriptions..."

# Set emulator host if not already set
export PUBSUB_EMULATOR_HOST=${PUBSUB_EMULATOR_HOST:-localhost:8085}
export GCP_PROJECT_ID=${GCP_PROJECT_ID:-statvision-local}

# Wait a bit for emulator to be ready
sleep 2

# Run the initialization script from the worker directory
(cd worker && npm run init-pubsub)

echo "✅ [PUBSUB] Initialization complete."
