---
title: Game Routes
tags: [backend, routes, api]
sources: [backend/src/routes/gameRoutes.ts]
updated: 2026-04-22
---

# Game Routes

Defines the RESTful API endpoints for managing games and triggering video analysis.

## Key Endpoints
- `GET /games`: List all games for the authenticated user.
- `POST /games`: Create a new game record (pre-upload).
- `GET /games/:gameId`: Retrieve full game details, events, and stats.
- `POST /games/upload`: Handle video file upload (via `multer`).
- `POST /games/:gameId/assignment`: Map AI-identified temp entities to official ones.
- `POST /games/:gameId/retry`: Re-queue a failed analysis job.

## Integration
- **Multer:** Handles file uploads to the local filesystem.
- **PubSub:** Publishes to `video-upload-events` topic after a successful upload.
- **Auth:** Protected by `authMiddleware` (Auth0).
