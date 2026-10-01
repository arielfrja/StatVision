/**
 * A4 display-sanitize helper (frontend only, no backend change).
 *
 * React escapes text by default when rendered as children (no dangerouslySetInnerHTML),
 * so `<Team>`-style names are NOT executable XSS in our cards. The remaining UX issue is
 * the avatar initial: `name.charAt(0)` returns `<` for a literal `<Team>` name, which looks
 * broken and can confuse screen readers / snapshot tests.
 *
 * These helpers keep rendering honest without changing stored data:
 * - sanitizeDisplayName(): trims, collapses whitespace, caps length for layout safety.
 * - getTeamInitial(): first alphanumeric char (so `<Team>` -> `T`), fallback `?`.
 * - escapeHtml(): only for the rare case you must inject into HTML strings (emails, tooltips).
 */

export const MAX_DISPLAY_NAME_LENGTH = 60;

export function sanitizeDisplayName(raw: unknown, fallback = 'Untitled'): string {
  if (typeof raw !== 'string') return fallback;
  // Trim + collapse whitespace (including newlines that break card layout).
  let v = raw.trim().replace(/\s+/g, ' ');
  if (!v) return fallback;
  if (v.length > MAX_DISPLAY_NAME_LENGTH) {
    v = `${v.slice(0, MAX_DISPLAY_NAME_LENGTH - 1).trim()}…`;
  }
  return v;
}

export function getTeamInitial(rawName: unknown): string {
  const clean = sanitizeDisplayName(rawName, '');
  if (!clean) return '?';
  // Skip leading `<`, `(`, `[`, `"`, whitespace, etc. — take first alphanumeric.
  const m = clean.match(/[A-Za-z0-9]/);
  if (m && m[0]) return m[0].toUpperCase();
  // No alphanumeric (e.g. emoji-only) — fall back to first visible char, never `<` alone.
  const first = clean.charAt(0);
  if (first === '<' || first === '>' || first === '&') return '?';
  return first.toUpperCase();
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
