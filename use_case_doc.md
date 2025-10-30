# Use Case Document
## Project: "StatVision"

**Version:** 1.1
**Date:** October 18, 2025

---

### 1. Introduction
This document provides a detailed description of the user interactions with the StatVision system. It outlines the actors, their goals, and the step-by-step processes they follow to achieve those goals.

### 2. Actors
*   **Analyst:** This represents any user of the system (coach, player, scout). The Analyst's main goal is to transform raw video footage into actionable, interactive statistical data and to review this data on demand.

### 3. Use Case Specifications

#### UC-01: Manage Account
*   **Description:** Describes how an Analyst creates and manages their personal account.
*   **Actor:** Analyst
*   **Preconditions:** The Analyst has a device with a web browser.
*   **Main Success Scenario:**
    1.  The Analyst registers for a new account using an email and password.
    2.  The system creates the account and logs the Analyst in, displaying the main Dashboard.
    3.  On subsequent visits, the Analyst logs in with their credentials to access their Dashboard.
*   **Alternative Paths:** The system provides clear error messages for invalid data, existing emails, or incorrect login credentials.

#### UC-02: Manage Teams and Players
*   **Description:** Describes how an Analyst populates their account with teams and player rosters.
*   **Actor:** Analyst
*   **Preconditions:** The Analyst is logged into the system.
*   **Main Success Scenario:**
    1.  The Analyst navigates to the "My Players" section and creates a new Player record, providing timeless attributes (Name, Position, Height, Weight).
    2.  The Analyst navigates to the "My Teams" section and creates a new team by providing a name.
    3.  The Analyst assigns the Player to the Team, providing a **jersey number** and a **start date** for their tenure.
    4.  The saved roster is now available for future game assignments.
*   **Alternative Paths:** The system prevents the creation of players with duplicate jersey numbers within the same team.

#### UC-03: Analyze a New Game (End-to-End Workflow)
*   **Description:** The core workflow, covering video upload, processing, and data assignment.
*   **Actor:** Analyst
*   **Preconditions:** The Analyst is logged in and has a game video file.
*   **Main Success Scenario:**
    1.  The Analyst initiates the "Analyze New Game" process from the Dashboard.
    2.  The Analyst selects and uploads the video file. The system displays progress.
    3.  Upon successful upload, the game appears on the Dashboard with a `PROCESSING ⚙️` status.
    4.  **[System Action]** The system processes the video asynchronously, capturing granular event data (including spatial coordinates and temporal details) and calculating detailed materialized statistics. The system adheres to the **Statistical Flexibility Constraint**, ensuring the process completes even if only minimal event data is captured.
    5.  When complete, the game's status updates to `PENDING_ASSIGNMENT ✏️`.
    6.  The Analyst selects the game and enters the Assignment Screen.
    7.  The Analyst assigns the AI-identified teams to their pre-defined teams.
    8.  The system auto-fills player names based on jersey numbers. The Analyst corrects any discrepancies.
    9.  The Analyst finalizes the assignment. The system updates the game status to `COMPLETE ✅` and opens the Analysis Screen.
*   **Alternative Paths:** The system provides clear error states for failed uploads or processing errors.

#### UC-04: Review an Analyzed Game
*   **Description:** Describes how an Analyst accesses and interacts with a previously completed game analysis.
*   **Actor:** Analyst
*   **Preconditions:** The Analyst is logged in and has at least one game with `COMPLETE` status.
*   **Main Success Scenario:**
    1.  The Analyst logs in and views their Dashboard.
    2.  The Analyst locates and clicks on a game marked as `COMPLETE ✅`.
    3.  The system immediately loads the Analysis Screen for that game.
    4.  The screen displays the video player, Box Score, and interactive Play-by-Play feed.
    5.  The Analyst clicks on any event in the Play-by-Play list.
    6.  The video player automatically seeks to and plays the short clip corresponding to that event.
*   **Alternative Paths:** None. This is a direct, read-only workflow.
*   **Postconditions:** The Analyst has reviewed the desired game data. The game's state is unchanged and remains available for future review.