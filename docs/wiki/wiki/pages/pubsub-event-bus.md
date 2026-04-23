---
title: PubSub Event Bus
tags: [infrastructure, pubsub, event-driven]
sources: [backend/src/worker/infrastructure/PubSubEventBus.ts]
updated: 2026-04-22
---

# PubSub Event Bus

The implementation of the `IEventBus` interface using **Google Cloud Pub/Sub**.

## Role
Enables decoupled communication between the Backend API and the Worker services. It allows the system to scale background processing independently of the main API.

## Core Topics
- `video-upload-events`: Triggered when a file is uploaded.
- `chunk-analysis`: Triggered for each segment needing AI analysis.
- `chunk-analysis-results`: Live stream of events for the UI.
- `video-analysis-results`: Final signal that a job is complete.

## Implementation Details
- **Publishing:** Sends JSON payloads to specific topics.
- **Subscribing:** Listens to subscriptions with automatic ack-deadline extension (heartbeat) to handle long-running tasks.
