---
title: App Container
tags: [backend, dependency-injection, service-locator]
sources: [backend/src/shared/AppContainer.ts]
updated: 2026-04-22
---

# App Container

A singleton service locator that manages the instantiation and lifecycle of all repositories and services.

## Role
StatVision uses a manual Dependency Injection (DI) pattern via this container. It ensures that services are initialized with their required dependencies (repositories, other services, loggers).

## Registered Components
- **Infrastructure:** `PubSubEventBus` (`[[event-driven-architecture]]`).
- **Repositories:** `UserRepository`, `TeamRepository`, `PlayerRepository`, `GameRepository`, etc.
- **Services:** `TeamService`, `GameService`, `GameStatsService`, `VideoAnalysisResultService`.
- **Worker Services:** `VideoOrchestratorService`, `ChunkProcessorWorker`, `JobFinalizerService`.

## Usage
Services are retrieved using the `get<T>(identifier)` method:
```typescript
const gameService = container.get(GameService);
```
