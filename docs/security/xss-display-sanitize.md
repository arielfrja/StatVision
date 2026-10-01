# XSS — display handling (A4, 2026-10-01)

## Finding
Team / game names are user input. A literal name like `<Team>` renders the avatar initial as `<`
via `name.charAt(0)`, which looks broken and trips snapshot / a11y checks.

## Why not executable XSS here
- All names render as React text children (`{team.name}`), never `dangerouslySetInnerHTML`.
- React escapes `<`, `>`, `&` in text children by default.
- No backend change: stored names stay verbatim; fix is display-only.

## Fix (function only, no integration to avoid Wave-2 conflicts)
- New helper: `frontend/src/utils/sanitizeDisplay.ts`
  - `sanitizeDisplayName(name)` — trim, collapse whitespace, cap 60 chars.
  - `getTeamInitial(name)` — first alphanumeric (`<Team>` → `T`), fallback `?`.
  - `escapeHtml(s)` — only if you must build HTML strings (avoid; prefer React text).

## Recommended wiring (follow-up, not done in A4 to keep diff small)
```tsx
import { sanitizeDisplayName, getTeamInitial } from '@/utils/sanitizeDisplay';
// avatar:
{getTeamInitial(game.homeTeam?.name)}
// title:
{sanitizeDisplayName(game.homeTeam?.name, 'HOME')}
```
Apply to:
- `frontend/src/app/(authenticated)/teams/page.tsx` team cards
- `frontend/src/app/(authenticated)/games/page.tsx` home/away avatars + titles
- `frontend/src/app/(authenticated)/games/[gameId]/page.tsx` avatars

## Verification
- Create team named `<Team>` (prefix `A4-` in shared DB), check avatar shows `T`, title shows `<Team>` as text, no HTML injection.
- Screen reader reads title literally, avatar has `aria-hidden` or label via surrounding link.
