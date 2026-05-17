#!/bin/bash

# Start the Google Cloud Pub/Sub emulator
# Default port is 8085

echo "📡 [PUBSUB] Starting Google Cloud Pub/Sub Emulator..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ [PUBSUB] Error: gcloud CLI is not installed."
    exit 1
fi

# Start the emulator
# We use --host-port=0.0.0.0:8085 to allow connections from other containers/processes
gcloud beta emulators pubsub start --host-port=0.0.0.0:8085
