# StatVision - DevOps & Infrastructure Consultation Brief

## 1. Project Context
**StatVision** is an AI-driven basketball analytics platform. It uses a decoupled architecture to process high-resolution video through Google Gemini. We have recently migrated to a monorepo structure with standalone services for the API and Worker.

## 2. Current "Production" Stack
*   **Monorepo Structure:**
    *   `api/`: Node.js/Express.
    *   `worker/`: Node.js/FFmpeg/Gemini.
    *   `common/`: Shared TypeORM entities and migrations.
*   **Infrastructure:**
    *   **Frontend:** Next.js 15, deployed to **Firebase Hosting**.
    *   **Backend Services:** Deployed as independent containers to **Google Cloud Run**.
    *   **Database:** PostgreSQL (Managed on **Supabase**).
    *   **Messaging:** **GCP Pub/Sub** for service decoupling.
*   **Automation:** **GitHub Actions** (`deploy.yml`) handles the build and deployment of all three components.

## 3. The Requirement: "Test" Environment
We have implemented a `test` branch. Merging to this branch triggers a **Test Environment** deployment with these constraints:
1.  **Strict Isolation:** Uses a separate database (`TEST_DATABASE_URL`).
2.  **Service Naming:** Services and Pub/Sub topics are suffixed with `-test` (e.g., `statvision-api-test`).
3.  **Cost Efficiency:** Limited to **1 instance** on Cloud Run to prevent scaling costs.
4.  **Parity:** Must maintain full functional parity with the production pipeline.

## 4. Key Questions for the Consultant
1.  **Environment Isolation:** Is name-prefixing within a single GCP project sufficient for an MVP, or should we move to separate projects for Prod and Test?
2.  **Pub/Sub Strategy:** Currently, we use dynamic topic names. Is there a better pattern for handling multi-environment event routing?
3.  **Secret Management:** We currently inject secrets via GitHub Actions. Should we migrate to GCP Secret Manager?
4.  **Database Migrations:** What is the best practice for running TypeORM migrations against the Test vs. Prod database during the CI/CD pipeline?

## 5. Deployment Workflow
The logic for branch detection and environment variable injection is located in `.github/workflows/deploy.yml`.
