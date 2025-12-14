The system has a built-in mechanism to retry processing individual video chunks. When the main orchestrator runs, it checks the status of each chunk. If a chunk is not marked as `COMPLETED`, `AWAITING_ANALYSIS`, or `ANALYZING`, the orchestrator will attempt to re-process it.

However, the problem is that once a job is marked as `FAILED`, the system considers it to be in a terminal state and will not automatically try to resume or restart it.

To make the worker retry the failed job, you need to do two things:

1.  **Reset the Job's Status**: You need to manually change the status of the main job in the database from `FAILED` to `PENDING`. This will make the system see it as a job that hasn't been completed yet.

2.  **Re-trigger the Job**: You need to send a new message to the `video-upload-events-sub` Pub/Sub topic. This message should contain the `gameId` and `filePath` of the job you want to retry.

When the worker receives this new message, it will look for an existing job with that `gameId` and `filePath`. It will find the job (which you've reset to `PENDING`) and kick off the orchestration process again. The orchestrator will then go through all the chunks, and when it finds the one that previously failed, it will re-process it.

This is a manual process that requires direct access to the database and the ability to publish Pub/Sub messages.

Would you like me to add a new feature that would make retrying a job easier, for example by calling a single command?
