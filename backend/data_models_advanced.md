# Advanced Data Model Specification (v2.0)

This document details the advanced data model designed to support professional-level basketball analytics, spatial data, and flexible statistical capture (adhering to the Statistical Flexibility Constraint).

The core change is the introduction of the `PlayerTeamHistory` junction table and the expansion of fields in `Game`, `GameEvent`, and the materialized statistics tables.

## 1. Entity: Player (Timeless Attributes)

The `Player` entity now stores only timeless, personal attributes. The relationship to a team and jersey number is moved to `PlayerTeamHistory`.

| Field | Type | Description | Rationale |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Internal primary key. | |
| `name` | `string` | Player's full name. | |
| **`position`** | `enum` | Player's primary position (e.g., PG, SG, SF, PF, C). | Enables role-based analysis. |
| **`height`** | `number` | Player height in centimeters. | Physical attribute for scouting/comparison. |
| **`weight`** | `number` | Player weight in kilograms. | Physical attribute for scouting/comparison. |
| **`isActive`** | `boolean` | Whether the player is currently active. | Roster management. |

## 2. Entity: PlayerTeamHistory (Roster Management)

This new junction table manages the many-to-many relationship between Players and Teams over time, allowing a player to have different jersey numbers on different teams or across different tenures.

| Field | Type | Description | Rationale |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Internal primary key. | |
| `playerId` | `UUID` | Foreign key to the Player. | |
| `teamId` | `UUID` | Foreign key to the Team. | |
| **`jerseyNumber`** | `number` | Player's jersey number for this specific team tenure. | Jersey numbers can change per team/season. |
| **`startDate`** | `Date` | Date the player joined the team. | Tracks tenure. |
| **`endDate`** | `Date` | Date the player left the team (nullable if currently on team). | Tracks tenure. |

## 3. Entity: Game (Metadata and Assignment)

The `Game` entity is expanded to include essential metadata and uses clearer terminology for team assignment (`homeTeam`/`awayTeam`).

| Field | Type | Description | Rationale |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Internal primary key. | |
| `userId` | `UUID` | Foreign key to the User who owns this game record. | |
| `status` | `enum` | Processing status (e.g., UPLOADED, ANALYZING, COMPLETE). | |
| `videoUrl` | `string` | Path or URL to the source video file. | |
| **`gameDate`** | `Date` | Actual date and time the game was played. | Essential for historical reporting. |
| **`location`** | `string` | Location where the game was played. | Contextual data. |
| **`opponentName`** | `string` | Name of the opposing team if not tracked as a full Team entity. | Flexibility for untracked opponents. |
| **`quarterDuration`** | `number` | Length of a quarter/period in minutes. | Used for time-based metrics. |
| **`homeTeamId`** | `UUID` | Foreign key to the home Team. | Clearer role assignment. |
| **`awayTeamId`** | `UUID` | Foreign key to the away Team. | Clearer role assignment. |

## 4. Entity: GameEvent (Granular and Spatial Data)

This is the source of truth for all statistics, now capturing spatial and temporal context.

| Field | Type | Description | Rationale |
| :--- | :--- | :--- | :--- |
| `gameId` | `UUID` | Foreign key to the Game. | |
| `eventType` | `enum` | High-level event type (e.g., Shot, Rebound). | |
| **`eventSubType`** | `enum` | Specific event classification (e.g., Jump Shot, Offensive Foul). | Enables granular analysis. |
| **`period`** | `number` | Quarter or period number. | Temporal context. |
| **`timeRemaining`** | `number` | Time remaining in the current period (in seconds). | Situational analysis (e.g., clutch time). |
| **`x_coord`** | `number` | X-coordinate of the event location (e.g., 0-100 scale). | Enables shot charts and spatial analysis. |
| **`y_coord`** | `number` | Y-coordinate of the event location. | Enables shot charts and spatial analysis. |
| **`isSuccessful`** | `boolean` | Whether the event was successful (e.g., shot made). | Direct success tracking. |
| **`relatedEventId`** | `UUID` | Links events (e.g., the pass that led to a shot). | Tracks assists and sequences. |
| **`onCourtPlayerIds`** | `Array<UUID>` | List of player IDs on the court for the acting team. | Enables lineup analysis. |
| `eventDetails` | `JSONB` | Flexible field for any extra data. | Backwards compatibility and custom data. |

## 5. Materialized Stats Entities (`GameTeamStats` / `GamePlayerStats`)

These entities are expanded to include all standard box score and efficiency metrics.

| Field | Type | Description | Rationale |
| :--- | :--- | :--- | :--- |
| `points`, `assists` | `number` | Core stats. | |
| **`offensiveRebounds`** | `number` | Separated from defensive rebounds. | Enables advanced rebounding metrics. |
| **`defensiveRebounds`** | `number` | Separated from offensive rebounds. | Enables advanced rebounding metrics. |
| **`fieldGoalsMade/Attempted`** | `number` | Standard shooting metrics. | |
| **`threePointersMade/Attempted`** | `number` | Three-point shooting metrics. | |
| **`freeThrowsMade/Attempted`** | `number` | Free throw metrics. | |
| **`steals`, `blocks`, `turnovers`, `fouls`** | `number` | Defensive and efficiency metrics. | |
| **`effectiveFieldGoalPercentage`** | `number` | Calculated eFG%. | Advanced efficiency metric. |
| **`trueShootingPercentage`** | `number` | Calculated TS%. | Advanced efficiency metric. |
| **`minutesPlayed`** (Player only) | `number` | Total minutes the player was on the court. | Player usage metric. |
| **`plusMinus`** (Player only) | `number` | Player's on-court point differential. | Player impact metric. |

## Full JSON Schema Reference

```json
{
  "User": {
    "description": "Core user entity linked to the authentication provider.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "providerUid", "type": "string", "description": "Unique ID from an auth provider (e.g., Auth0, Firebase)."},
      {"name": "createdAt", "type": "Date", "description": "Record creation timestamp."}
    ]
  },
  "Team": {
    "description": "Represents a single basketball team, including its metadata.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "userId", "type": "UUID", "description": "Foreign key to the User who owns this team record."},
      {"name": "name", "type": "string", "description": "Full team name."}
    ]
  },
  "Player": {
    "description": "Represents an individual player's timeless attributes.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "name", "type": "string", "description": "Player's full name."},
      {"name": "position", "type": "enum", "description": "Player's primary position (e.g., PG, SG, SF, PF, C)."},
      {"name": "height", "type": "number", "description": "Player height in centimeters."},
      {"name": "weight", "type": "number", "description": "Player weight in kilograms."},
      {"name": "isActive", "type": "boolean", "description": "Whether the player is currently active."}
    ]
  },
  "PlayerTeamHistory": {
    "description": "Junction table to manage the many-to-many relationship between Players and Teams over time.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "playerId", "type": "UUID", "description": "Foreign key to the Player."},
      {"name": "teamId", "type": "UUID", "description": "Foreign key to the Team."},
      {"name": "jerseyNumber", "type": "number", "description": "Player's jersey number for this specific team tenure."},
      {"name": "startDate", "type": "Date", "description": "Date the player joined the team."},
      {"name": "endDate", "type": "Date", "description": "Date the player left the team (nullable if currently on team)."}
    ]
  },
  "Game": {
    "description": "Metadata for a single game analysis session.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "userId", "type": "UUID", "description": "Foreign key to the User who owns this game record."},
      {"name": "status", "type": "enum", "description": "Processing status (e.g., UPLOADED, ANALYZING, COMPLETE, FAILED)."},
      {"name": "videoUrl", "type": "string", "description": "Path or URL to the source video file."},
      {"name": "gameDate", "type": "Date", "description": "Actual date and time the game was played."},
      {"name": "location", "type": "string", "description": "Location where the game was played."},
      {"name": "opponentName", "type": "string", "description": "Name of the opposing team if they are not tracked as a full Team entity in the system."},
      {"name": "quarterDuration", "type": "number", "description": "Length of a quarter/period in minutes."},
      {"name": "homeTeamId", "type": "UUID", "description": "Foreign key to the home Team."},
      {"name": "awayTeamId", "type": "UUID", "description": "Foreign key to the away Team (nullable for games against untracked opponents)."}
    ]
  },
  "GameEvent": {
    "description": "Raw, granular event data extracted from video analysis. This is the source of truth for all stats.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "gameId", "type": "UUID", "description": "Foreign key to the Game."},
      {"name": "teamId", "type": "UUID", "description": "Team responsible for the event."},
      {"name": "playerId", "type": "UUID", "description": "Player responsible for the event (nullable)."},
      {"name": "eventType", "type": "enum", "description": "High-level event type from a fixed list (e.g., Shot, Rebound, Turnover)."},
      {"name": "eventSubType", "type": "enum", "description": "Specific event classification from a fixed list (e.g., Jump Shot, Offensive Foul)."},
      {"name": "absoluteTimestamp", "type": "number", "description": "Time in seconds from the start of the video."},
      {"name": "period", "type": "number", "description": "Quarter or period number."},
      {"name": "timeRemaining", "type": "number", "description": "Time remaining in the current period in seconds."},
      {"name": "x_coord", "type": "number", "description": "X-coordinate of the event location (0-100 scale)."},
      {"name": "y_coord", "type": "number", "description": "Y-coordinate of the event location (0-100 scale)."},
      {"name": "isSuccessful", "type": "boolean", "description": "Whether the event was successful (e.g., shot made)."},
      {"name": "relatedEventId", "type": "UUID", "description": "Links to another event (e.g., the pass that led to a shot for an assist)."},
      {"name": "onCourtPlayerIds", "type": "Array<UUID>", "description": "List of player IDs on the court for the acting team when the event occurred. Enables lineup analysis."},
      {"name": "eventDetails", "type": "JSONB", "description": "Flexible field for any extra data."}
    ]
  },
  "GameTeamStats": {
    "description": "Materialized box score statistics aggregated per team per game for fast lookups.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "gameId", "type": "UUID", "description": "Foreign key to the Game."},
      {"name": "teamId", "type": "UUID", "description": "Foreign key to the Team."},
      {"name": "points", "type": "number", "description": "Total points scored."},
      {"name": "assists", "type": "number", "description": "Total assists."},
      {"name": "offensiveRebounds", "type": "number", "description": "Total offensive rebounds."},
      {"name": "defensiveRebounds", "type": "number", "description": "Total defensive rebounds."},
      {"name": "fieldGoalsMade", "type": "number", "description": "Field goals made."},
      {"name": "fieldGoalsAttempted", "type": "number", "description": "Field goals attempted."},
      {"name": "threePointersMade", "type": "number", "description": "Three-pointers made."},
      {"name": "threePointersAttempted", "type": "number", "description": "Three-pointers attempted."},
      {"name": "freeThrowsMade", "type": "number", "description": "Free throws made."},
      {"name": "freeThrowsAttempted", "type": "number", "description": "Free throws attempted."},
      {"name": "steals", "type": "number", "description": "Total steals."},
      {"name": "blocks", "type": "number", "description": "Total blocks."},
      {"name": "turnovers", "type": "number", "description": "Total turnovers."},
      {"name": "fouls", "type": "number", "description": "Total fouls."},
      {"name": "effectiveFieldGoalPercentage", "type": "number", "description": "Calculated eFG% for the team."},
      {"name": "trueShootingPercentage", "type": "number", "description": "Calculated TS% for the team."},
      {"name": "details", "type": "JSONB", "description": "For future or custom stats."}
    ]
  },
  "GamePlayerStats": {
    "description": "Materialized box score statistics aggregated per player per game for fast lookups.",
    "fields": [
      {"name": "id", "type": "UUID", "description": "Internal primary key."},
      {"name": "gameId", "type": "UUID", "description": "Foreign key to the Game."},
      {"name": "playerId", "type": "UUID", "description": "Foreign key to the Player."},
      {"name": "minutesPlayed", "type": "number", "description": "Total minutes the player was on the court."},
      {"name": "points", "type": "number", "description": "Total points scored."},
      {"name": "assists", "type": "number", "description": "Total assists."},
      {"name": "offensiveRebounds", "type": "number", "description": "Total offensive rebounds."},
      {"name": "defensiveRebounds", "type": "number", "description": "Total defensive rebounds."},
      {"name": "fieldGoalsMade", "type": "number", "description": "Field goals made."},
      {"name": "fieldGoalsAttempted", "type": "number", "description": "Field goals attempted."},
      {"name": "threePointersMade", "type": "number", "description": "Three-pointers made."},
      {"name": "threePointersAttempted", "type": "number", "description": "Three-pointers attempted."},
      {"name": "freeThrowsMade", "type": "number", "description": "Free throws made."},
      {"name": "freeThrowsAttempted", "type": "number", "description": "Free throws attempted."},
      {"name": "steals", "type": "number", "description": "Total steals."},
      {"name": "blocks", "type": "number", "description": "Total blocks."},
      {"name": "turnovers", "type": "number", "description": "Total turnovers."},
      {"name": "fouls", "type": "number", "description": "Total fouls."},
      {"name": "plusMinus", "type": "number", "description": "Player's on-court point differential."},
      {"name": "effectiveFieldGoalPercentage", "type": "number", "description": "Calculated eFG% for the player."},
      {"name": "trueShootingPercentage", "type": "number", "description": "Calculated TS% for the player."},
      {"name": "details", "type": "JSONB", "description": "For future or custom stats."}
    ]
  }
}
```