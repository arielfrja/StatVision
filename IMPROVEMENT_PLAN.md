# StatVision Worker: Gemini API Integration Improvements

## 1. Executive Summary

This document outlines a detailed plan to enhance the StatVision video analysis worker. The current worker provides a strong, decoupled architectural foundation. The following improvements focus on maximizing the quality of the Gemini API's output by increasing its **robustness, consistency, and adherence to best practices.**

We will implement two primary initiatives:
1.  **Structured Outputs:** To guarantee valid, machine-readable data from the API and eliminate parsing errors.
2.  **Thought Signatures:** To create a stateful, sequential analysis that maintains context and consistency across video chunks.

These changes will be supported by enhanced **Prompt Engineering** techniques, such as few-shot examples, to further guide the model. This plan prioritizes the generation of high-quality, consistent data, which is paramount for sports analytics.

---

## 2. Initiative 1: Implement Structured Outputs for Robustness

### 2.1 The Problem
Currently, the `GeminiAnalysisService` asks the model for a JSON string and then parses it using `JSON.parse()`. This approach is fragile and can fail if the model returns slightly malformed JSON, adds explanatory text, or uses markdown code blocks.

### 2.2 The Solution
We will use the Gemini API's **Structured Output** feature. This allows us to define a JSON schema for the data we need. The API then guarantees that its response will be a valid JSON object matching this schema, completely eliminating the need for manual string cleaning and parsing.

### 2.3 Implementation Plan

**Step 1: Define the Tool Schema**

In `backend/src/worker/GeminiAnalysisService.ts`, we will define the schema for the function call tool.

```typescript
// backend/src/worker/GeminiAnalysisService.ts

const GameAnalysisTool = {
    name: 'record_game_events',
    description: 'Records all identified basketball game events from the video chunk.',
    parameters: {
        type: 'object',
        properties: {
            events: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        eventType: { type: 'string', description: 'Type of the gameplay event from the allowed list.' },
                        timestamp: { type: 'string', description: 'Timestamp of the event in MM:SS format relative to this video chunk.' },
                        description: { type: 'string', description: 'A brief text description of what occurred.' },
                        isSuccessful: { type: 'boolean', description: 'For events like shots, indicates if it was successful.' },
                        identifiedJerseyNumber: { type: 'string', description: 'Jersey number of the key player in the event.' },
                        identifiedTeamColor: { type: 'string', description: 'Jersey color of the team involved.' },
                        assignedTeamType: { type: 'string', enum: ['HOME', 'AWAY'], description: "The player's assigned team type." }
                    },
                    required: ['eventType', 'timestamp', 'description']
                }
            }
        },
        required: ['events']
    }
};
```

**Step 2: Update the API Call Logic**

We will modify the `callGeminiApi` method to use this tool and directly access the structured arguments.

**Before:**
```typescript
// ...
const cleanedText = text.replace(/^```json\s*|```$/g, '').trim();
const parsedEvents = JSON.parse(cleanedText);
return { status: 'fulfilled', events: parsedEvents };
```

**After:**
```typescript
// backend/src/worker/GeminiAnalysisService.ts

// 1. Configure the model to use the tool
const model = this.genAI.getGenerativeModel({
    model: modelName,
    tools: [{ functionDeclarations: [GameAnalysisTool] }],
    toolConfig: {
        functionCallingConfig: {
            // Force the model to call our function
            mode: 'REQUIRED', 
        }
    }
});

const result = await model.generateContent({ contents: [{ role: "user", parts }] });

// 2. Directly access the structured arguments from the function call
const call = result.response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

if (call?.name === 'record_game_events' && call.args?.events) {
    const parsedEvents = call.args.events as any[]; // This is already a valid JS array
    logger.info(`Successfully parsed ${parsedEvents.length} events from structured response.`);
    // ...
    return { status: 'fulfilled', events: eventsWithMetadata };
} else {
    logger.warn(`Response did not contain the expected function call.`);
    return { status: 'fulfilled', events: [] };
}
```

### 2.4 Expected Outcome
This change will eliminate a major source of potential runtime errors, making the analysis pipeline significantly more robust and reliable.

---

## 3. Initiative 2: Use Thought Signatures for Sequential Consistency

### 3.1 The Problem
To maintain context, we currently pass a summary of known players and teams to the next chunk's prompt. This is helpful but "lossy." The model doesn't remember *how* it made its previous decisions, which can lead to inconsistencies in identifying entities over time.

### 3.2 The Solution
We will leverage **Thought Signatures**. This feature provides a high-fidelity, encrypted "memory" of the model's reasoning. By passing the signature from one chunk's response to the next chunk's request, we create a true sequential "chat," enabling the AI to build upon its previous analysis for maximum consistency.

### 3.3 Implementation Plan

**Step 1: Update the Database Schema**

We need to add a field to the `Chunk` entity to store the signature. A database migration is required.

```typescript
// backend/src/worker/Chunk.ts
import { /*...,*/ Column } from "typeorm";

@Entity("worker_video_analysis_chunks")
export class Chunk {
    // ... existing columns

    @Column({ name: "thought_signature", type: "text", nullable: true })
    thoughtSignature: string | null;

    // ... existing columns
}
```

**Step 2: Modify `GeminiAnalysisService`**

The `callGeminiApi` method must be updated to accept a previous signature and return the new one from the API response.

**Step 3: Update `ChunkProcessorWorker`**

The worker's logic must be updated to handle the signature chain, especially in `SEQUENTIAL` mode.

```typescript
// backend/src/worker/ChunkProcessorWorker.ts - inside message handler

let previousSignature: string | null = null;

// Only apply this logic in sequential mode for strict ordering
if (this.processingMode === 'SEQUENTIAL' && chunk.sequence > 0) {
    const previousChunk = await this.chunkRepository.findByJobIdAndSequence(jobId, chunk.sequence - 1);
    
    if (previousChunk && previousChunk.status === ChunkStatus.COMPLETED) {
        previousSignature = previousChunk.thoughtSignature;
        this.logger.info(`[SEQUENTIAL] Found thought signature from previous chunk ${previousChunk.sequence}.`);
    } else {
        // Handle logic for when previous chunk isn't ready
        this.logger.info(`[SEQUENTIAL] Previous chunk ${chunk.sequence - 1} not yet complete. Nacking.`);
        message.nack();
        return;
    }
}

// Pass the signature to the service
const result = await this.geminiAnalysisService.callGeminiApi(
    videoChunkInfo,
    identifiedPlayers,
    identifiedTeams,
    previousSignature // Pass the previous signature
);

if (result.status === 'fulfilled') {
    // ... event processing logic ...
    
    // Persist the new signature for the next chunk
    chunk.thoughtSignature = result.thoughtSignature || null;
    chunk.status = ChunkStatus.COMPLETED;
    await this.chunkRepository.update(chunk);
    // ...
}
```

### 3.4 Expected Outcome
This change will dramatically improve the consistency of player and team identification across the entire video, leading to higher-quality data and more accurate final statistics.

---

## 4. Initiative 3: Enhance Prompt Engineering

### 4.1 The Goal
To further improve model performance by aligning our prompts with documented best practices.

### 4.2 The Strategy: Few-Shot Prompting
The most effective way to improve results is to provide concrete examples of the desired output in the prompt. This "few-shot" approach shows the model what to do, rather than just telling it.

### 4.3 Implementation Plan
We will add a high-quality example to our prompt in `GeminiAnalysisService.ts`.

```typescript
// backend/src/worker/GeminiAnalysisService.ts - inside prompt construction

// ... after initial instructions ...
prompt += `
Follow the output schema precisely. Here is an example of a perfect event object:
{
  "eventType": "Shot Attempt",
  "timestamp": "00:45",
  "description": "Player in white jersey #23 attempts a 3-point shot from the top of the key.",
  "isSuccessful": false,
  "identifiedJerseyNumber": "23",
  "identifiedTeamColor": "white",
  "assignedTeamType": "HOME"
}

Analyze the video and provide all events in the requested tool format.
`;
```

### 4.4 Expected Outcome
This will give the model a clearer template to follow, improving its adherence to the desired structure and the quality of the generated content.
