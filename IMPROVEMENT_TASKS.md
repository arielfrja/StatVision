# Gemini API Integration Improvement Tasks

This task list tracks the implementation of the initiatives outlined in `IMPROVEMENT_PLAN.md`.

## Initiative 1: Implement Structured Outputs for Robustness

- [ ] **Define Schema:** Define the `GameAnalysisTool` JSON schema in `GeminiAnalysisService.ts`.
- [ ] **Configure Model:** Modify `GeminiAnalysisService.ts` to get the generative model with the new tool configuration.
- [ ] **Process Response:** Update `callGeminiApi` in `GeminiAnalysisService.ts` to process the structured `functionCall.args` instead of parsing a raw string.

## Initiative 2: Use Thought Signatures for Sequential Consistency

- [ ] **Database Migration:** Create a new TypeORM migration to add the `thought_signature` (nullable text) column to the `worker_video_analysis_chunks` table.
- [ ] **Update Entity:** Update the `Chunk.ts` TypeORM entity to include the `thoughtSignature` field.
- [ ] **Update Service:** Modify the `callGeminiApi` function signature and return type in `GeminiAnalysisService.ts` to handle passing and returning thought signatures.
- [ ] **Update Worker:** Update `ChunkProcessorWorker.ts` to manage the signature chain in `SEQUENTIAL` mode (get signature from previous chunk, pass it to the service, and save the new signature to the current chunk).

## Initiative 3: Enhance Prompt Engineering

- [ ] **Add Few-Shot Example:** Add a high-quality, few-shot JSON example to the prompt construction logic in `GeminiAnalysisService.ts`.
- [ ] **Refine Instructions:** Refine the main instruction in the prompt to be more direct, focusing on the generation of the JSON structure from the start.

## 4. Final Testing

- [ ] **Integration Test:** Run a full video through the pipeline to ensure all changes work together correctly.
- [ ] **Review & Cleanup:** Review all changes and remove any old, commented-out code.
