# Unit Test Record: subsequent_chunk.md

## Target File
`common/src/infrastructure/prompts/subsequent_chunk.md`

## Test Description
Visual verification that the CERTAINTY ASSESSMENT section (2.5) was correctly inserted between section 2 (SEGMENT LOGIC) and section 3 (OUTPUT FORMAT).

## Test Code (Preserved)
N/A - Markdown file. Verification done by reading file content.

## Expected Content After Edit
```
### 2.5 CERTAINTY ASSESSMENT
For every event, include `actorCertainty` (0.0–1.0 confidence in player/team assignment) and `eventTypeCertainty` (0.0–1.0 confidence in event type classification). Be honest — low certainty flags events for human review.
```

## Test Result
- Status: pass
- Session: ses_7
- Timestamp: 2026-07-17T08:57:00Z
