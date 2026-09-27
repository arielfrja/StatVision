# Implementation Plan: Prompt Optimization & Event Type Architecture

## Overview
This plan refactors prompt handling and event classification across `@statvision/common` and downstream services. It replaces prompt "over-engineering" (redundant JSON shapes, theatrical roleplay, duplicated consistency instructions) with direct, clear instructions, relying on Gemini's `responseSchema` for output structure enforcement. It establishes a single exported source of truth for event types and configures `gemini-3.5-flash-lite` as the target model for video analysis.

---

## Key Objectives
1. **Single Source of Truth**: Export `ALLOWED_EVENT_TYPES` and `EventType` union type from `@statvision/common` (`common/src/constants/eventTypes.ts`).
2. **Schema Integration**: Bind `EVENT_SCHEMA` (`common/src/constants/gemini.ts`) directly to `ALLOWED_EVENT_TYPES`.
3. **De-bloat Prompts**: Remove manual JSON templates, theatrical persona bloat, and repeated instructions from files in `common/src/infrastructure/prompts/`.
4. **Clean Provider Pipeline**: Simplify multi-turn prompt construction in `common/src/infrastructure/GeminiProvider.ts`.
5. **Model Standardization**: Ensure video analysis pipeline targets `gemini-3.5-flash-lite`.

---

## Step-by-Step Instructions

### Step 1: Export Event Types (`common/src/constants/eventTypes.ts`)
Update `common/src/constants/eventTypes.ts` to export both the `as const` array and the TypeScript type definition.

**File:** `common/src/constants/eventTypes.ts`
```typescript
export const ALLOWED_EVENT_TYPES = [
  "2pt Shot Attempt",
  "2pt Shot Made",
  "2pt Shot Missed",
  "3pt Shot Attempt",
  "3pt Shot Made",
  "3pt Shot Missed",
  "Assist",
  "Block",
  "Defensive Rebound",
  "Dribble",
  "End of Game",
  "End of Period",
  "Flagrant Foul",
  "Foul",
  "Free Throw Attempt",
  "Free Throw Made",
  "Free Throw Missed",
  "Game Start",
  "Jump Ball",
  "Jump Ball Possession",
  "Offensive Foul",
  "Offensive Rebound",
  "Out of Bounds",
  "Pass",
  "Period Start",
  "Personal Foul",
  "Possession Change",
  "Rebound",
  "Shooting Foul",
  "Steal",
  "Substitution",
  "Technical Foul",
  "Team Rebound",
  "Timeout Taken",
  "Turnover",
  "Violation"
] as const;

export type EventType = (typeof ALLOWED_EVENT_TYPES)[number];
```

Ensure `common/src/index.ts` re-exports `ALLOWED_EVENT_TYPES` and `EventType`.

---

### Step 2: Clean Gemini Output Schema (`common/src/constants/gemini.ts`)
Ensure `common/src/constants/gemini.ts` imports `ALLOWED_EVENT_TYPES` and defines a strict, clean JSON Schema for Gemini's `responseSchema` configuration.

**File:** `common/src/constants/gemini.ts`
- Use `ALLOWED_EVENT_TYPES` in `properties.events.items.properties.eventType.enum`.
- Ensure all required properties (`identifiedTeams`, `events`) are present.
- Keep field descriptions concise and helpful.

---

### Step 3: Remove Duplicate Constant Files
To eliminate code drift:
1. Delete `api/src/constants/eventTypes.ts` and `api/src/constants/gemini.ts` if they are standalone duplicates, or update any local references to import directly from `@statvision/common`.
2. Ensure `frontend/src/constants/eventTypes.ts` stays in sync with `ALLOWED_EVENT_TYPES`.

---

### Step 4: Refactor Prompts (`common/src/infrastructure/prompts/`)

#### 4.1 `system_instruction.md`
Remove theatrical intro ("You are an expert Olympic and NBA-level..."), redundant JSON schema examples, and ALL CAPS shouting. Keep instructions clear, precise, and practical:

```markdown
Analyze the basketball video feed and extract all on-court events as structured data.

### Video Analysis Rules
- **Live Play Only:** Log events only during active play. Ignore commercials, studio cuts, and dead-ball delays.
- **Ignore Replays:** Broadcast camera cuts frequently show slow-motion replays. Recognize replays and do NOT log them as new events.
- **Timestamps:** For every event, record `timestamp` (MM:SS relative to the video segment) and the scorebug `game_clock` if visible.

### Team and Player Identity
- Assign consistent IDs for the entire game (`TEMP_TEAM_1`, `TEMP_TEAM_2`, `TEMP_PLAYER_XX`).
- Use placeholders if names/numbers are unknown: `<Team 1>`, `<Team 2>`, `<Player #XX>`.
- Do not put physical descriptions in the name field; use the `description` field instead.

### Certainty Assessment
Assign `playerCertainty` (0.0-1.0) and `eventTypeCertainty` (0.0-1.0) for every event based on visual clarity.

### Context & Rulesets
{{visualContext}}

{{formatInstructions}}

{{identityInstructions}}
```

#### 4.2 `first_chunk.md`
Remove the hardcoded JSON snippet (Gemini enforces this via `responseSchema`).

```markdown
This is the first segment of the video. Initialize the teams and player rosters (`identifiedTeams`), and extract all initial gameplay events.
```

#### 4.3 `subsequent_chunk.md`
Keep continuation logic short and clear:

```markdown
This is chunk {{sequence}} of the video. Continue extracting gameplay events while maintaining team and player identity continuity from prior turns.
```

#### 4.4 `rulesets.md`
Keep rule definitions concise:

```markdown
# Game Rulesets

<FULL_COURT>
Standard full-court basketball. 2PT and 3PT field goals, 1PT free throws.
</FULL_COURT>

<THREE_X_THREE>
FIBA 3x3 half-court rules. 1PT inside the arc, 2PT outside the arc.
</THREE_X_THREE>

<STREET_BALL>
Half-court streetball rules. 1PT inside, 2PT outside.
</STREET_BALL>

<ONE_X_ONE>
1-on-1 isolation play. Focus on offensive player vs single defender.
</ONE_X_ONE>

# Identity Modes

<JERSEY_COLORS>
Identify teams primarily by jersey colors.
</JERSEY_COLORS>

<INTERACTION_BASED>
Identify teams by interaction patterns (passes, screens, bench celebrations).
</INTERACTION_BASED>
```

#### 4.5 `coach_report.md`
Keep report generation requirements clean and structured without fluff:

```markdown
You are a basketball performance analyst. Analyze the provided game events and box score data, and write a structured Markdown report for the coaching staff.

Context:
- Game Type: {{gameType}}
- Team: {{teamName}}
- Identity Mode: {{identityMode}}

Input Data:
### Game Events
{{eventsJson}}

### Box Score
{{boxScoreJson}}

Report Structure:
1. **Performance Overview**: Summary of team execution.
2. **Top 3 Strengths**: Key tactical successes with specific player references.
3. **Top 3 Areas for Improvement**: Specific weaknesses observed in the data.
4. **Tactical Drill Recommendations**: 3 targeted drills to address the improvement areas.
5. **Key Player Insight**: One specific coaching note for a notable impact player.
```

---

### Step 5: Clean Up `GeminiProvider.ts`
In `common/src/infrastructure/GeminiProvider.ts`:
1. Simplify prompt composition in `analyzeVideoChunk`.
2. Avoid appending huge duplicated text blocks to `userPrompt`. Pass clean `knownTeams` and `knownPlayers` context into user turns without repeating system prompt rules.
3. Verify model parameter uses `gemini-3.5-flash-lite` (passed via configuration or environment variable `GEMINI_MODEL_NAME=gemini-3.5-flash-lite`).

---

### Step 6: Verification
1. Run build in `common`: `npm run build` inside `common/` or `npm run master:build` from root.
2. Run tests: `npm test` in `common/` or `worker/` if available.
3. Verify no TypeScript compilation errors exist across `common`, `api`, and `worker`.

---

## Checklist
- [x] Export `ALLOWED_EVENT_TYPES` and `EventType` in `common/src/constants/eventTypes.ts`
- [x] Export both from `common/src/index.ts` (already `export *`; verified)
- [x] Bind `common/src/constants/gemini.ts` (`EVENT_SCHEMA`) to `ALLOWED_EVENT_TYPES` (verified at runtime)
- [x] Remove duplicate/unneeded constant files in `api/src/constants/` (converted to re-exports; were dead code)
- [x] Update `system_instruction.md`, `first_chunk.md`, `subsequent_chunk.md`, `rulesets.md`, `coach_report.md`
- [x] Refactor `GeminiProvider.ts` prompt stitching (short conditional continuity note)
- [x] Set `GEMINI_MODEL_NAME=gemini-3.5-flash-lite` in configuration/environment references (local `.env*` + GH variable)
- [x] Execute builds to confirm clean compilation (`common`, `api`, `worker` build ✅, frontend `type-check` ✅)
