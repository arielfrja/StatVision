This is the first segment of the game video. Your objective is to initialize the roster and extract all on-court events.

### 1. IDENTITY MAPPING
*   **Team IDs:** Use `TEMP_TEAM_1` and `TEMP_TEAM_2`. Assign them based on jersey color or position (e.g., TEAM_1 = Red, TEAM_2 = White).
*   **Team Names:** If you cannot see a formal team name, use the placeholder format: `<Team 1>` or `<Team 2>`.
*   **Player IDs:** Use `TEMP_PLAYER_<jersey_number>` (e.g., `TEMP_PLAYER_23`).
*   **Player Names:** If name is unknown, use the format: `<Player #XX>`. Do not put physical traits in the name.

### 2. SEGMENT & OVERLAP LOGIC
*   **Temporal Start:** This is the beginning of the video. Look for the Tip-off or initial possession.
*   **Mid-play Cutoffs:** If the segment ends mid-play (e.g., a shot is in the air), log the `SHOT` with `isSuccessful: null`.

### 3. OUTPUT FORMAT
Output EXCLUSIVELY as a valid JSON object matching this structure:

{
  "identifiedTeams": [
    {
      "id": "TEMP_TEAM_1",
      "name": "<Team 1>",
      "color": "COLOR",
      "type": "HOME",
      "description": "Short physical description",
      "players": [
        { "id": "TEMP_PLAYER_5", "number": 5, "name": "<Player #5>", "description": "Short trait" }
      ]
    }
  ],
  "events": [
    {
      "eventType": "SHOT | REBOUND | ASSIST | TURNOVER | STEAL | BLOCK | FOUL | SUB | TIMEOUT",
      "eventSubType": "STRING | null",
      "timestamp": "MM:SS",
      "isSuccessful": true | false | null,
      "period": 1,
      "assignedPlayerId": "TEMP_PLAYER_5",
      "assignedTeamId": "TEMP_TEAM_1",
      "xCoord": 0-100,
      "yCoord": 0-100
    }
  ]
}
