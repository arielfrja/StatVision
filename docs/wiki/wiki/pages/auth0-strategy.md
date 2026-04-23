---
title: Auth0 Strategy
tags: [decision, auth, security]
sources: [SAD.md, SDD.md, SRS.md, backend/src/app.ts]
updated: 2026-04-22
---

# Auth0 Strategy

StatVision uses **Auth0** as its primary identity and authentication provider.

## The Decision
Offload user management, login flows, and token issuance to a managed service (Auth0) while maintaining a minimal local `User` record for ownership and relational integrity.

## Rationale
- **Security:** Industry-standard security, handling MFA, password resets, and social logins.
- **Speed to Market:** Reduces the need to build and maintain custom auth logic.
- **Scalability:** Handles user growth without infrastructure changes.

## Integration Pattern
1. **Frontend:** Uses the Auth0 Client SDK to handle the login redirect and retrieve a JWT.
2. **API Verification:** The `[[backend-entry-point]]` applies `authMiddleware` which verifies the JWT signature and audience against Auth0's JWKS (JSON Web Key Set).
3. **User Synchronization:** Upon first login, the system synchronizes the Auth0 `sub` (provider UID) with the local PostgreSQL `users` table to establish a local identity for foreign key relations.
4. **Relational Ownership:** All sensitive entities (Games, Teams, Players) are linked to the internal `userId` generated during synchronization.
