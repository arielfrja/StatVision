# StatVision Frontend

This directory contains the Next.js frontend application for StatVision, providing a rich, interactive user interface for basketball analytics.

## Core Features

-   **Modern UI:** Built with Next.js (App Router) and styled with Material Web Components for a clean, responsive, and modern user experience.
-   **Secure Authentication:** Integrates with Auth0 using `@auth0/auth0-react` for secure user login, registration, and session management.
-   **Team & Roster Management:** Provides interfaces for users to create and manage their teams and player rosters.
-   **Game Analysis Dashboard:** A comprehensive dashboard to view game analysis results, including an interactive video player synced with a play-by-play event feed, sortable player stats, and team box scores.
-   **Video Upload:** A user-friendly form for creating game records and uploading video files to the backend for analysis.
-   **Responsive Navigation:** Features a `SideNav` for desktop and a `BottomNav` for mobile, ensuring a great experience on all devices.

## Technology Stack

-   **Framework:** [Next.js 15](https://nextjs.org/) (using App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Components:** [Material Web Components](https://material-web.dev/)
-   **Authentication:** [@auth0/auth0-react](https://github.com/auth0/auth0-react)
-   **HTTP Client:** [Axios](https://axios-http.com/)
-   **Video Playback:** [React Player](https://www.npmjs.com/package/react-player)

## Setup & Running

All commands should be run from within this (`/frontend`) directory.

### 1. Environment Variables

Create a `.env.local` file in this directory. This file holds the public-facing configuration for the Auth0 SDK.

**Note:** The `.env.local` file is intentionally not committed to source control for security reasons. You must create this file yourself for the authentication to work correctly.

```env
# Auth0 Public Configuration
NEXT_PUBLIC_AUTH0_DOMAIN="your-tenant.auth0.com"
NEXT_PUBLIC_AUTH0_CLIENT_ID="your-auth0-spa-client-id"
NEXT_PUBLIC_AUTH0_AUDIENCE="your-auth0-api-audience"

# Base URL for Auth0 Redirects
NEXT_PUBLIC_BASE_URL="http://localhost:3001"
```

### 2. Installation

```bash
npm install
```

### 3. Running the Development Server

```bash
npm run dev
```

The application will start, and you can access it at **http://localhost:3001**.

## Key Directories

```
src/
├── app/                  # Next.js App Router: contains all pages and layouts
│   ├── games/            # Game list and detailed analysis pages
│   ├── teams/            # Team list and roster management pages
│   ├── api/              # API routes handled by Next.js (e.g., for Auth0)
│   └── layout.tsx        # Root layout for the application
│
├── components/           # Reusable React components (Loader, Nav, Tables, etc.)
├── config/               # Frontend configuration (e.g., navigation items)
├── types/                # Shared TypeScript type definitions for frontend models
└── utils/                # Utility functions (e.g., frontend logger)
```