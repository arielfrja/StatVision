# Job Log - StatVision

## [2026-05-13] Cloud Staging & CI/CD Stabilization
- **Infrastructure**: Provisioned isolated Cloud Staging environment in GCP (`statsvision-477017`) using `-test` suffix for Pub/Sub and services.
- **CI/CD**: Fixed `ci.yml` and `deploy.yml` for monorepo structure. Added `workflow_dispatch` for manual control.
- **Authentication**: Hardened cloud environments by disabling mock authentication (`USE_MOCK_AUTH=false`) in `deploy.yml` and Vercel settings.
- **Frontend Refactor**:
    - Implemented stateful mock authentication in `UserProviderWrapper` using `sessionStorage`, fixing the "logout does nothing" bug.
    - Resolved `useContext` and `useState` build-time errors by isolating client-side providers to mount-only execution, bypassing Next.js static prerendering for special pages (e.g., `_global-error`, `_not-found`).
- **Vercel & Auth0 Sync**:
    - Verified stable deployment alias: `https://frontend-arielfrja-2128-arielfrja-2128s-projects.vercel.app`.
    - Updated Auth0 "Allowed Callback URLs", "Logout URLs", and "Origins" via Auth0 CLI.
    - Synced all `NEXT_PUBLIC_AUTH0_*` and `NEXT_PUBLIC_BASE_URL` variables across Vercel Production and Preview environments.
- **Project Mandate**: Formalized "Test-First Alpha Workflow" in `GEMINI.md`, prioritizing the `test` branch for all active development and deployments.
- **Monorepo**: Successfully stabilized `@statvision/common` as the backend source of truth.
- **Frontend**: Achieved 100% green CI run by resolving 20+ TypeScript and Linting errors (conditional hooks, type mismatches, build-time auth hydration).
- **Permissions**: Fixed GCP service account permissions for Artifact Registry and Cloud Run.
- **Deployment**: Verified successful Docker build and push logic after resolving IAM permission gaps.
- **Build Optimization**: Resolved `android/arm64` build failure in `test` branch by forcing Webpack (`--webpack`) in `scripts/build-all.sh`, bypassing Turbopack incompatibilities.
- **Staging Verification**: Successfully deployed `test` branch to Vercel and Cloud Run; verified end-to-end connectivity.


## [2026-05-08] Sprint 1 Planning | Code Consolidation & Strategic Foundation
- **Attendees:** PO, SM, Dev Team, DevOps.
- **Decision:** Consolidate duplicated services (`TeamService`, `PlayerService`, `GameStatsService`) from `api` and `worker` into `common` to eliminate technical debt.
- **Decision:** Standardize the Gemini Analysis providers to use a single, shared infrastructure abstraction.
- **Sprint Goal:** Establish a clean, shared service layer and prepare for Multi-Tenancy / Temporal Roster implementation.
- **Status:** Sprint Completed. Logic consolidated into `@statvision/common`. Backend builds passing.
