# StatVision Product Strategy & Roadmap

## 1. Executive Summary
**StatVision** is an AI-powered basketball analytics platform designed to transform raw game footage into actionable insights. Our **North Star** is to provide amateur and semi-pro teams with professional-grade data without the overhead of manual tracking.

## 2. Strategic Improvement Pillars

### 2.1 Accuracy (Human-in-the-Loop)
*   **Objective:** Achieve 100% data reliability by combining AI speed with human precision.
*   **Key Feature:** **Human-in-the-Loop Data Correction**. An interface for coaches to verify and map AI-detected player tags (e.g., "Blue #23") to their official roster.
*   **KPI:** Percentage of verified vs. unverified events.

### 2.2 Expansion (Automated Ingestion)
*   **Objective:** Minimize friction in the data pipeline.
*   **Key Feature:** **Background Video Ingestion**. Support for large file uploads and asynchronous chunking/processing that doesn't block the user dashboard.
*   **KPI:** Video processing turnaround time (TAT).

### 2.3 Engagement (Advanced Insights)
*   **Objective:** Provide deep value beyond simple box scores.
*   **Key Feature:** **Advanced Analytics Dashboard**. Including efficiency metrics like eFG%, TS%, and interactive play-by-play syncing with video.
*   **KPI:** Average session duration and recurring logins.

### 2.4 Functionality (Roster & History)
*   **Objective:** Support complex, real-world team management.
*   **Key Feature:** **Temporal Roster Management**. Tracking player jersey numbers and team assignments across different seasons/games.
*   **KPI:** Data accuracy in historical reports.

### 2.5 Profitability (Workspace Monetization)
*   **Objective:** Sustainable growth and multi-tenancy.
*   **Key Feature:** **Secure Multi-Tenant Workspaces**. Clear isolation of data between teams and organizational users.
*   **KPI:** Number of active organizational accounts.

### 2.6 Innovation (Highlight Generation)
*   **Objective:** Differentiation through "wow" features.
*   **Key Feature:** **Automated Highlight Reel Generation**. Using AI event timestamps to automatically extract key plays (e.g., "All 3-pointers").
*   **KPI:** Number of shared clips/highlights.

## 3. Ethical Monetization Roadmap
1.  **Free Tier:** Individual game uploads with basic box scores.
2.  **Pro Tier:** Advanced analytics, team history tracking, and highlight generation.
3.  **Organizational Tier:** Multi-tenant workspace management for leagues or clubs.
4.  **Marketplace:** Potential for data-sharing with scouts or recruiters.

## 4. Actionable Epics
| Epic | Description | Priority | Complexity |
| :--- | :--- | :--- | :--- |
| **Auth & Multi-Tenancy** | Build robust auth & organizational data isolation. | High | Medium |
| **Temporal Rosters** | Develop the history tracking system for players/teams. | High | High |
| **Asynchronous Pipeline** | Optimize video upload, chunking, and worker logic. | High | High |
| **AI Integration** | Refine Gemini event detection and event taxonomies. | Medium | Medium |
| **Interactive UI** | Build the human-in-the-loop mapping and correction interface. | Medium | Medium |
