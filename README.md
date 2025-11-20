# StatVision 🏀✨

StatVision is an AI-powered basketball analytics platform designed to transform raw game footage into actionable statistics. By leveraging modern web technologies and the power of Google's Gemini AI, it provides teams and players with deep insights into their performance.

This monorepo contains the full-stack application, including the Next.js frontend, the Express backend API, and the decoupled video processing worker.

## Core Features

-   **Secure Authentication**: User registration and login handled by Auth0 for robust security.
-   **Team & Roster Management**: Create teams and manage player rosters with details like jersey numbers and positions, with a full history of player-team assignments.
-   **AI-Powered Video Analysis**: Upload game videos and let the Gemini-powered worker service automatically detect and log key basketball events (shots, rebounds, assists, fouls, etc.).
-   **Asynchronous Processing**: A decoupled worker architecture using Google Cloud Pub/Sub ensures the UI remains responsive while intensive video analysis happens in the background.
-   **Interactive Dashboard**: View detailed game analysis, including a play-by-play feed that syncs with video playback.
-   **Automated Box Scores**: After analysis, the system generates detailed, sortable box scores and advanced statistics for teams and players.
-   **Data-Rich Entities**: A comprehensive data model captures everything from granular game events with on-court coordinates to materialized team and player stats for fast reporting.

---

## Architecture Overview

StatVision employs a decoupled, service-oriented architecture to handle long-running analysis tasks without blocking the user interface. This design is built for modularity, scalability, and resilience.

-   **Frontend**: A modern web application built with **Next.js** and **React**. It uses Material Web Components for a clean, responsive UI and Auth0 for handling user authentication.
-   **Backend API**: An **Express.js** server that provides RESTful endpoints for managing users, teams, players, and games. It receives video uploads and initiates the analysis process by publishing a job to the message queue.
-   **Video Processing Worker**: A separate Node.js process that operates independently. It listens for tasks on a Google Cloud Pub/Sub topic, chunks the video using FFmpeg, sends the chunks to the Gemini API for analysis, processes the results, and stores them in the database.
-   **Database**: A **PostgreSQL** database serves as the single source of truth, with schemas managed by **TypeORM**.
-   **Message Queue**: **Google Cloud Pub/Sub** is used to decouple the API from the worker. When a video is uploaded, the API publishes a message, which the worker consumes to start processing.
-   **AI Service**: **Google Gemini** is used for the heavy lifting of video analysis.

```mermaid
graph TD
    A[Frontend UI<br>(Next.js)] -->|1. Upload Video & Metadata| B(Backend API<br>(Express.js));
    B -->|2. Save File & Publish Job| C(Google Cloud Pub/Sub<br>video-upload-events);
    B -->|Responds Immediately| A;
    C -->|3. Consume Job| D(Video Processing Worker);
    D -->|4. Chunk Video & Publish for Analysis| G(Pub/Sub<br>chunk-analysis);
    G -->|5. Consume Chunk| D;
    D -->|6. Call AI| E(Google Gemini API);
    E -->|7. Return Analysis| D;
    D -->|8. Publish Final Result| H(Pub/Sub<br>video-analysis-results);
    H -->|9. Consume Result & Store| B;
    B -->|10. Write to DB| F(PostgreSQL Database);
    A -->|11. Fetch Game Data| B;
    B -->|12. Read from DB| F;
```

For more detail, see the [Video Processing Architecture Document](./backend/docs/video_processing_architecture.md).

---

## Technology Stack

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>Frontend</h3>
      <ul>
        <li><a href="https://nextjs.org/">Next.js 15</a> (React Framework)</li>
        <li><a href="https://www.typescriptlang.org/">TypeScript</a></li>
        <li><a href="https://auth0.com/">Auth0</a> for Authentication</li>
        <li><a href="https://material-web.dev/">Material Web Components</a></li>
        <li><a href="https://axios-http.com/">Axios</a> for HTTP requests</li>
        <li><a href="https://www.npmjs.com/package/react-player">React Player</a> for video playback</li>
        <li>ESLint for code linting</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Backend & Worker</h3>
      <ul>
        <li><a href="https://nodejs.org/">Node.js</a></li>
        <li><a href="https://expressjs.com/">Express.js</a> (API Framework)</li>
        <li><a href="https://www.typescriptlang.org/">TypeScript</a></li>
        <li><a href="https://www.postgresql.org/">PostgreSQL</a> (Database)</li>
        <li><a href="https://typeorm.io/">TypeORM</a> (ORM)</li>
        <li><a href="https://cloud.google.com/pubsub">Google Cloud Pub/Sub</a></li>
        <li><a href="https://ai.google.dev/">Google Gemini API</a></li>
        <li><a href="https://www.npmjs.com/package/winston">Winston</a> for logging</li>
        <li><a href="https://www.npmjs.com/package/multer">Multer</a> for file uploads</li>
        <li><a href="https://ffmpeg.org/">FFmpeg</a> (for video chunking)</li>
      </ul>
    </td>
  </tr>
</table>

---

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) (or pnpm/yarn)
-   [PostgreSQL](https://www.postgresql.org/download/) or [Docker](https://www.docker.com/products/docker-desktop) to run a PostgreSQL instance.
-   [FFmpeg](https://ffmpeg.org/download.html) must be installed and available in your system's PATH.
-   A Google Cloud project with the Pub/Sub and Generative Language (Gemini) APIs enabled.
-   An Auth0 tenant with a configured Single Page Application and a corresponding API.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd StatVision
```

### 2. Environment Setup

You need to set up environment variables for both the frontend and backend.

#### Backend (`/backend/.env`)

Create a `.env` file in the `/backend` directory. This file should contain sensitive keys for the database, authentication provider, and Google Cloud.

```env
# Server Port
PORT=3000

# Database Connection (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=statsvision
DB_PASSWORD=statsvision_password
DB_DATABASE=statsvision_db

# Auth0 Configuration
AUTH0_JWKS_URI="https://your-tenant.auth0.com/.well-known/jwks.json"
AUTH0_AUDIENCE="your-auth0-api-audience"
AUTH0_ISSUER="https://your-tenant.auth0.com/"

# Google Cloud & Worker Configuration
GCP_PROJECT_ID="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/gcp-credentials.json"
VIDEO_UPLOAD_TOPIC_NAME="video-upload-events"
VIDEO_UPLOAD_SUBSCRIPTION_NAME="video-upload-events-sub"
CHUNK_ANALYSIS_TOPIC_NAME="chunk-analysis"
CHUNK_ANALYSIS_SUBSCRIPTION_NAME="chunk-analysis-sub"
VIDEO_ANALYSIS_RESULTS_TOPIC_NAME="video-analysis-results"
VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME="video-analysis-results-sub"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL_NAME="your-gemini-model-name"
PROCESSING_MODE="SEQUENTIAL" # Use SEQUENTIAL for local dev, PARALLEL for cloud
```

#### Frontend (`/frontend/.env.local`)

Create a `.env.local` file in the `/frontend` directory.

```env
# Auth0 Public Configuration
NEXT_PUBLIC_AUTH0_DOMAIN="your-tenant.auth0.com"
NEXT_PUBLIC_AUTH0_CLIENT_ID="your-auth0-spa-client-id"
NEXT_PUBLIC_AUTH0_AUDIENCE="your-auth0-api-audience"

# Base URL for Auth0 Redirects
NEXT_PUBLIC_BASE_URL="http://localhost:3001"
```

### 3. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Set up the PostgreSQL database
# (Ensure you have a PostgreSQL server running and a database with the user and password matching your .env file)

# Run database migrations to create all tables
npm run typeorm migration:run

# Start the API server in a dedicated terminal
npm run start

# In a separate terminal, start the video processing worker
npm run start:worker
```

The API server will be running on `http://localhost:3000` and the worker will start listening for Pub/Sub messages.

### 4. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server (runs on port 3001 by default)
npm run dev
```

The frontend will be running on `http://localhost:3001`.

---

## Usage

1.  **Sign Up / Login**: Open `http://localhost:3001` and create an account or log in.
2.  **Create a Team**: Navigate to the "Teams" page and create one or more teams.
3.  **Manage Roster**: Click on a team to manage its roster, adding players with their names and jersey numbers.
4.  **Analyze a Game**: Go to the "Games" page and click "Analyze New Game".
5.  **Upload Video**: Give the game a name, select the video file, and click "Start Analysis".
6.  **Monitor Progress**: The game will appear in your games list with a "PROCESSING" status. The worker service is now chunking and analyzing your video.
7.  **View Results**: Once the status changes to "ANALYZED", click on the game to view the full dashboard, including the play-by-play feed and detailed statistics.

---

## API Documentation

The backend includes Swagger (OpenAPI) documentation. Once the backend server is running, you can access the interactive API documentation at:

**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

This documentation provides details on all available endpoints, required parameters, and response schemas.
