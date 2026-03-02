# StatVision Re-Architecture Task List

## Phase 1: Foundation & Backend Restructuring
- [x] **T-101: Domain-Driven Directory Setup**
- [x] **T-102: Dependency Injection & Containerization**
- [x] **T-103: Robust Error Handling & Middleware**

## Phase 2: Worker Resilience & Data Integrity
- [x] **T-201: Atomic Chunk Results**
- [x] **T-202: Transactional Job Finalizer & Authoritative Window Deduplication**
- [x] **T-203: Infrastructure Abstractions (IEventBus, GeminiProvider)**

## Phase 3: Workflow Enhancements (Context-Aware)
- [x] **T-301: Game Metadata Expansion (gameType, identityMode, ruleset)**
- [x] **T-302: Multi-Prompt Strategy (3x3, Streetball, Interaction-based clustering)**
- [x] **T-303: Frontend Setup Wizard (Multi-step upload with format selection)**

## Phase 4: Frontend Modernization & Correction Tools
- [x] **T-401: API Client Optimization (Central Axios, SWR)**
- [x] **T-402: Timeline Review UI & Granular Event Editing**
- [x] **T-403: Manual Correction Tools (Switch Team, Assignment Confidence Display)**

## Phase 5: Next-Gen Processing (Gemini 3 Chat Mode)
- [x] **T-501: Gemini 3 Integration**
    - Update worker to use `gemini-3-flash-preview`.
    - Implement stateful `chatHistory` persistence in `VideoAnalysisJob`.
- [x] **T-502: Chat-Based Sequential Analysis**
- [x] **T-503: Externalized Markdown Prompts**
    - Move all prompts to `.md` files in `worker/prompts/`.
    - Implement `PromptLoader` utility for dynamic variable injection.
    - Support ruleset-specific sub-prompts via custom tags.

    - Refactor `GeminiProvider` to use multi-turn chat sessions instead of stateless calls.
    - Revert to 2-minute (120s) chunks for high-granularity analysis.
    - Implement `systemInstruction` for consistent model persona.

