# Software Requirements Specification (SRS) - StatVision

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive Software Requirements Specification (SRS) for the **StatVision** platform. It describes the functional and non-functional requirements, system constraints, and architectural overview for the AI-powered sports analytics system.

### 1.2 Scope
StatVision is an end-to-end web platform designed to automate the collection and analysis of sports performance data—initially focused on basketball. The system enables users to upload raw game footage, which is then processed by a decoupled AI worker service using Google Gemini. The platform provides detailed play-by-play data, automated box scores, and advanced performance metrics for teams and players.

### 1.3 Definitions, Acronyms, and Abbreviations
*   **AI:** Artificial Intelligence.
*   **API:** Application Programming Interface.
*   **Auth0:** A managed identity and authentication platform.
*   **Box Score:** A summary of a game's statistics, typically including points, rebounds, assists, etc.
*   **eFG%:** Effective Field Goal Percentage.
*   **eGR:** Electronic Game Record.
*   **FFmpeg:** A complete, cross-platform solution to record, convert and stream audio and video.
*   **Gemini:** Google's family of generative AI models used for video intelligence.
*   **JWT:** JSON Web Token for secure authentication.
*   **Materialized Stats:** Pre-calculated and stored statistical aggregates for performance optimization.
*   **ORM:** Object-Relational Mapper (TypeORM used in this system).
*   **Pub/Sub:** A messaging service for decoupled communication between services.
*   **SRS:** Software Requirements Specification.
*   **TS%:** True Shooting Percentage.

---

## 2. Overall Description

### 2.1 Product Perspective
StatVision is a cloud-native, service-oriented application. It consists of a React-based frontend, a Node.js/Express API, and a dedicated, asynchronous video processing worker. It leverages external managed services for identity (Auth0), messaging (Google Cloud Pub/Sub), and video intelligence (Google Gemini).

### 2.2 Product Functions
*   **User Identity Management:** Secure registration, login, and profile management.
*   **Roster & Entity Management:** Management of teams and players, including historical tracking of player-team assignments and jersey numbers.
*   **Asynchronous Video Processing:** A robust pipeline for uploading large game videos and processing them in the background.
*   **AI-Powered Event Detection:** Automated identification of game events (shots, rebounds, fouls, etc.) using computer vision and generative AI.
*   **Data Refinement & Assignment:** Interfaces for users to verify AI-detected players and teams and map them to their official rosters.
*   **Statistical Analytics:** Generation of detailed box scores, play-by-play logs, and advanced efficiency metrics.
*   **Interactive Visualization:** A dashboard for reviewing game analysis synced with video playback.

### 2.3 User Characteristics
The primary users are amateur and semi-professional sports coaches, players, and data analysts who require professional-grade analytics without the need for manual data entry.

### 2.4 Constraints
*   **Web-Based:** The application must be accessible via modern desktop web browsers.
*   **Decoupled Architecture:** The API and Worker services must remain decoupled to allow for independent scaling and high availability.
*   **Data Security:** User data and analysis results must be isolated at the database level.
*   **Resource Efficiency:** Large video processing must be handled asynchronously to prevent API timeouts and maintain UI responsiveness.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### Module 1: User Account & Security
*   **FR-101: Authentication:** The system shall integrate with Auth0 for secure user authentication using OpenID Connect and JWT.
*   **FR-102: User Synchronization:** Upon first login, the system shall synchronize Auth0 user profiles with the local PostgreSQL database to facilitate data ownership and relationship management.

#### Module 2: Roster Management
*   **FR-201: Team Management:** Users shall be able to create, update, and delete teams.
*   **FR-202: Player Management:** Users shall be able to manage players, including names and default jersey numbers.
*   **FR-203: Roster History:** The system shall maintain a historical record of player-team assignments via a junction entity (`PlayerTeamHistory`) to track jersey changes across different seasons or teams.

#### Module 3: Video Processing Pipeline
*   **FR-301: Multipart Upload:** The system shall support secure uploading of large video files (MP4 format) via the API service.
*   **FR-302: Job Queuing:** Every video upload shall initiate a `VideoAnalysisJob` and publish a message to the `video-upload-events` Pub/Sub topic.
*   **FR-303: Intelligent Chunking:** The worker service shall utilize FFmpeg to chunk large videos into smaller segments for parallel processing and to comply with AI model input limits.
*   **FR-304: AI Analysis:** The worker shall leverage Google Gemini to analyze video chunks and extract granular basketball events.
*   **FR-305: Event Persistence:** Detected events must be stored with temporal (timestamp) and spatial (coordinates) data, including the event type, successful/failure status, and identified jersey numbers.

#### Module 4: Analytics & Reporting
*   **FR-401: Event Taxonomy:** The system shall support a comprehensive set of event types, including but not limited to: Shots (2pt, 3pt, Made/Missed), Assists, Rebounds (Offensive/Defensive), Blocks, Steals, Fouls, and Turnovers.
*   **FR-402: Materialized Box Scores:** After processing, the system shall aggregate events into materialized statistics for both players (`GamePlayerStats`) and teams (`GameTeamStats`).
*   **FR-403: Advanced Metrics:** The system shall calculate advanced efficiency metrics, including eFG% and TS%.
*   **FR-404: Play-by-Play Feed:** The dashboard shall display a chronological feed of all detected game events.

#### Module 5: Interactive UI/UX
*   **FR-501: Progress Monitoring:** The UI shall provide real-time or near real-time status updates (UPLOADED, CHUNKING, ANALYZING, COMPLETED, FAILED) for active jobs.
*   **FR-502: Entity Assignment:** A specialized interface shall allow users to map AI-identified jerseys (e.g., "Player in Blue #23") to specific players in their rosters.
*   **FR-503: Data Correction:** Users shall be able to edit or delete AI-generated events to ensure 100% data accuracy.

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance
*   **NFR-201: UI Latency:** The system must respond to user interactions within 200ms, excluding long-running file uploads or processing tasks.
*   **NFR-202: Processing Scalability:** The worker service must be capable of scaling horizontally to handle concurrent video analysis jobs during peak usage periods.

#### 3.2.2 Reliability & Integrity
*   **NFR-301: Transactional Consistency:** The system shall use database transactions (where supported by the ORM) to ensure data integrity during complex event-to-stats aggregation workflows.
*   **NFR-302: Fault Tolerance:** The processing worker must implement retry logic with exponential backoff for external API calls (Gemini) and handle failed jobs gracefully by logging failure reasons.

#### 3.2.3 Security
*   **NFR-401: Authorization:** Access to specific game data and rosters must be restricted to the owner (User) who created them.
*   **NFR-402: Secret Management:** All sensitive API keys (Gemini, Auth0, GCP) must be managed via environment variables and never exposed in frontend code.

---

## 4. System Architecture
StatVision follows a modern microservices-adjacent architecture:
*   **Frontend:** Next.js (React) + Material Web Components.
*   **API:** Node.js (Express) + TypeORM (PostgreSQL).
*   **Worker:** Node.js + FFmpeg + Gemini API.
*   **Infrastructure:** Google Cloud Platform (Pub/Sub, Storage).
