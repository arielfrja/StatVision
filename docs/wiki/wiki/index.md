# Wiki Index — StatVision

### Modules
- [[backend-entry-point]]: Main API initialization and configuration.
- [[app-container]]: Service locator and dependency injection central.
- [[video-orchestrator-service]]: Video chunking and pipeline orchestration.
- [[chunk-processor-worker]]: Execution engine for AI analysis.
- [[gemini-analysis-service]]: Google Gemini API wrapper.
- [[event-processor-service]]: AI result normalization and deduplication.
- [[job-finalizer-service]]: Worker result aggregation and persistence.
- [[video-analysis-result-service]]: Backend consumer for analysis results.
- [[game-stats-service]]: Box score and metrics calculation.
- [[video-chunker-service]]: FFmpeg-based video manipulation.
- [[pubsub-event-bus]]: Google Cloud Pub/Sub implementation.

### APIs
- [[game-routes]]: REST endpoints for game and video management.

### Entities
- [[game-entity]]: Core game record and metadata.
- [[game-event-entity]]: Action-level game data.
- [[video-analysis-job-entity]]: Processing pipeline state.

### Concepts
- [[video-processing-pipeline]]: End-to-end data flow.
- [[authoritative-window-deduplication]]: Overlap handling algorithm.
- [[ai-analysis-strategy]]: Multimodal grounding and metadata injection.
- [[timeline-first-ux]]: Visual verification and real-time feedback.
- [[data-model-principles]]: Materialized stats and statistical flexibility.

### Decisions
- [[statistical-flexibility-constraint]]: Graceful handling of sparse data.
- [[auth0-strategy]]: Managed identity and authentication.

### Strategic
- [[strategic-roadmap]]: Long-term vision and future features.
