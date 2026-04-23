---
title: Video Chunker Service
tags: [worker, video-processing, ffmpeg]
sources: [backend/src/worker/VideoChunkerService.ts]
updated: 2026-04-22
---

# Video Chunker Service

A utility service that wraps **FFmpeg** to perform video manipulation tasks.

## Responsibilities
- **Metadata Extraction:** Retrieves duration, frame rate, and resolution using `ffprobe`.
- **Segmenting:** Creates individual video chunks (`.mp4`) from a source file based on start time and duration.
- **Optimized Re-encoding:** Uses `faststart` and specific encoding parameters to ensure chunks are web-optimized and compatible with the Gemini API.
- **Cleanup:** Deletes temporary chunk files from the local filesystem.

## Key Tool
- **FFmpeg:** The underlying engine for all video processing.
