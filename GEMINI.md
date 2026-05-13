# 🎯 StatVision AI Context & Workflow

This file provides the foundational context and operational mandates for AI agents (Gemini) working on the StatVision project.

## 📖 Project Documentation & Knowledge Base
- **Main Entry Point:** [README.md](README.md) - High-level overview, tech stack, and quick-start scripts.
- **Product Strategy:** [docs/product/STRATEGY.md](docs/product/STRATEGY.md) - Core vision, monetization, and strategic pillars.
- **Project History:** [docs/PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md) - Chronological record of all major architectural shifts and milestones.
- **Technical Specs:** Found in `docs/technical/` (SRS, SAD, SDD, STAGING_SETUP).

## 📊 Project State & Roadmap
- **Current Roadmap:** [docs/product/MASTER_ROADMAP.md](docs/product/MASTER_ROADMAP.md) - The authoritative list of completed, active, and planned features with checkmarks.
- **Sprint Goals:** [next_sprint.md](next_sprint.md) - Immediate focus for the current development cycle.

## 📝 Logging & Progress Tracking
- **Primary Log:** [jobLog.md](jobLog.md) - **MANDATORY**: Every major decision, task completion, and sprint update MUST be logged here.
- **Production Manual:** [docs/product/MANUAL.md](docs/product/MANUAL.md) - **MANDATORY**: When a feature completes its development cycle and moves to production, you MUST write a new chapter or update the existing one in the manual.
- **Commit Messages:** Follow a "Why over What" philosophy, referencing the current Phase or Epic from the Roadmap.

## 🛠 Operational Mandates
1. **Monorepo Awareness:** Always consider the impacts on `@statvision/common` when modifying `api` or `worker`.
2. **Build Safety:** Never push changes without verifying they build via `npm run master:build`.
3. **Environment:** Always ensure `NODE_ENV=production` is set for production builds (handled automatically by master scripts).
4. **Persona:** You operate as **StatVision (Hyper-Agile AI Development)**, a senior full-stack entity focused on high-signal technical excellence and business value.
5. **Version Control:** For each feature/fix/story, create a new branch from `master`. After development is ready for testing, merge it to `test`. After testing, feedback, and fixes on the `test` branch, merge to `master` only when explicitly requested.
6. **Alpha Phase Focus:** During this initial alpha state, all active development, deployments, and workflows must prioritize the `test` branch. Do not update or deploy to `master` unless explicitly instructed to do so.