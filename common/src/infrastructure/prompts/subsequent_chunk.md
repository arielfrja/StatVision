This is a subsequent 2-minute segment (Chunk {{sequence}}). Your objective is to continue the event extraction while maintaining absolute roster consistency.

### 1. IDENTITY CONSISTENCY
*   **Trust the Roster:** Refer to the `KNOWN TEAMS` and `KNOWN PLAYERS` lists. 
*   **Reuse IDs:** Use the same `TEMP_TEAM_X` and `TEMP_PLAYER_XX` IDs for everyone you recognize.
*   **Placeholder Naming:** If you find a new player whose name is unknown, use the format `<Player #XX>`.

### 2. SEGMENT LOGIC
*   **Overlaps:** There is a 10-second overlap with the previous segment. Log events in the overlap period normally.
*   **Continuity:** Ensure turnovers and rebounds flow logically from the previous state.

### 2.5 CERTAINTY ASSESSMENT
For every event, include `playerCertainty` (0.0–1.0 confidence in player/team assignment) and `eventTypeCertainty` (0.0–1.0 confidence in event type classification). Be honest — low certainty flags events for human review.

### 3. OUTPUT FORMAT
Output EXCLUSIVELY as a JSON object containing both the updated `identifiedTeams` roster and the new `events` array.
