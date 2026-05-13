# Cloud Staging/Test Environment Setup

This document outlines the remaining manual steps required to finalize the isolated Cloud Test environment for StatVision.

## 1. Backend Infrastructure (DONE)
I have already provisioned the isolated Pub/Sub infrastructure in GCP project `statsvision-477017`:
- **Topics**: `video-upload-events-test`, `chunk-analysis-test`, `video-analysis-results-test`.
- **Subscriptions**: `video-upload-events-sub-test`, `chunk-analysis-sub-test`, etc.

The GitHub Actions workflow (`deploy.yml`) is now configured to automatically deploy to `-test` services when pushing to the `test` branch.

## 2. GitHub Secrets (Action Required)
Please ensure the following secrets are set in your GitHub repository:
- `TEST_DATABASE_URL`: A dedicated PostgreSQL connection string for the test environment (e.g., a separate Supabase project or database).
- `GCP_SA_KEY`: (Existing) Service account with Cloud Run and Pub/Sub permissions.
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`: (Existing) For frontend deployment.

## 3. Vercel Configuration (DONE)
The frontend is configured on Vercel with the following variables for **Production** and **Preview**:
- `NEXT_PUBLIC_USE_MOCK_AUTH`: `false` (Enables real Auth0)
- `NEXT_PUBLIC_AUTH0_DOMAIN`: `dev-3os8m0zyfxmx60nn.us.auth0.com`
- `NEXT_PUBLIC_AUTH0_CLIENT_ID`: `EwznPDvrgImiuHRP45HbapAwGToc4tqM`
- `NEXT_PUBLIC_AUTH0_AUDIENCE`: `basetball-analyzer`
- `NEXT_PUBLIC_BASE_URL`: `https://frontend-arielfrja-2128-arielfrja-2128s-projects.vercel.app`

## 4. Auth0 Configuration (DONE)
The Auth0 application **statsVision** (`EwznPDvrgImiuHRP45HbapAwGToc4tqM`) is configured with the following URIs:
- **Allowed Callback URLs**: `http://localhost:3001, https://statsvision-477017.web.app, https://frontend-arielfrja-2128-arielfrja-2128s-projects.vercel.app`
- **Allowed Logout URLs**: `http://localhost:3001, https://statsvision-477017.web.app, https://frontend-arielfrja-2128-arielfrja-2128s-projects.vercel.app`
- **Allowed Origins**: `http://localhost:3001, https://statsvision-477017.web.app, https://frontend-arielfrja-2128-arielfrja-2128s-projects.vercel.app`

## 5. Verification Flow
1.  Push code changes to the `test` branch.
2.  GitHub Actions will deploy the `-test` API and Worker.
3.  Vercel will deploy a "Preview" version of the frontend.
## 6. Troubleshooting & Build Notes

### **Android/arm64 Build Compatibility**
When building the frontend in environments using `android/arm64` architecture (e.g., local development in Termux or specific ARM runners), Turbopack is currently not supported.
- **Issue:** `Error: Turbopack is not supported on this platform (android/arm64) because native bindings are not available.`
- **Solution:** The `scripts/build-all.sh` script is configured to use the `--webpack` flag for Next.js builds:
  ```bash
  cd frontend && npm run build -- --webpack
  ```
- **Action:** Ensure this flag remains in the master build scripts to maintain cross-platform build stability.
