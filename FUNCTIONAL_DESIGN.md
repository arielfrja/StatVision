# StatVision — Functional Design Specification

**Purpose:** This document describes the functional behavior, user interactions, and data flows for each screen in StatVision. Intended for UI/UX experts to design the visual interface.

---

## 1. Landing Page (`/`)

### Purpose
Public entry point before authentication.

### Functional Elements
- **Brand Identity:** App logo + "StatVision" name
- **Hero Section:** Tagline + value proposition
- **Feature Cards (3):** Automated Event Detection, Surgical Insights, Historical Tracking
- **CTAs:** "Get Started" (→ signup) and "Sign In" (→ login)
- **Footer:** Copyright

### User Flow
1. Unauthenticated user lands here
2. Clicks "Get Started" or "Sign In" → redirected to Auth0 login page
3. If already authenticated → auto-redirect to `/dashboard`

---

## 2. Authentication (`/login`)

### Purpose
Single sign-on via Auth0.

### Functional Elements
- Brand logo and "STATVISION" hero
- Loading states: "Accessing Stadium Gates" → "Finalizing Sync"
- Auto-redirect to Auth0 login dialog

### User Flow
1. User arrives at `/login`
2. If authenticated → redirect to `/dashboard`
3. If not → Auth0 login screen appears (hosted, not our UI)
4. On success → redirect back to `/dashboard`

---

## 3. Authenticated Layout (Shell)

### Purpose
Persistent navigation wrapper for all authenticated pages.

### Shell Components
- **AuthGuard:** Wraps all routes — redirects unauthenticated users to login
- **Side Navigation (desktop, fixed, 360px):** 6 nav items:

| Icon | Label | Route |
|------|-------|-------|
| dashboard | Performance | `/dashboard` |
| sports_basketball | Games | `/games` |
| groups | Teams | `/teams` |
| person | Players | `/players` |
| leaderboard | Analytics | `/stats` |
| data_usage | Usage | `/usage` |

- **Bottom Navigation (mobile):** Same items except "Players" omitted
- **Header (sticky top):** Brand logo + "Sign Out" button
- **Content Area:** Renders current page

### Behavior
- Active nav item highlighted based on current route
- Sign Out → Auth0 logout → redirect to landing page

---

## 4. Performance Dashboard (`/dashboard`)

### Purpose
At-a-glance view of the most recent game analysis. Entry point after login.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Circular progress spinner |
| **Empty (no games)** | Icon + "No Active Records" message + "Upload Game" CTA → `/games` |
| **Active (games exist)** | Full dashboard layout |

### Functional Sections

#### 4.1 Engine Status Banner
- Status indicator dot (pulsing when `PROCESSING`)
- Label: "ENGINE: ANALYZING" or "ENGINE: STANDBY"
- Active game title displayed

#### 4.2 Pending Upload Alert
- Shown when a game has `PENDING` status with an `uploadUrl`
- Title: "Unfinished Upload Detected"
- "Resume Stream" button → navigates to `/games?resume={gameId}`

#### 4.3 Video Preview Area
- 16:9 aspect ratio card
- If `videoUrl` exists: "Analytics Feed Ready" label + stream ID
- If no video: "No Active Video Stream" placeholder

#### 4.4 Job Progress Bar
- Only shown when game status is `PROCESSING`
- Fetches job progress from backend (polls)
- Shows progress percentage

#### 4.5 Recent Events Feed
- Last 8 events from active game, sorted by timestamp desc
- Each row: event type icon, event name, assigned player label, timestamp (MM:SS)
- Empty state: "Awaiting Engine Synchronization"

#### 4.6 Score Summary Card
- Home vs Away team scores (large monospace numbers)
- Visual progress bar for each team
- Empty state: "Syncing Scoreboard..."

#### 4.7 Engine Diagnostics
- Status indicators for: Inference, Cloud Storage, Metadata API
- Each with colored status label

#### 4.8 Navigation Card
- "Access Game Archive" → navigates to `/games`

---

## 5. Film Room — Games List (`/games`)

### Purpose
Browse, upload, and manage all game recordings.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Full-page circular progress |
| **Empty** | Dashed border drop-zone area + "The Vault is Empty" + "Start Analysis" button |
| **Upload Mode** | Full UploadForm replaces the list view |
| **List Mode** | Grid of game cards |

### Functional Sections

#### 5.1 Header
- Title: "Film Room" / subtitle: "Storage & Analysis Hub"
- "New Upload" button → toggles Upload Mode

#### 5.2 Game Cards (Grid)
Each card shows:
- **Header:** Upload date, Game type badge (FULL_COURT, 3x3, etc.), Status badge with icon + label, Delete button
- **Matchup:** Home team initial + name | "VS" | Away team initial + name
- **Game name** centered below matchup
- **Footer:** Event count + player stat count (when completed), or "Retry Upload" button (when failed)

#### 5.3 Game Status Definitions
| Status | Badge | Card Behavior |
|--------|-------|---------------|
| COMPLETED / ANALYZED | green check + "READY" | Clickable → game detail |
| PROCESSING | blue sync + "ANALYZING" | Clickable → game detail |
| FAILED | red error + "FAILED" | "Retry Upload" button |
| UPLOADED | gray cloud + "UPLOADED" | Clickable → game detail |
| ASSIGNMENT_PENDING | blue person + "IDENTITY" | Clickable → game detail |
| PENDING | blue upload + "DRAFT" | "Retry Upload" button |

#### 5.4 Upload Form (Upload Mode)

The upload action is a single-step process — selecting a file and optionally naming it, then clicking "Upload". The game record is created implicitly as part of the upload flow.

- **File Dropzone:** Click/drag to select video file (MP4, MOV, AVI)
- **Game Title Input:** Filled text field, auto-populated from filename
- **Upload Progress Bar:** Shows streaming progress + cloud finalization with percentage
- **Error Section:** Red alert with error message
- **Actions:** Cancel / Upload (or Resume Upload for interrupted sessions)

**Upload Flow (behind the scenes):**
1. Create game record via `POST /games` (automatic, no separate dialog)
2. Get signed upload URL via `GET /games/{id}/upload-url`
3. Upload video file (direct PUT, with Content-Range for resume support)
4. Confirm via `POST /games/{id}/upload-complete` (polls until confirmed)

**Resumable Upload:** Saves game ID, filename, and filesize to localStorage. If user navigates away and returns, they can pick the same file and resume from the last byte.

---

## 6. Game Analysis Detail (`/games/[gameId]`)

### Purpose
The core analysis workspace — video review, event verification, box scores, and coach reports.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Full-page circular progress |
| **Error** | "Error Loading Video Intelligence" + "Back to List" button |
| **Data Loaded** | Full analysis workspace |

### Functional Sections

#### 6.1 Scoreboard Header
- **Desktop:** Side-by-side layout (team blocks + score + metadata)
- **Mobile:** Stacked layout
- Home Team avatar + name | Score + "FINAL" label + game type | Away Team avatar + name
- **Metadata:** Game name, location (icon), date (icon)
- **Action Buttons:**
  - "Roster" button → opens Entity Assignment Modal
  - "Delete" button → confirmation dialog → permanently deletes game + video + all data

#### 6.2 Video Player
- 16:9 aspect ratio, black background
- "Live Analysis Feed" badge overlay (top-left, with pulsing red dot)
- Standard video controls (play/pause, seek, volume)
- Syncs current time with timeline and play-by-play

#### 6.3 Timeline Review
- Horizontal timeline bar showing all events as markers
- Markers positioned by `absoluteTimestamp / duration`
- Click marker → seek video + select event
- Current playback position as a moving indicator

#### 6.4 Job Progress Bar (when `PROCESSING`)
- Same as dashboard — polls for progress while video analyzes

#### 6.5 Desktop Tabs (below video — desktop only)
| Tab | Content |
|-----|---------|
| Box Score | Player stats table per team, with team totals |
| Identified Personnel | AI-detected teams + players, with sync status |
| Coach Report | AI-generated strategic analysis |

#### 6.6 Play-by-Play Feed (side panel — desktop, below — mobile)
- Scrollable chronological list of all game events
- Each row: icon (basketball, pan_tool, etc.), event type, assigned player, timestamp
- Click row → seek video to that moment
- Row actions:
  - Edit → opens Event Editor
  - Delete → confirmation dialog → removes event
  - Player assignment → immediate assign via dropdown

#### 6.7 Event Editor (replaces play-by-play panel when event selected)
- Shows full event details: type, subtype, success/fail, period, time remaining, court coordinates
- Team + Player assignment selectors (populated from roster)
- Save / Cancel buttons

#### 6.8 Box Score Table
- Tabular display of all player stats per team
- Default columns: FGM, 3PM, FTM, ORB, DRB, AST, STL, BLK, TOV, PF, PTS, +/-
- Team header row with totals

#### 6.9 Identified Personnel
- Lists AI-detected teams and players (temp) vs official roster (synced)
- Each entity: name, jersey number, description
- "Switch Team" action to reassign player
- Badges: "DETECTION GROUP" (temp) vs "OFFICIAL ROSTER" → "SYNCED"

#### 6.10 AI Coach Report
- Dropdown to select Home or Away team
- "Generate Report" button → POST to API → displays AI analysis
- Empty state: illustration + "Select a team and click Generate Report"

#### 6.11 Entity Assignment Modal (full-screen overlay)
- Triggered by "Roster" button in header
- Displays AI-detected temp teams + their players
- For each: dropdown selector to map → official team/player from roster
- "Synchronize Roster" button → submits mappings → triggers stat recalculation
- States: loading spinner, "No temporary detections requiring assignment" (empty)

---

## 7. Squad Management — Teams List (`/teams`)

### Purpose
Create and manage teams.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Full-page circular progress |
| **Empty** | "The Roster is Empty" + "Create Team" CTA |
| **List** | Grid of team cards |

### Functional Sections

#### 7.1 Header
- "Organization" label + "Squad Management" title
- "Create New Squad" button

#### 7.2 Team Cards
Each card shows:
- Team icon (shield = official, bolt = temp/park mode)
- Team name (large, bold, italic, uppercase)
- "Park Mode" badge if temp team
- Roster size count (player icon + number)
- "Active" indicator
- "Manage Roster" CTA → navigate to team detail
- Click card → navigate to `/teams/{teamId}`

#### 7.3 Create Team Dialog
- Modal with text input for team name
- "Confirm Squad" / "Cancel" buttons

---

## 8. Team Detail — Roster (`/teams/[teamId]`)

### Purpose
View, add, and remove players from a team.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Full-page circular progress |
| **Not Found** | "Squad Not Found" message |
| **Data Loaded** | Full roster view |

### Functional Sections

#### 8.1 Team Header
- Back button → `/teams`
- Team name + icon
- "Recruit Player" button → opens recruit dialog

#### 8.2 Active Roster List
- Each player row: person icon, player name, role/description, jersey number (#XX)
- "Delete" button per player → confirmation dialog

#### 8.3 Recruit Player Dialog
- Inputs: Full Name, Jersey # (number), Description / Role
- "Recruit Player" / "Cancel" buttons

#### 8.4 Release Player Dialog
- Confirmation: "Career stats will be preserved in the global registry"
- "Confirm Release" / "Cancel" buttons

#### 8.5 Sidebar Info Cards
- **Squad Intelligence:** AI analysis description (placeholder)
- **Season Performance:** Placeholder with "Waiting for Game Records" message

---

## 9. Players List (`/players`)

### Purpose
Browse all players across all teams with their aggregated career statistics.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Full-page progress spinner |
| **Empty** | "No Player Data" + "Recruit your first player from the Teams page" + CTA to `/teams` |
| **Data Loaded** | Player cards or table |

### Functional Elements

#### 9.1 Header
- "Player Registry" title
- Search/filter input (future: filter by team, position, name)
- Sort controls (future: sort by name, PTS, team)

#### 9.2 Player Cards / Table
Each player entry shows:

**Player Info:**
- Player name (bold)
- Jersey number (#XX)
- Current team name
- Position (PG, SG, SF, PF, C)
- Status: Active / Inactive

**Aggregated Career Stats** (computed from `GamePlayerStats` across all completed games):
- Games Played (GP)
- Points per Game (PPG)
- Total Points (PTS)
- Assists (AST)
- Rebounds (REB = offensive + defensive)
- Field Goal Percentage (FG%)
- Three-Point Percentage (3P%)
- Free Throw Percentage (FT%)
- Plus/Minus (+/-)

#### 9.3 Data Source
- Fetched via `GET /players` → returns `PlayerTeamHistory[]` with nested `Player` and `Team`
- Aggregated stats computed server-side from `GamePlayerStats` per player across all games
- Click on player row → navigate to `/players/[playerId]`

#### 9.4 Empty State
- Icon + "No Player Data" message
- "Teams are where players are born. Go recruit your first player."
- "Go to Teams" CTA button → `/teams`

---

## 10. Player Profile (`/players/[playerId]`)

### Purpose
View individual player information and career highlights.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Full-page circular progress |
| **Not Found** | "Player Not Found" + "Return to Roster" |
| **Data Loaded** | Full player profile |

### Functional Sections

#### 10.1 Player Hero
- Large circular avatar (initial)
- Player name (large, uppercase, bold)
- Jersey number (#XX)
- Position badge
- "Active" status label
- Back button → previous page

#### 10.2 Highlights Archive (future)
- Empty state: "No analyzed game clips found for this player profile"
- Future: list of AI-generated video highlight clips for this player

#### 10.3 AI Scout Sidebar
- Placeholder narrative about monitoring player performance
- "Skill distribution and efficiency pulse will be generated as more events are recorded"

---

## 11. Usage & Credits (`/usage`)

### Purpose
Monitor AI resource consumption and costs.

### States
| State | Behavior |
|-------|----------|
| **Loading** | Circular progress |

### Functional Sections

#### 11.1 Header
- "RESOURCE MONITOR" label
- Title: "AI Usage & Credits"
- Period selector: [7d] [30d] [90d]

#### 11.2 Stats Overview Cards
- **Total Tokens:** Monospace count, "Consumption for current period"
- **Video Processed:** Minutes, "Total analysis duration"
- **Estimated Value:** Dollar cost based on token pricing

#### 11.3 Daily Token Consumption Chart
- Area chart using Recharts
- X-axis: date, Y-axis: token count
- Gradient fill, tooltip on hover

#### 11.4 Video Throughput Chart
- Bar chart showing video seconds per day

#### 11.5 Usage Policies
- Standard Rate, Quota Limit, Video Cap — key-value list

#### 11.6 Optimization Advisory
- Tip about using `JERSEY_COLORS` identity mode for lower token usage
- "View Optimization Guide" CTA button

---

## 12. Cross-Cutting Functional Concerns

### 12.1 Authentication & Authorization
- Auth0 SSO integration
- `AuthGuard` wraps all authenticated routes
- Token-based API auth via `getAccessTokenSilently()`

### 12.2 Data Fetching
- SWR-based with automatic revalidation
- Loading: `<md-circular-progress>`
- Errors: inline messages with optional retry
- Empty: contextual messaging with CTAs

### 12.3 Responsive Layout
- **Desktop (≥1024px):** Side nav visible, horizontal split in analysis view
- **Mobile (<1024px):** Bottom nav bar, stacked layout, collapsible tabs

### 12.4 Upload Resilience
- Interrupted uploads resume from last byte (Content-Range)
- Upload session persisted to localStorage (gameId, filename, filesize)
- Game record created automatically as part of upload, not a separate step

### 12.5 Human-in-the-Loop Entity Assignment
1. AI detects events with identified jersey numbers and team colors
2. Game enters `ASSIGNMENT_PENDING` status
3. User opens Entity Assignment Modal from game detail
4. User maps temp detections → official roster
5. Mappings submitted → stats recalculated → game moves to `COMPLETED`

### 12.6 Video Processing Lifecycle
```
PENDING → UPLOADED → PROCESSING → (ASSIGNMENT_PENDING →) COMPLETED | FAILED
```
- Jobs progress checked via polling (3s interval during processing)
