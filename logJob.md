# Project Log - StatVision

This document logs the key actions and decisions made during the development of the StatVision project.

## Initial Setup & Project Understanding
- Reviewed project documentation: SAD.md, SDD.md, SRS.md, mvp_technical_task_breakdown.md, use_case_doc.md.
- Established project context and requirements.

## Firebase Initialization
- Initialized Firebase Storage to create `firebase.json` and set up basic Firebase project structure.

## Database Setup (PostgreSQL & ORM)
- Discussed ORM options (Prisma vs. TypeORM).
- Chose TypeORM due to better compatibility with Termux environment after encountering issues with Prisma's schema engine.
- Installed TypeORM and `pg` driver.
- Created TypeORM entities (`User.ts`, `Team.ts`, `Player.ts`, `Game.ts`, `GameEvent.ts`) based on `SDD.md`.
- Configured `ormconfig.json` and `tsconfig.json` for TypeORM.
- Successfully initialized TypeORM and synchronized the database schema, creating all necessary tables in the local PostgreSQL instance.

## Documentation Updates (Free/Low-Budget Tools & MVP Video Handling)
- Modified `SAD.md`, `SDD.md`, and `SRS.md` to:
    - Emphasize the use of free and low-budget tools/tiers (e.g., Firebase Auth, GCS, Pub/Sub, Cloud Run, PostgreSQL alternatives, Gemini AI).
    - Reflect a new MVP approach for video handling: temporary storage on the API Service, processing by the Worker Service, and deletion after analysis (instead of persistent GCS storage).

## User Authentication (MVP Rescoping)
- Discussed Firebase Functions for user record creation in PostgreSQL and identified limitations on the Firebase Spark plan (no outbound network requests).
- Rescoped **[BE-102]** to implement client-side synchronization: the frontend will call an API endpoint to create the user record in PostgreSQL after Firebase registration.
- Updated `mvp_technical_task_breakdown.md`, `SRS.md`, and `SDD.md` to reflect this change.
- Removed Firebase Functions related code and configuration (`backend/functions` directory and `functions` entry from `firebase.json`).

## Next Steps
- Proposed next sprint focusing on completing user authentication backend and core data management backend (Teams & Players).