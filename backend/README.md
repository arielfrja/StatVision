# StatVision Backend

This directory contains the backend services for the StatVision application, including the main RESTful API and the decoupled video processing worker.

## Core Responsibilities

-   **API Server (`app.ts`):** An Express.js application that handles all synchronous HTTP requests from the frontend.
-   **Authentication:** Validates Auth0 JWTs on protected routes and manages user records in the database.
-   **Data Management:** Provides CRUD endpoints for managing `Teams`, `Players`, `Games`, and related data.
-   **Job Orchestration:** Receives video uploads, creates analysis jobs, and publishes them to a Google Cloud Pub/Sub topic for the worker to process.
-   **API Documentation:** Serves interactive API documentation using Swagger/OpenAPI.

## Technology Stack

-   **Framework:** Node.js with Express.js
-   **Language:** TypeScript
-   **Database & ORM:** PostgreSQL with TypeORM
-   **Authentication:** `express-oauth2-jwt-bearer` for validating Auth0 JWTs.
-   **Messaging:** Google Cloud Pub/Sub for communication with the worker.
-   **File Handling:** `multer` for handling video uploads.
-   **Logging:** `winston` for structured, file-rotating logs.

## Setup & Running

All commands should be run from within this (`/backend`) directory.

### 1. Environment Variables

Create a `.env` file in this directory based on the example in the root `README.md`. It must include database credentials, Auth0 API configuration, and Google Cloud project details.

**Note:** The `.env` file is intentionally not committed to source control for security reasons. You must create this file yourself. Similarly, the JSON file for `GOOGLE_APPLICATION_CREDENTIALS` is also ignored and must be obtained from your Google Cloud project dashboard.

### 2. Installation

```bash
npm install
```

### 3. Database Setup

Ensure you have a PostgreSQL instance running. Then, run the TypeORM migrations to create the database schema:

```bash
npm run typeorm migration:run
```

### 4. Running the Services

The backend consists of two primary services that should be run in separate terminals.

**a) Start the API Server:**
This server handles all user-facing requests.

```bash
npm run start
```
> The API will be available at `http://localhost:3000`.
> The Swagger documentation will be at `http://localhost:3000/api-docs`.

**b) Start the Video Processing Worker:**
This service listens for and processes video analysis jobs asynchronously.

```bash
npm run start:worker
```
> The worker will connect to Google Cloud Pub/Sub and begin listening for messages. You will see detailed logs in `/backend/logs`.

## Directory Structure

```
src/
├── auth/         # Authentication logic (Auth0 provider)
├── config/       # Logging and other configurations
├── interfaces/   # Shared TypeScript interfaces
├── middleware/   # Express middleware for auth, logging, errors
├── migration/    # TypeORM database migrations
├── repository/   # Data access layer (TypeORM Repositories)
├── routes/       # API route definitions (Express Routers)
├── service/      # Business logic layer
└── worker/       # Decoupled video processing logic
```
