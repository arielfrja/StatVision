# StatVision 🏀✨

StatVision is an AI-powered basketball analytics platform designed to transform raw game footage into actionable statistics. By leveraging modern web technologies and the power of Google's Gemini 3 AI, it provides teams and players with deep insights into their performance.

This monorepo contains the full-stack application, including the Next.js frontend, the Express backend API, and the decoupled video processing worker.

## Core Features

-   **Secure Authentication**: User registration and login handled by Auth0 for robust security.
-   **Team & Roster Management**: Create teams and manage player rosters with details like jersey numbers and positions.
-   **AI-Powered Video Analysis**: Gemini 3 powered worker service with **Chat-Based Sequential Analysis** for high-accuracy event detection (shots, rebounds, assists, fouls, etc.).
-   **Asynchronous Processing**: A decoupled worker architecture using Google Cloud Pub/Sub ensures the UI remains responsive while intensive video analysis happens in the background.
-   **Interactive Dashboard**: View detailed game analysis, including a play-by-play feed that syncs with video playback.
-   **Automated Box Scores**: After analysis, the system generates detailed, sortable box scores and advanced statistics for teams and players.
-   **Data-Rich Entities**: A comprehensive data model captures everything from granular game events to materialized team and player stats.

---

## Architecture Overview

StatVision employs a decoupled, service-oriented architecture to handle long-running analysis tasks without blocking the user interface.

-   **Frontend**: A modern web application built with **Next.js 15** and **React**. It uses Material Web Components and Auth0 for authentication.
-   **Backend API**: An **Express.js** server providing RESTful endpoints. It orchestrates analysis by publishing jobs to Pub/Sub.
-   **Video Processing Worker**: A Node.js process using **Gemini 3 Chat Mode**. It maintains state across 2-minute video chunks to ensure sequential accuracy and context awareness.
-   **Database**: **PostgreSQL** (hosted on Supabase) managed by **TypeORM**.
-   **Message Queue**: **Google Cloud Pub/Sub** for reliable service decoupling.
-   **AI Service**: **Google Gemini 3 (gemini-3-flash-preview)** utilizing externalized markdown prompts and sequential chat history.

```mermaid
graph TD
    A[Frontend UI<br>(Next.js)] -->|1. Upload Video & Metadata| B(Backend API<br>(Express.js));
    B -->|2. Save File & Publish Job| C(Google Cloud Pub/Sub<br>video-upload-events);
    B -->|Responds Immediately| A;
    C -->|3. Consume Job| D(Video Processing Worker);
    D -->|4. Chunk Video & Sequential Analysis| E(Google Gemini 3 API);
    E -->|5. Chat-Based Results| D;
    D -->|6. Publish Final Result| H(Pub/Sub<br>video-analysis-results);
    H -->|7. Consume Result & Store| B;
    B -->|8. Write to DB| F(PostgreSQL Database);
    A -->|9. Fetch Game Data| B;
    B -->|10. Read from DB| F;
```

---

## Technology Stack

- **Frontend:** Next.js 15, TypeScript, Auth0, Tailwind CSS, Material Web, Playwright.
- **Backend:** Node.js, Express, TypeScript, PostgreSQL (Supabase), TypeORM.
- **AI & Infra:** Google Gemini 3, Google Cloud Pub/Sub, FFmpeg, Cloud Run.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [FFmpeg](https://ffmpeg.org/) installed in PATH.
- [PostgreSQL](https://www.postgresql.org/) (or a Supabase project).
- Google Cloud Project with Pub/Sub and Gemini APIs enabled.

### 1. Environment Setup

#### Backend (`/backend/.env`)
```env
PORT=3000
USE_MOCK_AUTH=true # Set to false for production Auth0

# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=statsvision_db
# OR
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth0 (Only if USE_MOCK_AUTH=false)
AUTH0_JWKS_URI=https://your-tenant.auth0.com/.well-known/jwks.json
AUTH0_AUDIENCE=your_api_identifier
AUTH0_ISSUER=https://your-tenant.auth0.com/

# Google Cloud
GCP_PROJECT_ID=your-project-id
GEMINI_API_KEY=your-api-key
```

#### Frontend (`/frontend/.env.local`)
```env
NEXT_PUBLIC_USE_MOCK_AUTH=true
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-identifier
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Installation & Run

```bash
# Install root dependencies (if any) or project-specific
cd backend && npm install
cd ../frontend && npm install

# Initialize Database
cd ../backend
npm run typeorm migration:run

# Start Services
# Terminal 1: API
npm run start:dev

# Terminal 2: Worker
npm run start:worker

# Terminal 3: Frontend
cd ../frontend
npm run dev
```

---

## Deployment

StatVision is configured for automated deployment via GitHub Actions:

- **Frontend:** Deployed to **Firebase Hosting**.
- **Backend (API & Worker):** Containerized and deployed to **Google Cloud Run**.
- **Database:** Hosted on **Supabase**.

Pushing to `main` triggers the `.github/workflows/deploy.yml` pipeline.

---

## API Documentation

Once the backend is running, access the interactive Swagger docs at:
**`http://localhost:3000/api-docs`**
