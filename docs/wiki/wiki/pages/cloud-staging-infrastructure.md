---
title: Cloud Staging Infrastructure
tags: [infrastructure, devops, cloud, staging]
sources: [STAGING_SETUP.md, deploy.yml]
updated: 2026-05-13
---

# Cloud Staging Infrastructure

The StatVision platform utilizes a strictly isolated staging environment to verify features before they reach production.

## Isolation Strategy: The `-test` Suffix
Every cloud resource for staging is identified by a `-test` suffix. This ensures that testing activities never collide with production data or event streams.

### 1. Pub/Sub Isolation
Staging uses independent topics and subscriptions:
- **Topics:**
  - `video-upload-events-test`
  - `chunk-analysis-test`
  - `video-analysis-results-test`
- **Subscriptions:**
  - `video-upload-events-sub-test`
  - `chunk-analysis-sub-test`
  - `video-analysis-results-sub-test`

### 2. Compute Isolation (Cloud Run)
The services are deployed with separate identities:
- `statvision-api-test`
- `statvision-worker-test`
- **Cost Control:** Staging instances are limited to `MAX_INSTANCES=1` to minimize costs for single-tester verification.

### 3. Frontend Isolation (Vercel)
The `test` branch in GitHub triggers a **Vercel Preview Deployment**.
- The preview environment is configured with `NEXT_PUBLIC_API_BASE_URL` pointing to the `-test` Cloud Run API.

## Deployment Pipeline
The environment is synchronized via GitHub Actions (`deploy.yml`):
1. **Push to `test` branch**: Triggers the staging pipeline.
2. **Environment Injection**: The workflow detects the branch and automatically injects `ENV_SUFFIX=-test` and `DATABASE_URL=${{ secrets.TEST_DATABASE_URL }}`.
3. **Artifact Registry**: Images are tagged with the commit SHA and pushed to the unified `statvision-repo`.

## Local Development vs. Staging
While local development often uses the `[[local-event-emitter-bus]]` for speed, the Staging environment is the authoritative source for verifying real Pub/Sub latency and AI analysis accuracy.
