# Gemini Video Understanding Official Guide

*Source: Official Google Gemini API Documentation (May 2026)*

## Overview
Gemini models can process videos to describe, segment, and extract information. They process information from both **audio and visual** streams.

## Input Methods
| Input method | Max size | Recommended use case |
|---|---|---|
| **File API** | 20GB (paid) / 2GB (free) | Large files (100MB+), long videos (10min+), reusable files. |
| **Cloud Storage** | 2GB (per file) | Persistent, reusable files. |
| **Inline Data** | < 100MB | Small files (<100MB), short duration. |

## Technical Specifications
- **Sampling Rate:** Default is **1 frame per second (FPS)**.
- **Audio Processing:** Processed at 1Kbps (single channel).
- **Token Calculation:** 
    - **Default Resolution:** ~258 tokens per frame + 32 tokens for audio = **~300 tokens per second**.
    - **Low Resolution:** ~66 tokens per frame + 32 tokens for audio = **~100 tokens per second**.
- **Rate per Minute (Default):** ~18,000 tokens per minute of video.
- **Timestamp Format:** Use `MM:SS` (e.g., `01:15`).

## Customization
You can override the default behavior using `videoMetadata`:
- **Clipping:** `start_offset` and `end_offset`.
- **FPS:** Custom sampling rate (e.g., `fps: 5` for high-motion content like basketball).

## Best Practices
1. Use the **Files API** for videos > 20MB.
2. For videos > 10 minutes, use **Context Caching**.
3. Place text prompts **after** the video part in the contents array.
4. For fast action (basketball), consider increasing FPS or slowing down clips if 1 FPS loses too much detail.

## Example (JavaScript SDK)
```javascript
const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: [
    {
      fileData: {
        fileUri: myfile.uri,
        mimeType: myfile.mimeType,
      },
      videoMetadata: {
        startOffset: '0s',
        endOffset: '120s',
        fps: 1
      }
    },
    { text: "Identify all basketball events." }
  ],
});
```
