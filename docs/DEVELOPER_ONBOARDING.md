# 🏀 StatVision Developer Onboarding Guide

Welcome to the **StatVision** team! This guide will help you get your local development environment set up and familiarize you with the project's architecture and workflows.

---

## 🏗 Project Overview

StatVision is an AI-powered basketball analytics platform that transforms game footage into professional-grade box scores.

### Architecture at a Glance
The project is organized as a **monorepo**:
- **`frontend/`**: Next.js 15 application (App Router, Tailwind CSS, Material Web).
- **`api/`**: Express.js backend for data management and orchestration.
- **`worker/`**: Decoupled Node.js service for video processing and Gemini AI analysis.
- **`common/`**: Shared TypeScript entities, types, and logic (used by api and worker).

---

## 🛠 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18 or higher.
- **npm**: v9 or higher.
- **FFmpeg**: Required for video processing (must be in your `PATH`).
- **PostgreSQL**: Local instance or access to a Supabase project.
- **Google Cloud SDK**: To interact with GCS, Pub/Sub, and Gemini.

---

## 🚀 Environment Setup

### 1. Clone and Install
```bash
git clone <repo-url>
cd StatVision
npm install
```

### 2. Configure Environment Variables
You will need to set up `.env` files in several locations. Use the following as a template:

#### **Root `.env.local`** (or shared base)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/statsvision_db

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account-key.json
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-video-bucket
```

#### **`api/.env`**
```env
PORT=3000
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=your-auth0-audience
# Set to 'true' for local development without Auth0
NEXT_PUBLIC_USE_MOCK_AUTH=true 
```

#### **`worker/.env`**
```env
PORT=8080
GEMINI_API_KEY=your-gemini-api-key
```

#### **`frontend/.env.local`**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
# For local dev
NEXT_PUBLIC_USE_MOCK_AUTH=true 
```

---

## 💻 Running Locally

We provide master scripts in the root directory for unified control:

- **Run all services (Live Dev):** `npm run master:run`
  - *This starts API, Worker, and Frontend in parallel using ts-node and next dev.*
- **Build everything:** `npm run master:build`
- **Start Production Build:** `npm run master:start`
- **Clean Restart:** `npm run master:restart`

### Individual Service Commands
If you need to run a specific service:
- `npm run api:dev`
- `npm run worker:dev`
- `npm run frontend:dev`

---

## 📁 Where to Find Everything

- **Architecture Details:** [docs/technical/SAD.md](docs/technical/SAD.md)
- **Database Schema:** [common/src/core/entities/](common/src/core/entities/) and [docs/wiki/SCHEMA.md](docs/wiki/SCHEMA.md)
- **Roadmap & Progress:** [docs/product/MASTER_ROADMAP.md](docs/product/MASTER_ROADMAP.md)
- **Daily Logs:** [jobLog.md](jobLog.md) (Check here for recent changes!)
- **UI Verification:** [frontend/ui_verification/](frontend/ui_verification/) (Reference screenshots of the dashboard).

---

## 🔄 Development Workflow

1.  **Branching:** Create a feature branch from `master` (e.g., `feat/new-stats`).
2.  **Coding Standards:**
    - Use TypeScript strictly.
    - Follow the "Why over What" commit message style.
    - Always consider impacts on `@statvision/common`.
3.  **Database Migrations:**
    - Migrations are managed in `common/`.
    - Run `npm run migrate:run` to apply them.
4.  **Logging:**
    - Record significant milestones or blockers in `jobLog.md`.
5.  **Testing:**
    - Run unit tests: `npm test`
    - Run E2E tests: `cd frontend && npm run test:e2e`

---

## ❓ Common Troubleshooting

- **Build Errors on ARM (Mac M1/M2/Android):** Next.js Turbopack might fail. Our build scripts automatically use `--webpack` to fix this.
- **Database Connection:** Ensure your PostgreSQL server is running and the `DATABASE_URL` is correct.
- **Gemini Rate Limits:** If the worker fails during analysis, check your GCP quotas for the Gemini API.

---

Happy Coding! 🏀✨
