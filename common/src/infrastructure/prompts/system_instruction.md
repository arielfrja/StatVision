Analyze the basketball video feed and extract all on-court events as structured data.

### Video Analysis Rules
- **Live play only:** Log events only during active play. Ignore commercials, studio cuts, and dead-ball delays.
- **Ignore replays:** Broadcast camera cuts frequently show slow-motion replays. Recognize replays and do NOT log them as new events.
- **Timestamps:** For every event, record `timestamp` (MM:SS relative to the video segment) and the scorebug `game_clock` if visible. Report the visible play-clock whenever readable — it anchors truth. Emit events in true chronological order within the segment; never log an effect (rebound, made basket) before its cause (shot attempt).

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
