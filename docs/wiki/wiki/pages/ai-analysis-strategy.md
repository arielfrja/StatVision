---
title: AI Analysis Strategy
tags: [concept, ai, gemini]
sources: [architecture_plan.md, backend/src/worker/GeminiAnalysisService.ts]
updated: 2026-04-22
---

# AI Analysis Strategy

The core intelligence of StatVision relies on a sophisticated pipeline that leverages Google Gemini for high-precision basketball analytics.

## Multimodal Grounding
Gemini is instructed to use multiple data streams for event verification:
- **Visual Cues:** Ball trajectory, player position, jersey numbers.
- **Audio Cues:** Whistles (stoppage of play), rim sounds (made/missed shots), and cheering to help ground the temporal accuracy of events.

## Phase 0: Metadata Setup
To improve accuracy, the system implements a "Metadata Injection" phase before analysis:
1. **User Input:** Users define team colors and key player jersey numbers for both teams.
2. **Prompt Injection:** This context is injected into the `BASE_PROMPT` for the `[[gemini-analysis-service]]`.
3. **Identity Stability:** By seeding the model with known entities, identity switching (common in raw video AI) is significantly reduced.

## Identity Retention
For videos split into multiple segments, the `[[chunk-processor-worker]]` maintains context continuity:
- Identified players and teams from Chunk N are passed into the prompt for Chunk N+1.
- This ensures that a player identified as "Player #23" in the first 5 minutes remains "Player #23" throughout the game.

## Prompt Management
Prompts are managed using a `PromptLoader` and are split into:
- **System Instruction:** General basketball rules and output schema.
- **First Chunk:** Includes court identification and initial player seeding.
- **Subsequent Chunks:** Focuses on event detection and maintaining identity stability.
