# StatVision Architectural Re-Design Plan (Updated)

## 1. Architectural Vision
Transform StatVision into a **Modular Monolith** with a **Context-Aware Processing Engine**. The architecture focuses on domain boundaries, data integrity, and leveraging advanced Gemini API capabilities for high-precision basketball analytics.

## 2. Core Architectural Pillars

### A. Domain-Driven Directory Structure (Layered Architecture)
Organize code into logical modules to reduce cognitive load and improve maintainability.
```
backend/src/
├── core/               # Shared logic, entities, and interfaces
│   ├── entities/       # TypeORM Entities (User, Game, etc.)
│   ├── interfaces/     # Shared contracts
│   └── errors/         # Custom application errors
├── modules/            # Domain-specific modules
│   ├── auth/           # Authentication logic & routes
│   ├── games/          # Game management, stats, and assignments
│   ├── players/        # Player management
│   └── teams/          # Team management
├── worker/             # The Processing Engine (Worker)
│   ├── domain/         # Worker-specific logic (Chunking, Analysis)
│   ├── infrastructure/ # External integrations (Gemini, FFmpeg, PubSub)
│   └── handlers/       # Message handlers
└── shared/             # Utils, logging, configuration
```

### B. Context-Aware AI Pipeline (Gemini Optimization)
*   **Structured Output:** Fully transition to `responseMimeType: "application/json"` with the `EVENT_SCHEMA` to eliminate parsing errors and ensure type safety.
*   **Metadata Injection:** Implement Phase 0 (Metadata Setup) where users define team colors and key player numbers *before* analysis. This data is injected into the `BASE_PROMPT`.
*   **Multimodal Grounding:** Update prompts to specifically instruct the model to use audio cues (whistles, rim sounds) for event verification.
*   **Authoritative Windowing:** Implement a robust deduplication strategy in the `JobFinalizer` to handle overlapping video chunks without event duplication or loss.

### C. Data Integrity & Resilience
*   **Transactional Merging:** Use TypeORM transactions to merge chunk results, ensuring the database never stays in a partial "half-merged" state.
*   **Infrastructure Abstraction:** Use `IVideoIntelligenceProvider` to decouple from the SDK, allowing for easier testing and future model swaps.

### D. Frontend: Timeline-First UX
*   **Verification Workflow:** Shift from a modal-based assignment to a visual timeline where users verify AI-identified events against the video.
*   **Real-time Feedback:** Use the chunking status to provide a "live stream" feel as analysis progresses.

## 3. Technology Stack Updates
*   **Backend:** Node.js/Express, TypeORM (PostgreSQL).
*   **AI:** Gemini 1.5 Pro/Flash (via `@google/genai`).
*   **Frontend:** Next.js 15, React 19, Material 3.
