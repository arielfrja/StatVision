---
title: Timeline-First UX
tags: [concept, frontend, user-experience]
sources: [architecture_plan.md, SRS.md]
updated: 2026-04-22
---

# Timeline-First UX

StatVision shifts away from traditional data entry forms toward a visual verification workflow.

## Core Philosophy
The video is the "Source of Truth". Every data point (event) must be verifiable against the video timeline.

## Verification Workflow
1. **Live Stream:** As the `[[video-processing-pipeline]]` processes chunks, "DRAFT" events appear on the game timeline in real-time.
2. **Visual Timeline:** Users interact with a seekable timeline where events are marked as icons.
3. **One-Click Correction:** Users can click an event, which automatically seeks the video player to that timestamp, allowing for instant verification and editing.
4. **Entity Assignment:** Instead of a complex roster management page, users map AI-identified players (e.g., "Blue #23") to their roster via a simplified side panel during video review.

## Tech Stack
- **Next.js 15 & React 19:** For a high-performance, responsive UI.
- **Material 3:** Modern design system for consistent aesthetics.
- **Synchronized Player:** Custom video player component that maintains sync with the play-by-play feed.
