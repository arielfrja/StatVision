# 🏗️ Action Plan: StatVision Infrastructure Refactor & Stabilization

## 📑 Executive Summary
Our current architecture is experiencing silent failures (`14 UNAVAILABLE`), CPU starvation during FFMPEG chunking, and is draining our budget due to Pub/Sub "Pull" subscriptions preventing Cloud Run from scaling to zero. 

Additionally, as we scale to process 2-hour videos, our current sequential processing will hit Cloud Run timeouts and Gemini API rate limits.

**Our Goal:**
1. **Stabilize:** Fix the FFMPEG crashes and GCP connection drops.
2. **Cut Costs:** Scale strictly to $0 when idle by replacing Pub/Sub Pull with Google Cloud Tasks.
3. **Pave for Scale:** Implement a "Fan-Out" architecture that forces Gemini API compliance today (Free Tier), but allows us to process 2-hour videos in 3 minutes later without rewriting any code.

---

## 🏛 Architecture Shift: "Controlled Fan-Out"

We are moving from a single monolithic Worker triggered by Pub/Sub, to a **Two-Stage Worker system** orchestrated by **Google Cloud Tasks**.

1. **The Chunker:** Downloads the video, runs FFMPEG to split it into 2-minute chunks, uploads chunks to GCS, and queues each chunk as an independent Task.
2. **The Analyzer(s):** An HTTP endpoint triggered by Cloud Tasks. It processes a *single* chunk against the Gemini API and saves the result to Supabase.

---

## 🛠 Step-by-Step Implementation Guide

### Step 1: Sunset Pub/Sub Pull
Pub/Sub "Pull" subscriptions require a container to stay alive (and billable) 24/7 just to listen to an empty queue. 
* **Action:** Delete the Pub/Sub Pull subscription.
* **Why:** We will rely entirely on Google Cloud Tasks (push via HTTP) to wake up our Cloud Run containers only when work exists. Cloud Tasks' first 1 million tasks/month are free.

### Step 2: Fix FFMPEG Event Loop Starvation
**The Problem:** `ffmpeg` is a multi-threaded beast. It consumes 100% of the Cloud Run vCPUs, completely starving the Node.js event loop. Because Node.js is blocked, it fails to send heartbeat signals to GCP, resulting in dropped TLS/gRPC connections (`14 UNAVAILABLE`) and silent failures.

* **Action:** Update the Node.js FFMPEG spawn command to explicitly restrict thread usage.
* **Code Change:**
  ```javascript
  // Add the `-threads` flag to leave CPU room for Node.js
  const ffmpegArgs = [
    '-i', videoUrl,
    '-threads', '2', // ALWAYS leave at least 1-2 vCPUs free!
    // ... your existing chunking args (e.g., -f segment -segment_time 120)
  ];
  ```

### Step 3: Implement Google Cloud Tasks (The Core Fix)
Once the Chunker finishes generating the chunks and uploading them to GCS, it should **not** loop through them to analyze them sequentially. Instead, it must push them into Cloud Tasks.

* **Action:** In your Node.js Chunker worker, use the `@google-cloud/tasks` SDK to create a task for *each* chunk.
* **Code Change:**
  ```javascript
  const { CloudTasksClient } = require('@google-cloud/tasks');
  const client = new CloudTasksClient();

  async function queueChunksForAnalysis(gameId, chunkIds) {
    const parent = client.queuePath('YOUR_PROJECT', 'YOUR_REGION', 'analyze-queue');
    
    for (const chunkId of chunkIds) {
      const task = {
        httpRequest: {
          httpMethod: 'POST',
          url: 'https://your-worker-url.run.app/api/analyze-chunk',
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(JSON.stringify({ gameId, chunkId })).toString('base64'),
        },
      };
      await client.createTask({ parent, task });
    }
  }
  ```

### Step 4: Configure the "Budget-Saver" Queue Limits
This is the most critical step for the DevOps/Infra team. We must configure Cloud Tasks to act as a strict bottleneck to protect our budget and prevent Gemini Free Tier rate limits (`429 Too Many Requests`).

* **Action:** Run this `gcloud` command to create the queue with strict rate limits:
  ```bash
  gcloud tasks queues create analyze-queue \
    --max-concurrent-dispatches=2 \
    --max-dispatches-per-second=0.2
  ```
* **Why:**
  * `--max-dispatches-per-second=0.2`: Means exactly 1 task every 5 seconds (12 per minute). This ensures we stay comfortably under Gemini's 15 Requests Per Minute limit.
  * `--max-concurrent-dispatches=2`: Ensures Cloud Run only spins up a maximum of 2 containers at once. This keeps our compute bill extremely low.

### Step 5: The Analyzer Endpoint & Completion Logic
Create a new Express route (or Next.js API route) to handle the incoming Cloud Tasks.

* **Action:** Create `POST /api/analyze-chunk`.
* **Logic Requirements:**
  1. **Idempotency:** Cloud Tasks requires endpoints to return a `20X` status code. If Gemini fails, return a `500`. Cloud Tasks will automatically apply exponential backoff and retry that specific chunk later.
  2. **Aggregation:** How do we know the game is done? 
     * In the Supabase `games` table, maintain `total_chunks` and `completed_chunks`.
     * Upon saving a chunk's analysis, perform an atomic increment: `UPDATE games SET completed_chunks = completed_chunks + 1 WHERE id = gameId`.
     * If `completed_chunks == total_chunks`, update the game status to `COMPLETED` and notify the frontend.

---

## 🚀 Future-Proofing (How we scale later)
The beauty of this architecture is that it is 100% ready for Enterprise scale **without any code rewrites**. 

When we transition to a paid Gemini plan and have high user volume, the dev team will **not** need to touch the codebase. Infra simply runs one command to open the floodgates:

```bash
# Example: Future scale-up command
gcloud tasks queues update analyze-queue \
  --max-concurrent-dispatches=100 \
  --max-dispatches-per-second=50
```
*Result:* A 2-hour video uploads, the Chunker queues 60 chunks, Cloud Tasks instantly dispatches all 60 tasks, Cloud Run spins up 60 parallel containers, and the entire 2-hour game is processed in ~3 minutes.
