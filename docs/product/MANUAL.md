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
**Status:** 🟢 Production Ready
**Description:** The background engine powered by Gemini 3.1 Flash that transforms raw pixels into data.

### Features:
- **Sequential Chat Analysis:** The AI maintains a continuous "conversation" across video chunks, preventing it from forgetting players who move off-camera.
- **Atomic Processing:** Videos are split into manageable chunks, processed in parallel, and merged transactionally to prevent data loss.
- **Event Taxonomy:** Automated detection of Shots (Made/Missed), Rebounds (Off/Def), Assists, Steals, Blocks, and Fouls.

---

## 3. The Intelligence Dashboard
**Status:** 🟢 Production Ready
**Description:** The primary interface for consuming game data.

### Features:
- **Synced Play-by-Play:** A chronological list of game events where clicking an event jumps the video player to that exact timestamp.
- **Live Event Stream:** Results appear in a "Draft" state as soon as the first chunk is processed, allowing coaches to see data in near-real-time.
- **Auto-Box Scores:** Real-time calculation of traditional points, rebounds, and assists.

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
*Next Chapter: [6. Multi-Tenant Workspaces] (In Development)*
