# StatVision - Project Overview & Deployment

## 1. What is StatVision?
**StatVision** is an AI-powered basketball analytics platform. It automates the tedious task of manual stat-tracking by using computer vision and Large Language Models (LLMs) to analyze game footage. Coaches and players can upload raw video and receive a full box score and play-by-play breakdown within minutes.

## 2. How it Works (The Pipeline)

### 2.1 Video Ingestion
- **Upload:** Users upload basketball games through a Next.js frontend.
- **API Orchestration:** An Express.js backend receives the file, stores it temporarily, and publishes an event to **Google Cloud Pub/Sub** (`video-upload-events`).

### 2.2 Asynchronous Analysis
- **Worker Service:** A dedicated Node.js worker service consumes events from Pub/Sub.
- **Intelligent Chunking:** The worker uses **FFmpeg** to split the high-resolution video into smaller chunks (e.g., 2 minutes) to fit within AI model context windows.
- **Sequential AI Analysis:** The worker sends video chunks to **Google Gemini 3** (Flash) in a chat-based session. By maintaining chat history, the AI understands the game's flow and avoids duplicating events that span across chunks.
- **Event Extraction:** Gemini identifies shots (made/missed), rebounds, assists, fouls, and turnovers, along with jersey numbers and timestamps.

### 2.3 Data Materialization
- **Database:** Events are stored in a **PostgreSQL** database (hosted on Supabase) via **TypeORM**.
- **Materialized Stats:** The system automatically aggregates granular events into `GamePlayerStats` and `GameTeamStats` to provide instant performance metrics (eFG%, points, etc.).

### 2.4 User Dashboard
- **Interactive Play-by-Play:** Users can view a chronological list of every event. Clicking an event syncs the video player to that exact moment.
- **Box Scores:** Professional-grade statistics tables for both teams and individual players.

## 3. Technology Stack
- **Frontend:** Next.js 15, TypeScript, Auth0 (Auth), Material Web Components.
- **Backend:** Node.js, Express, TypeORM, PostgreSQL (Supabase).
- **Processing:** FFmpeg, Google Cloud Pub/Sub.
- **AI:** Google Gemini 3 (gemini-3.1-flash).
- **Infrastructure:** Google Cloud Run (Containers), Firebase Hosting.

## 4. Current Deployment (Production)
The project uses **GitHub Actions** for CI/CD, defined in `.github/workflows/deploy.yml`.

- **Trigger:** Any push to `main` or `master`.
- **Backend Deployment:**
    - Builds two Docker images: `Dockerfile.api` and `Dockerfile.worker`.
    - Pushes images to **GCP Artifact Registry**.
    - Deploys to **Google Cloud Run** as serverless containers.
- **Frontend Deployment:**
    - Builds the Next.js app (`npm run build`).
    - Deploys static assets to **Firebase Hosting**.
- **Database:** Migrations are run manually or during the build process to keep the Supabase schema up to date.
