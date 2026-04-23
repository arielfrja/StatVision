---
title: Backend Entry Point
tags: [backend, initialization, express]
sources: [backend/src/app.ts]
updated: 2026-04-22
---

# Backend Entry Point

The main entry point for the StatVision backend API.

## Responsibilities
- Initializes the **TypeORM** Data Source (`AppDataSource`).
- Sets up the **Express** application with middleware (CORS, JSON parsing, logging, error handling).
- Configures **Swagger** for API documentation (at `/api-docs`).
- Initializes the `AppContainer` for dependency injection.
- Configures and applies `authMiddleware` using **Auth0**.
- Starts background consumers (e.g., `VideoAnalysisResultService`).
- Mounts all major route modules.

## Key Dependencies
- `AppDataSource`: Database connection.
- `AppContainer`: Service locator.
- `authProvider`: Auth0 integration (`[[auth-strategy]]`).
- `VideoAnalysisResultService`: Results consumer.

## Initialization Flow
1. Load environment variables (`dotenv`).
2. Initialize Database (`AppDataSource`).
3. Create `AppContainer` instance.
4. Start background result consumers.
5. Apply Global Auth Middleware.
6. Register Routes.
7. Start Express Server.
