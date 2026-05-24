This is a 2-minute segment of the game. Your objective is to extract all on-court events.

### 1. IDENTITY MAPPING
*   **Team IDs:** Use `TEMP_TEAM_1` and `TEMP_TEAM_2` consistently based on the identity instructions.
*   **Player IDs:** Use `TEMP_PLAYER_<jersey_number>` (e.g., `TEMP_PLAYER_23`). If the jersey is not visible, use "TEMP_TEAM_[COLOR]_UNKNOWN_1" consistently for that player.

### 2. SEGMENT & OVERLAP LOGIC
*   **Overlaps:** This segment overlaps with others. If an event occurs during the 10-second overlap at the start, log it completely anyway. Do not skip it.
*   **Mid-play Cutoffs:** If the segment ends mid-play (e.g., a shot is in the air), log the `SHOT` with `result: null`. Do not guess or extrapolate.

### 3. OUTPUT FORMAT
Output EXCLUSIVELY as a valid JSON array of objects. No intro/outro.

[
  {
    "video_timestamp": "HH:MM:SS",
    "game_clock": "MM:SS",
    "quarter": 1 | 2 | 3 | 4 | "OT",
    "team": "TEMP_TEAM_1" | "TEMP_TEAM_2",
    "player_jersey": "STRING",
    "event_type": "SHOT | REBOUND | ASSIST | TURNOVER | STEAL | BLOCK | FOUL | SUB | TIMEOUT",
    "details": {
      "subtype": "STRING",
      "execution": "STRING | null",
      "result": "MADE | MISSED | null",
      "associated_player_jersey": "STRING | null"
    },
    "xCoord": 0-100,
    "yCoord": 0-100,
    "confidence": "HIGH" | "MEDIUM"
  }
]
