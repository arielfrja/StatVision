# StatVision Infrastructure Status

## 🟢 Production-Scale Architecture (Alpha)
The system has been migrated to a fully serverless, reactive architecture to optimize for cost and scalability.

### **Compute & Scaling**
- **API Service:** Google Cloud Run (`statvision-api-test`)
  - **Scaling:** 0 to 20 instances.
  - **CPU Allocation:** Only during request processing.
  - **Status:** 🟢 Healthy
- **Worker Service:** Google Cloud Run (`statvision-worker-test`)
  - **Scaling:** 1 to 20 instances (Min 1 to ensure immediate background processing for Alpha).
  - **Status:** 🟢 Healthy

### **Persistence & State**
- **Primary Database:** Supabase PostgreSQL (Managed)
- **Real-time Sync:** **Firebase Realtime Database** (`statsvision-477017-default-rtdb`)
  - **Purpose:** Replaced WebSockets for live job progress updates.
  - **Endpoint:** `https://statsvision-477017-default-rtdb.firebaseio.com`
- **Artifact Storage:** Google Cloud Storage (`statvision-uploads-test`)
  - **Lifecycle Policy:** (Recommended) Auto-delete `chunks/` after 24 hours.

### **Messaging & Integration**
- **Control Plane:** Google Cloud Pub/Sub
  - **Mode:** **PUSH (Webhooks)** for API results and progress.
  - **Security:** OIDC Identity verification for all webhooks.
- **Task Queue:** Google Cloud Tasks
  - **Purpose:** Orchestrates worker jobs with rate limiting and retries.

### **Security**
- **Auth Provider:** Auth0 (JWT Validation)
- **Service-to-Service:** Google OIDC tokens for internal communication.

---
*Last Updated: 2026-06-11 by Gemini CLI*
