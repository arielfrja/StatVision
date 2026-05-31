# StatVision: User & Operator Manual

This manual documents the functional features of the StatVision platform that have successfully transitioned from development to production.

---

## 📖 Table of Contents
1. [Game Setup & Intelligent Upload](#1-game-setup--intelligent-upload)
2. [AI Event Detection & Processing](#2-ai-event-detection--processing)
3. [The Intelligence Dashboard](#3-the-intelligence-dashboard)
4. [Human-in-the-Loop (HITL) Verification](#4-human-in-the-loop-hitl-verification)
5. [Team & Roster Management](#5-team--roster-management)

---

## 1. Game Setup & Intelligent Upload
**Status:** 🟢 Production Ready
**Description:** The gateway to the platform. Users do not just "upload video"; they provide the AI with context to ensure high-accuracy results.

### Features:
- **Multi-Step Wizard:** A guided flow to capture game metadata before analysis begins.
- **Context Injection:** Users select the Game Type (e.g., Full Court vs. 3x3) and Identity Mode (e.g., Jersey Colors vs. Facial Recognition).
- **Visual Context:** Optional text field to provide the AI with specific cues (e.g., "Team A is wearing bright green neon jerseys").

---

## 2. AI Event Detection & Processing
**Status:** 🟢 Production Ready (Finalized Architecture)
**Description:** The background engine powered by Gemini 1.5/2.0 that transforms raw pixels into structured basketball data.

### Features:
- **Direct Video Analysis:** Unlike traditional systems that slice video into files, StatVision analyzes the raw source using time-based offsets. This preserves video quality and drastically reduces ingestion time.
- **Sequential Multi-Turn Logic:** The AI processes the game turn-by-turn. Each turn "remembers" the player roster and team assignments from the previous one, ensuring 100% identity consistency across the entire match.
- **Automated Lifecycle & Cleanup:** Once a game is fully analyzed, the system performs a final usage audit (calculating token rates) and automatically deletes temporary cloud assets to protect user privacy.
- **Event Taxonomy:** Automated detection of Shots (Made/Missed), Rebounds (Off/Def), Assists, Steals, Blocks, and Fouls with coordinate mapping.

---

## 3. The Performance Dashboard
**Status:** 🟢 Production Ready (Minimalist Overhaul)
**Description:** The primary interface for consuming game data, redesigned for Functional Minimalism to reduce cognitive load for coaches.

### Features:
- **Context-First Layout:** A vertical stack placing the Video Player on top (primary context) and data tables directly below.
- **Synced Play-by-Play:** A chronological list of game events where clicking an event jumps the video player to that exact timestamp.
- **Side-by-Side Data View:** Standard Box Score and Play-by-Play feed are displayed side-by-side for simultaneous review.
- **Interactive Event Actions:** Users can now **Edit** or **Delete** AI-generated events directly from the feed to ensure 100% box score accuracy.
- **High-Contrast Analytics:** Flat, high-contrast data tables using Inter typography for maximum readability in low-light gym environments.

---

## 4. Human-in-the-Loop (HITL) Verification
**Status:** 🟢 Production Ready
**Description:** Tools to bridge the gap between AI detection and 100% data reliability.

### Features:
- **Entity Assignment:** If the AI identifies "Blue #23," the user can click a button to map that ID to a permanent player in their roster.
- **Team Switching:** A quick-toggle to correct cases where the AI misidentifies which team a player belongs to.
- **Deduplication:** A backend service that automatically merges overlapping events from different video segments.

---

## 5. Team & Roster Management
**Status:** 🟢 Production Ready
**Description:** The foundational data layer for teams and players.

### Features:
- **Persistent Rosters:** Save teams and players once; use them across multiple games.
- **Temporal Tracking:** (Foundation Laid) Support for tracking player assignments across different seasons.
- **Mobile-Responsive UI:** Full management capabilities from phone or tablet while at the gym.

---

## 6. Full-Stack Observability
**Status:** 🟢 Production Ready
**Description:** Centralized monitoring and error tracing system for production stability and rapid debugging.

### Features:
- **Centralized Client Logs:** Browser-side errors (crashes, hydration issues, network failures) are automatically forwarded to the API.
- **Surgical Trace Correlation:** Every system error generates a unique **Error ID (UUID)** which is returned to the user and logged on the server.
- **Full Stack Tracing:** API logs now capture complete execution paths, pinpointing the exact line of code for every failure.
- **Metadata Context:** Every log entry includes technical context: IP address, User Agent, active URL, and the User ID of the affected account.

---

## 7. AI Resource Monitoring
**Status:** 🟢 Production Ready
**Description:** A transparent system for tracking and visualizing AI infrastructure consumption.

### Features:
- **Real-Time Token Tracking:** The system captures exact prompt and candidate token counts from the Gemini API for every video chunk analyzed.
- **Throughput Visualization:** Interactive Area and Bar charts allow users to see their daily usage trends.
- **Usage Summaries:** Global aggregates for tokens and total video minutes processed.
- **Cost Estimation:** Real-time dollar estimates based on current AI model pricing to provide transparency on infrastructure costs.
- **Flexible Time Ranges:** View usage data over 7-day, 30-day, or 90-day periods.

---
*Next Chapter: [8. Multi-Tenant Workspaces] (In Development)*
