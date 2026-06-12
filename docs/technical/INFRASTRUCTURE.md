# StatVision - Technical Brief for Deployment & Infrastructure Architecture

## 1. Executive Summary
StatVision is an AI-powered basketball analytics platform built on a **fully production-scaled, reactive serverless architecture**. The system is designed for high-precision processing and extreme cost-efficiency, utilizing "Scale-to-Zero" principles to ensure idle costs remain near zero.

## 2. Current System Architecture
- **Frontend:** Next.js 15 (React) deployed to **Vercel** / **Firebase Hosting**.
- **Backend API:** Node.js/Express (Stateless) on **Google Cloud Run**. Scales to 0 when idle.
- **Processing Worker:** Decoupled Node.js service on **Google Cloud Run**. Triggered by **Cloud Tasks**.
- **Messaging:** **GCP Pub/Sub (PUSH)**. Uses OIDC-secured webhooks for inter-service communication.
- **Real-time Sync:** **Firebase Realtime Database**. Replaces WebSockets for live status propagation.
- **AI Core:** **Google Gemini 3 Flash** for high-speed video analysis.
- **Database:** **PostgreSQL** (Supabase/Managed).
- **CI/CD:** **GitHub Actions** with automated Artifact Registry pruning (Keep-5 images).


## 3. The Requirement: Test Environment
We need to implement a deployment path for the `test` branch with the following constraints:
1. **Database Isolation:** Must use a separate "Test" database schema/instance to prevent data contamination.
2. **Cost-Effective Scaling:** The test environment is for a single tester. It should be "non-scalable" (e.g., restricted to 1 instance) to minimize Cloud Run costs.
3. **Infrastructure as Code (IaC):** Recommendation on whether to manage these extra services via GitHub Actions logic (dynamic naming) or a dedicated IaC tool (Terraform/Pulumi).
4. **Environment Parity:** The test environment must mirror the production flow (Pub/Sub, Worker, AI API) but stay strictly isolated.

## 4. Specific Technical Questions for the Expert
### 4.1 Deployment Strategy
- **Dynamic Naming vs. Static Services:** Should we use the existing `.github/workflows/deploy.yml` with dynamic suffixes (e.g., `api-test`) or maintain separate workflow files for each environment?
- **Firebase Channels:** Is it better to use Firebase Hosting **Preview Channels** for the `test` branch, or a completely separate Firebase Project?

### 4.2 Resource Management
- **Cloud Run Configuration:** How can we best enforce a "single-user" resource limit on Cloud Run (CPU, RAM, max-instances) specifically for the test environment without affecting production?
- **Pub/Sub Isolation:** Should the test environment share the same Pub/Sub topics but use different subscriptions, or should it have entirely separate `test-video-upload-events` topics?

### 4.3 Persistence Layer
- **Migration Management:** How should we handle database migrations (TypeORM) across production and test environments to ensure the test DB is always in sync with the `test` branch code?

## 5. Current Implementation Draft
The current plan is to modify the GitHub Actions workflow to detect the branch and inject:
- `TEST_DATABASE_URL`
- `--max-instances 1` for Cloud Run.
- Service names suffixed with `-test`.

**Is this the industry-standard approach for a small-scale MVP, or is there a more robust "Cloud-Native" way to achieve this isolation?**
