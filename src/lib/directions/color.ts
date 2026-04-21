// Palette of 10 soft bg + readable fg pairs for direction chips.
// Keep the palette keys in sync with DIRECTION_COLOR_PALETTE on the backend
// (controllers/directionController.js). If a new color is added on BE, add
// it here in the same order so hash-based fallback stays stable.
export const DIRECTION_PALETTE: ReadonlyArray<{
  key: string;
  label: string;
  bg: string;
  fg: string;
}> = [
  { key: 'indigo',  label: 'Индиго',   bg: '#eef2ff', fg: '#4338ca' },
  { key: 'emerald', label: 'Изумруд',  bg: '#d1fae5', fg: '#047857' },
  { key: 'rose',    label: 'Роза',     bg: '#ffe4e6', fg: '#be123c' },
  { key: 'amber',   label: 'Янтарь',   bg: '#fef3c7', fg: '#b45309' },
  { key: 'sky',     label: 'Небо',     bg: '#e0f2fe', fg: '#0369a1' },
  { key: 'violet',  label: 'Фиолет',   bg: '#f3e8ff', fg: '#6d28d9' },
  { key: 'teal',    label: 'Морской',  bg: '#ccfbf1', fg: '#0f766e' },
  { key: 'orange',  label: 'Оранж',    bg: '#ffedd5', fg: '#c2410c' },
  { key: 'slate',   label: 'Графит',   bg: '#e2e8f0', fg: '#334155' },
  { key: 'pink',    label: 'Розовый',  bg: '#fce7f3', fg: '#be185d' },
];

export type DirectionColor = { bg: string; fg: string };

const DEFAULT_FALLBACK: DirectionColor = { bg: '#eef2ff', fg: '#4338ca' };

function paletteByKey(key: string | null | undefined): DirectionColor | null {
  if (!key) return null;
  const hit = DIRECTION_PALETTE.find((p) => p.key === key);
  return hit ? { bg: hit.bg, fg: hit.fg } : null;
}

function hashKey(seed: string): string {
  const s = (seed || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return DIRECTION_PALETTE[hash % DIRECTION_PALETTE.length].key;
}

/**
 * Resolve the palette color for a direction.
 * Priority: server-saved `color` → stable hash of the name (fallback so fresh
 * directions without a color still look distinct).
 */
export function getDirectionColor(
  color: string | null | undefined,
  name: string,
): DirectionColor {
  const saved = paletteByKey(color);
  if (saved) return saved;
  return paletteByKey(hashKey(name)) ?? DEFAULT_FALLBACK;
}

/** Palette key currently in effect (saved or derived). */
export function getDirectionColorKey(
  color: string | null | undefined,
  name: string,
): string {
  if (color && DIRECTION_PALETTE.some((p) => p.key === color)) return color;
  return hashKey(name);
}
