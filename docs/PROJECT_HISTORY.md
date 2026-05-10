# StatVision: Master Project History

This document provides a chronological record of every major step, decision, and milestone in the development of StatVision. It serves as the authoritative audit trail for the project.

---

## 🟢 PHASE 0: Genesis & Foundation
### **Initial Setup & Core Architecture**
- **Project Initiation:** Reviewed and established base requirements via `SRS`, `SAD`, and `SDD`.
- **Firebase Integration:** Initialized Firebase project for Hosting and basic service configuration.
- **Database Strategy:** 
    - Evaluated Prisma vs. TypeORM.
    - **Decision:** Selected **TypeORM** for superior compatibility with the Termux development environment.
    - **Action:** Created core entities: `User`, `Team`, `Player`, `Game`, `GameEvent`.
- **Infrastructure Rescoping:**
    - **Decision:** Shifted to "Low-Budget/Free-Tier" focus.
    - **Action:** Moved from persistent GCS storage for all videos to temporary local storage with worker processing and immediate deletion to minimize costs.
- **Authentication Strategy:**
    - **Decision:** Rescoped user creation to client-side synchronization after identifying Firebase Spark plan limitations (no outbound network requests from Functions).

---

## 🔵 PHASE 1: Backend Professionalization & LIVE Readiness
### **Milestone: Technical Excellence (2026-03-02)**
- **Testing Infrastructure:** 
    - Implemented Jest for backend and Vitest/React Testing Library for frontend.
    - Added comprehensive smoke tests for core components.
- **CI/CD Pipeline:**
    - Developed GitHub Actions (`deploy.yml`) for automated deployment.
    - **Targets:** Firebase Hosting (Frontend) and Google Cloud Run (Backend API + Worker).
- **Production Environment:**
    - Migrated to production project `statsvision-477017`.
    - Linked **Supabase** as the managed PostgreSQL provider.
    - Secured identity layer via **Auth0** URL whitelisting.
- **Auth Debugging (Critical Fix):**
    - **Issue:** 401 Unauthorized errors despite valid tokens.
    - **Root Cause:** Misconfiguration of `express-jwt` payload mapping (expected `req.auth.payload`, actual `req.auth`).
    - **Resolution:** Corrected global type definitions and provider logic to ensure seamless user synchronization.

---

## 🟡 PHASE 2: Workflow Refinement & Intelligent Analysis
### **Architectural Shift: "Blind" to "Context-Aware"**
- **Workflow Critique:** Identified critical risks in the prototype, including race conditions during parallel processing and high manual effort for users.
- **Refinement Strategy:**
    - **Metadata Injection:** Proposed injecting team/player context into Gemini prompts *before* analysis to reduce guessing.
    - **Chunk-Result Persistence:** Redesigned the worker to write to temporary chunk tables instead of the main Job record to eliminate race conditions.
    - **Live Streaming:** Proposed a "Draft" event state so users can see results as they happen.

---

## 🔴 PHASE 3: Great Consolidation (Current)
### **Milestone: Making Order (2026-05-08)**
- **Codebase Reorganization:**
    - **Issue:** Massive logic duplication between `api` and `worker` packages.
    - **Action:** Created `@statvision/common` library.
    - **Consolidation:** Moved all Repositories and Services (Team, Player, Game, Stats) into the shared library.
- **AI Infrastructure Standard:**
    - **Action:** Merged three separate Gemini provider implementations into a single authoritative `GeminiProvider` in common infrastructure.
    - **Enhancement:** Multi-turn chat sessions established as the default analysis pattern.
- **Documentation Overhaul:**
    - **Action:** Cleared 21+ files from the root.
    - **Action:** Established a structured `docs/` hierarchy (Product, Technical, Archive).
    - **Action:** Created the business-centric **STRATEGY.md** based on senior PM feedback.

---

## 🚀 CONTINUOUS LEDGER
*For day-to-day updates and active sprint progress, refer to the root [jobLog.md](../jobLog.md).*
