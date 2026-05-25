# StatVision Master Roadmap

This document tracks the high-level progress of the StatVision platform. It combines historical achievements with the current strategic vision from Product Management.

---

## 🏗️ Phase 1: Foundation & Backend Restructuring
- [x] **Domain-Driven Directory Setup:** Organized the monolith into structured domains.
- [x] **Dependency Injection & Containerization:** Implemented `AppContainer` and Docker readiness.
- [x] **Robust Error Handling:** Global middleware and standardized error types.
- [x] **Monorepo Consolidation:** Established `@statvision/common` library for shared logic between API and Worker.

## 🤖 Phase 2: AI Intelligence & Worker Resilience
- [x] **Gemini 3 Integration:** Switched to `gemini-2.5-flash` for faster, more accurate analysis.
- [x] **Chat-Based Sequential Analysis:** Implemented stateful chat sessions to maintain context across video chunks.
- [x] **Atomic Chunk Results:** Moved results to temporary tables to prevent race conditions.
- [x] **Authoritative Deduplication:** Transactional logic to ensure no duplicate events during chunk merging.
- [x] **Prompt Externalization:** Moved AI instructions to markdown files for easier iteration.
## 🎨 Phase 3: Workflow & User Experience
- [x] **Context-Aware Analysis:** Support for `gameType`, `identityMode`, and `ruleset` metadata.
- [x] **Setup Wizard:** Multi-step upload process with pre-analysis metadata injection.
- [x] **Modernized API Client:** Transitioned to SWR and centralized Axios configuration.
- [x] **Manual Correction Tools:** Built the basic "Switch Team" and "Entity Assignment" interfaces.
- [x] **Functional Minimalism (Pivot):** Superseded "Night Stadium" aesthetic with a minimalist utility design focused on high-contrast analytics and reduced cognitive load.

## 🛡️ Phase 4: Enterprise Readiness
- [x] **Infrastructure Stabilization:** Automated CI/CD with 100% green builds and isolated Cloud Staging targets.
- [x] **Minimalist Utility Transition:** Completed the sweep of global themes and core components to deliver a professional coaching tool experience.
- [x] **Full-Stack Observability:** Centralized client logging and unique error trace correlation (errorId).
- [ ] **Multi-Tenancy & Secure Workspaces:** Implement organizational data isolation and sub-accounts.
- [ ] **Temporal Roster Management:** Develop the history tracking system for player jersey numbers and tenures.
- [ ] **Advanced Audit Logging:** Track all human corrections for AI feedback loops.

---

## 📊 Phase 5: Professional Analysis (COMPLETED)
- [x] **Advanced Analytics Dashboard:** eFG%, TS%, and advanced efficiency metrics integrated into Box Score.
- [x] **Interactive Timeline Editor:** Frame-perfect video syncing for event verification.
- [x] **Olympic-Level Intelligence:** Overhauled AI prompts to filter replays and use professional taxonomy.
- [ ] **Automated Highlight Generator:** AI-powered "mixtape" creation from event timestamps.

## 📈 Phase 6: Expansion & Monetization (FUTURE)
- [ ] **Usage-Based Tiering:** Implement Free/Pro/Org subscription logic.
- [ ] **"Park Legends" Leaderboard:** Community-wide stats and ELO-based rankings.
- [ ] **Recruitment Marketplace:** Secure data sharing with scouts and coaches.

---
*Last Updated: 2026-05-25*
