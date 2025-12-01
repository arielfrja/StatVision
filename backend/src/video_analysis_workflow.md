Of course. Here is a more granular, detailed breakdown of the StatVision video analysis workflow, including the exact prompts used to communicate with the Gemini model.

### **High-Level Architecture**

The system is a decoupled microservice composed of several specialized services that communicate through Google Cloud Pub/Sub message queues. This design allows for robust, scalable, and non-blocking processing of resource-intensive video analysis tasks. The state of each job and its constituent parts is tracked in a relational database using TypeORM entities (`VideoAnalysisJob`, `Chunk`).

---

### **The Detailed 5-Stage Workflow**

#### **Stage 1: Job Initiation & Orchestration**

This stage is the entry point for the entire analysis pipeline, managed by the `VideoOrchestratorService`.

1.  **Trigger**: The service listens to the `video-upload-events-sub` Pub/Sub subscription. When a video is uploaded via the main API, a message is published to this subscription containing: `{ "gameId": "...", "filePath": "...", "userId": "..." }`.
2.  **Job Creation**: Upon receiving a message, the service uses the `VideoAnalysisJobRepository` to query the database.
    *   If a job for this `gameId` and `filePath` already exists and is in a terminal state (`COMPLETED` or `FAILED`), the message is acknowledged and ignored.
    *   If no job exists, a new `VideoAnalysisJob` entity is created with its `status` set to `PENDING`.
3.  **State Transition**: The job's status is immediately updated from `PENDING` to `PROCESSING`, and a `processingHeartbeatAt` timestamp is set. This marks the job as active and prevents other workers from picking it up.

#### **Stage 2: Video Splitting (Chunking)**

The source video is sliced into smaller, overlapping segments by the `VideoChunkerService`.

1.  **Metadata Analysis**: The service first shells out to `ffprobe` to get the video's precise `duration` and `frameRate`.
2.  **Chunk Calculation**: It calculates the total number of chunks required based on configuration parameters from `workerConfig` (`chunkDurationSeconds` and `chunkOverlapSeconds`).
3.  **FFmpeg Execution**: For each segment, the service spawns an `ffmpeg` process using the `createSingleChunk` method. The command is constructed with specific arguments for efficiency and quality:
    ```bash
    ffmpeg -y -v quiet -stats \
           -ss [startTime] -i [inputFilePath] -t [chunkDuration] \
           -vf "scale=1280:-1,fps=15" \
           -c:v libx264 -preset veryfast -crf 23 -c:a aac \
           [outputChunkPath.mp4]
    ```
4.  **Database & State Management**:
    *   As the chunking process begins for a segment, a corresponding `Chunk` entity is created in the database via the `ChunkRepository` with its `status` set to `CHUNKING`.
    *   Once `ffmpeg` successfully creates the `.mp4` file for the chunk, the `Chunk` entity is updated: its `status` is set to `AWAITING_ANALYSIS`, and the `chunkPath` is saved.
5.  **Publishing Chunk Jobs**: With the chunk file ready and its database record updated, the `VideoOrchestratorService` publishes a new message to the `chunk-analysis` topic. This message contains the `{ "jobId": "...", "chunkId": "..." }`, queuing it up for the next stage.

#### **Stage 3: AI-Powered Chunk Analysis**

This is the core intelligence stage, managed by the `ChunkProcessorWorker` and the `GeminiAnalysisService`.

1.  **Worker Task**: The `ChunkProcessorWorker` listens to the `chunk-analysis` subscription. When it receives a message, it fetches the `Chunk` and `VideoAnalysisJob` entities from the database.
2.  **State Transition**: It updates the `Chunk` status to `ANALYZING`.
3.  **Gemini Communication**: The worker then calls the `GeminiAnalysisService`, which handles all interactions with the Google Gemini API.
    *   **File Upload**: The chunk's video file (e.g., `enhanced-chunk-0-video-123.mp4`) is uploaded to the Gemini File API. The service then polls the API until the file's status becomes `ACTIVE`.
    *   **Dynamic Prompt Construction**: The service constructs a precise, multi-part prompt. This is the exact instruction sent to the model:

        **Base Prompt (sent with every request):**
        ```
        You are an expert basketball analyst. Your task is to watch this video chunk, including its audio, and identify all significant gameplay events. For each event, provide its type, a brief description, and its timestamp relative to the start of this video chunk.

        Use audio cues to improve your analysis. A sharp whistle likely indicates a foul or a stoppage of play. The sound of the ball hitting the rim followed by cheers can help confirm if a shot was made. The sound of the ball bouncing can indicate possession.
        ```

        **Conditional Part 1: For the *first* chunk of a video:**
        If no teams or players have been identified yet (`identifiedTeams.length === 0`), this text is appended to the base prompt:
        ```
        Identify the two teams in this clip by their jersey colors and any other distinguishing features. Assign one team as 'TEAM_A' and the other as 'TEAM_B'. For players, identify them by jersey number if clear, otherwise by a brief physical description. Ensure consistent identification of teams and players throughout this chunk.
        ```

        **Conditional Part 2: For *subsequent* chunks:**
        If players and teams from previous chunks are known, this text is appended instead. It includes JSON data to provide context to the model:
        ```
        Identify players and teams using the following guidelines:
        - If identifiable, provide the jersey number (identifiedJerseyNumber) and team color (identifiedTeamColor).
        - If jersey number or team color are not clear, provide a brief physical description of the player (identifiedPlayerDescription, e.g., "tall player with red shoes", "player with a headband").
        - If team color is not clear, provide a brief description of the team (identifiedTeamDescription, e.g., "team in dark shirts", "team in light shirts").
        - Crucially, assign each player to either the 'HOME' or 'AWAY' team (assignedTeamType). Maintain this distinction consistently throughout the analysis.

        Prioritize jersey number and team color if available and clear. Ensure consistent descriptions for the same player/team across events within this video chunk.

        Known Teams from previous chunks: [{"id":"uuid-for-team-a","type":"HOME","color":"blue",...}]. Use this information to consistently identify teams and assign them as HOME or AWAY based on the established mapping.
        Known Players from previous chunks: [{"id":"uuid-for-player-1","teamId":"uuid-for-team-a","jerseyNumber":"10",...}]. Use this information to consistently identify players.
        ```

        **Final Part (sent with every request):**
        This part defines the required output format and constraints.
        ```
        The 'eventType' field must be one of the following exact values: Game Start, Period Start, Jump Ball, Jump Ball Possession, Possession Change, Shot Attempt, Shot Made, Shot Missed, 3PT Shot Attempt, 3PT Shot Made, 3PT Shot Missed, Free Throw Attempt, Free Throw Made, Free Throw Missed, Offensive Rebound, Defensive Rebound, Team Rebound, Assist, Steal, Block, Turnover, Personal Foul, Shooting Foul, Offensive Foul, Technical Foul, Flagrant Foul, Violation, Out of Bounds, Substitution, Timeout Taken, End of Period, End of Game. 

        Respond with a JSON array.
        ```
    *   **API Call**: The prompt and the URI of the active video file are sent to the Gemini model using `genAI.models.generateContent`.
    *   **Response Handling**: The service parses the JSON from the model's text response, cleaning up any markdown formatting (e.g., ` ```json `).
    *   **Cleanup**: The video file is deleted from the Gemini File API to manage resources.

#### **Stage 4: Event Processing and Deduplication**

The raw JSON from Gemini is refined into clean, unique game events by the `EventProcessorService`.

1.  **Timestamp Calculation**: The service iterates through each event from the AI. It calculates the `absoluteTimestamp` by adding the chunk's `startTime` to the timestamp provided by the AI (which is relative to the chunk).
2.  **Consistent ID Generation**: For any identified player or team, it generates a deterministic UUID using `uuidv5`. The UUID is created from a namespace and a key like `"HOME-blue"` or `"AWAY-12"`. This ensures the same player or team always gets the same ID across the entire video.
3.  **Deduplication**: This is a critical step to handle the overlapping video chunks. A unique key, `eventUniqueKey`, is generated for each potential event:
    ```javascript
    const timeWindow = Math.floor(absoluteEventTimestamp / 5); // Groups events into 5-second buckets
    const eventUniqueKey = `${gameEventData.eventType}-${timeWindow}-${assignedPlayerId || assignedTeamId || ''}`;
    ```
    This key is checked against a `Set` (`processedEventKeys`) containing all keys from previously processed chunks for this job. If the key exists, the event is a duplicate from an overlap and is discarded. Otherwise, it is added to the final list, and its key is added to the `Set`.
4.  **Database Update**: The `ChunkProcessorWorker` takes the resulting list of unique `ProcessedGameEvent`s and the updated lists of `IdentifiedPlayer`s and `IdentifiedTeam`s, and merges them into the main `VideoAnalysisJob` JSONB columns in the database.
5.  **State Transition**: Finally, the `Chunk`'s status is updated to `COMPLETED`.

#### **Stage 5: Job Finalization, Notification & Cleanup**

The `JobFinalizerService` determines the job's final outcome.

1.  **Trigger**: This service is called by the `ChunkProcessorWorker` after it finishes processing a chunk.
2.  **Status Aggregation**: It queries the database for all `Chunk` entities associated with the `jobId`.
    *   If **all chunks** now have a `COMPLETED` status, the `VideoAnalysisJob` status is updated to `COMPLETED`.
    *   If **any chunk** has a `FAILED` status, the entire `VideoAnalysisJob` is marked as `FAILED`.
3.  **Publishing Final Results**: Once the job is in a terminal state, the finalizer publishes a message to the `video-analysis-results` topic. This message contains the `jobId`, final `status`, and the complete array of `processedEvents`. The main API subscribes to this topic to receive the results and present them to the user.
4.  **Resource Cleanup**: The service calls `videoChunkerService.cleanupChunks`, providing the paths of all temporary chunk files, which are then deleted from the server's filesystem.
