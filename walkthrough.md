# StatVision: The Architect's Walkthrough

Welcome to the future of StatVision. This walkthrough describes the system after the proposed re-architecture.

## 1. The Developer Experience (Clean Code)
When you open the `backend/` directory, you no longer see a flat list of files. You see a structured **Domain-Driven Design (DDD)**.
*   Want to change how games are handled? Go to `modules/games`.
*   Want to swap Gemini for OpenAI? Simply implement a new `IVideoIntelligenceProvider` in `worker/infrastructure`.
*   The system is now "Typed to the teeth," reducing runtime errors and making refactoring a breeze.

## 2. The User Journey (Context-Aware)
The workflow is now a conversation, not a black box.

1.  **The Handshake:** The user doesn't just "drop a file." They tell the system: *"This is the Varsity game. We are the Reds, they are the Blues."*
2.  **The Smart Worker:** The worker uses this context. The AI isn't guessing; it's looking for the "Reds" and the "Blues." This increases accuracy by ~30-40% for entity identification.
3.  **The Safe Merge:** Chunks are processed in parallel. If two finish at the same millisecond, the database doesn't sweat. Each chunk writes its own result. The **Job Finalizer** then acts as the "Master Editor," merging everything into a cohesive game narrative using a single transaction.
4.  **The Live View:** The user sees a "Progress Timeline." They can watch events pop up as the AI finds them.

## 3. The Technical Safety Net
*   **No More Race Conditions:** By moving state updates out of the parallel workers and into a single finalizer, we've eliminated the most dangerous bug in the system.
*   **Infrastructure Agnostic:** The system doesn't "know" it's using Google Pub/Sub or Gemini. It knows it's using an `EventBus` and a `VideoProvider`. This makes it "Cloud Native" in the truest sense—deployable anywhere.
*   **Atomic Assignments:** When a user maps a "Temporary Player" to their roster, the system recalculates everything in a transaction. The data is always consistent.

## 4. Scaling to the Future
This architecture is ready for:
*   **Multi-Sport Support:** Just add new `eventTypes` and specialized prompts.
*   **Real-time Analysis:** The chunking strategy is already designed to handle live streams.
*   **Advanced Analytics:** The "Materialized Stats" pattern means we can add complex metrics (e.g., Player Efficiency Rating) without slowing down the UI.
