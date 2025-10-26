# Debugging Authentication Issues: Firebase to Auth0 Migration

This document summarizes the persistent authentication token verification issues encountered and the troubleshooting steps undertaken, including the migration from Firebase to Auth0.

## The Core Problem:

The backend API is consistently rejecting authenticated requests with either an "Unauthorized: Invalid token" or a "signature verification failed" error. This indicates that the JWT (JSON Web Token) sent from the frontend is not being successfully validated by the backend's authentication middleware.

## Solutions Already Attempted:

### 1. Initial Firebase Setup & Debugging:

*   **Problem:** The backend was rejecting Firebase ID tokens with `FirebaseAuthError: Firebase ID token has invalid signature.`
*   **Attempts:
    *   Ensured `serviceAccountKey.json` was correctly placed in the `backend` directory.
    *   Updated the path to `serviceAccountKey.json` in `backend/src/app.ts`.
    *   Generated multiple fresh `serviceAccountKey.json` files from the Firebase console.
    *   Generated multiple fresh Firebase ID tokens from the frontend.
    *   Corrected the `iss` (issuer) claim mismatch by simplifying `frontend-test/src/firebase-config.js` to only export the config object.
    *   Added extensive logging to the Firebase `authMiddleware` in `backend/src/app.ts` to inspect token details and verification errors.
    *   Temporarily bypassed token verification in `authMiddleware` to confirm routes were otherwise accessible (they were, but then failed on "User not found in database" as expected).
    *   Verified system time in Termux (`date` command) to rule out time skew.
    *   Verified network connectivity from Termux to Google's Firebase public key servers (`curl -v https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`).

### 2. Switch to Auth0 (Generic/Modular Approach):

*   **Reason for Change:** The persistent "invalid signature" error with Firebase, despite extensive debugging, led to the decision to switch to Auth0, hoping a different provider might bypass an environmental or subtle configuration issue. The goal was also to implement a more generic and modular authentication system.

*   **Backend Changes Implemented:
    *   Installed Auth0 JWT verification libraries (`express-oauth2-jwt-bearer`, `jwks-rsa`).
    *   Removed Firebase Admin SDK imports and initialization from `backend/src/app.ts`.
    *   Updated the `User` entity in `backend/src/User.ts` to use `providerUid` instead of `firebaseUid`.
    *   Created a generic `IAuthProvider` interface (`backend/src/auth/authProvider.ts`) and an `Auth0Provider` implementation (`backend/src/auth/auth0Provider.ts`).
    *   Modified `authMiddleware` in `backend/src/app.ts` to use the `Auth0Provider` for token verification.
    *   Updated all route handlers (`/register`, `/teams`, `/teams/:id`, `/teams/:teamId/players`, etc.) to use `providerUid` when interacting with the database.
    *   Updated Swagger documentation in `app.ts` to reflect the generic Auth0 authentication.
    *   Corrected a typo in `PlayerService` import path in `app.ts`.
    *   Updated PostgreSQL username and password in `AppDataSource` to `statsvision`.
    *   Added logging for troubleshooting within `Auth0Provider`, including the incoming token's `kid`.

*   **Frontend Changes Implemented:
    *   Uninstalled `firebase` and installed `@auth0/auth0-react`.
    *   Cleaned `node_modules` and `package-lock.json` to resolve peer dependency conflicts.
    *   Removed Firebase imports and initialization from `frontend-test/src/index.tsx` and `frontend-test/src/App.tsx`.
    *   Configured `Auth0Provider` in `frontend-test/src/index.tsx` with Auth0 Domain and Audience.
    *   Updated `frontend-test/src/App.tsx` to use Auth0 hooks (`useAuth0`), implement login/logout via Auth0, display the Auth0 Access Token with a copy button, and update cURL command placeholders.
    *   Added a "Register with Auth0" button to the frontend.

*   **Auth0-Specific Errors & Debugging Attempts:
    *   **`unauthorized_client: Callback URL mismatch`:** Resolved by manually adding `http://localhost:5173` to Auth0's "Allowed Callback URLs" in the dashboard.
    *   **`Error: Service not found: EwznPDvrgImiuHRP45HbapAwGToc4tqM`:** Resolved by correctly configuring the Auth0 API Audience to `basetball-analyzer` (which is the Identifier of the created Auth0 API) instead of the Client ID.
    *   **Current Persistent Error: `{"message":"signature verification failed"}`:** The backend's `express-oauth2-jwt-bearer` middleware is failing to verify the token's signature. The logs show `Auth0Provider: Incoming Token KID: M9F8Fjg4izEHT8LjStJaj`, but the middleware cannot verify it against the public keys. This points to a fundamental mismatch or issue with the Auth0 API's signing keys or their availability via the JWKS endpoint.
    *   Verified network connectivity from Termux to Auth0's JWKS endpoint (`curl -v https://dev-3os8m0zyfxmx60nn.us.auth0.com/.well-known/jwks.json`) – it succeeded.
    *   Checked (and removed) `allowMultiAudiences: true` as it was an invalid configuration option.
    *   Added logging for `kid` from the token header and `Auth0Provider` error details to pinpoint the exact failure.