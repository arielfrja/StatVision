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

## Backend Enhancements
- Implemented centralized logging for backend services using Winston, capturing request/response details and errors.
- Refactored `app.ts` into modular route files (`authRoutes.ts`, `teamRoutes.ts`, `playerRoutes.ts`) to improve maintainability and organization.

## Authentication Debugging and Resolution
- **Issue:** Persistent 401 Unauthorized errors and users not being added to the database despite successful Auth0 login.
- **Root Cause:** A misunderstanding of how the `express-jwt` middleware populates the `req` object. It was assumed the decoded JWT payload would be nested under `req.auth.payload`, but `express-jwt` places it directly onto `req.auth`.
- **Impact:** `req.user` was not being populated, leading to authentication middleware failures, 401 errors, and skipped user creation logic.
- **Resolution:**
    1.  Corrected TypeScript `declare global` type definitions in `backend/src/auth/auth0Provider.ts`, `backend/src/middleware/authMiddleware.ts`, and `backend/src/app.ts` to reflect `req.auth` directly containing the JWT payload properties (`sub`, `email`).
    2.  Modified `backend/src/auth/auth0Provider.ts` to access JWT claims directly from `req.auth` (e.g., `req.auth.sub`, `req.auth.email`).
    3.  Ensured all frontend `axios` calls in `frontend/src/app/teams/page.tsx` correctly included the `Authorization: Bearer <token>` header.
    4.  Made the `email` column in `backend/src/User.ts` nullable and updated its TypeScript type to `string | null` to handle cases where Auth0 might not provide an email claim.

This resolution ensures that the backend correctly processes authenticated requests and creates user records in the database upon their first interaction with a protected endpoint. For a more detailed explanation of the mistake, refer to `debugging_auth_issues.md`.