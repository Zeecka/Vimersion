export type CosmeticKind = 'avatar' | 'theme' | 'background'

export interface Cosmetic {
  id: string
  kind: CosmeticKind
  name: string
  price: number // 0 = free default
  // avatar payload
  glyph?: string
  /** Character signature colors (SVG background gradient / 3D hero tint).
   *  Player customization (store.hero) overrides these when set. */
  palette?: { primary: string; secondary: string }
  // theme payload
  accent?: string
  accentDim?: string
  // background payload — key consumed by <Background/>
  bg?: string
  blurb?: string
}

/** Player characters. 'cursor' is the free default (a Vim block cursor).
 *  Palettes mirror the DiceBear background gradients baked into each SVG
 *  (scripts/gen-characters.mjs roster) — they double as the 3D hero tint. */
export const AVATARS: Cosmetic[] = [
  { id: 'cursor', kind: 'avatar', name: 'Block Cursor', price: 0, blurb: 'The classic. You are the cursor.' },
  { id: 'ninja', kind: 'avatar', name: 'Vim Ninja', price: 40, blurb: 'Silent, deadly, motion-efficient.', palette: { primary: '#7c3aed', secondary: '#8b5cf6' } },
  { id: 'robot', kind: 'avatar', name: 'Macro Bot', price: 50, blurb: 'Never mistypes a keystroke.', palette: { primary: '#0ea5e9', secondary: '#2563eb' } },
  { id: 'cat', kind: 'avatar', name: 'Copy Cat', price: 50, blurb: 'yy, then curls up.', palette: { primary: '#f59e0b', secondary: '#f97316' } },
  { id: 'sprite', kind: 'avatar', name: 'Sprite Runner', price: 70, blurb: 'Small, fast, always moving.', palette: { primary: '#eab308', secondary: '#f59e0b' } },
  { id: 'alien', kind: 'avatar', name: 'Buffer Alien', price: 60, blurb: 'From the register dimension.', palette: { primary: '#10b981', secondary: '#059669' } },
  { id: 'ghost', kind: 'avatar', name: 'Esc Ghost', price: 60, blurb: 'Slips out of insert mode.', palette: { primary: '#22d3ee', secondary: '#3b82f6' } },
  { id: 'fox', kind: 'avatar', name: 'Quick Fox', price: 70, blurb: 'Jumps over the lazy dot.', palette: { primary: '#fb923c', secondary: '#ea580c' } },
  { id: 'pixelpal', kind: 'avatar', name: 'Pixel Pal', price: 80, blurb: '8-bit and proud of it.', palette: { primary: '#06b6d4', secondary: '#0891b2' } },
  { id: 'wizard', kind: 'avatar', name: 'Regex Wizard', price: 90, blurb: 'Substitutes with a wave.', palette: { primary: '#a855f7', secondary: '#6366f1' } },
  { id: 'knight', kind: 'avatar', name: 'Neon Knight', price: 100, blurb: 'Guards the home row.', palette: { primary: '#e11d48', secondary: '#f43f5e' } },
  { id: 'glitch', kind: 'avatar', name: 'Glitch Byte', price: 110, blurb: '0x1337 and unstable.', palette: { primary: '#db2777', secondary: '#9333ea' } },
  { id: 'dragon', kind: 'avatar', name: 'Motion Dragon', price: 130, blurb: 'Hoards keystrokes.', palette: { primary: '#16a34a', secondary: '#65a30d' } },
]

/** Color themes — override the primary accent app-wide (UI + editor cursor). */
export const THEMES: Cosmetic[] = [
  { id: 'nightglass', kind: 'theme', name: 'Nightglass', price: 0, accent: '#7c6bff', accentDim: '#5a4cd6' },
  { id: 'phosphor', kind: 'theme', name: 'Phosphor Green', price: 0, accent: '#3ddc84', accentDim: '#2a9d63' },
  { id: 'amber', kind: 'theme', name: 'Amber CRT', price: 60, accent: '#ffb454', accentDim: '#c98a3c' },
  { id: 'cyan', kind: 'theme', name: 'Ice Cyan', price: 60, accent: '#59c2ff', accentDim: '#3d87b3' },
  { id: 'magenta', kind: 'theme', name: 'Hot Magenta', price: 70, accent: '#ff6ac1', accentDim: '#b34d8a' },
  { id: 'crimson', kind: 'theme', name: 'Crimson', price: 70, accent: '#ff5c7a', accentDim: '#b34155' },
  { id: 'gold', kind: 'theme', name: 'Solid Gold', price: 100, accent: '#ffd54a', accentDim: '#c9a838' },
  { id: 'violet', kind: 'theme', name: 'Ultraviolet', price: 100, accent: '#b78cff', accentDim: '#7d5fb3' },
]

/** Animated, parallax backgrounds (react to the mouse). */
export const BACKGROUNDS: Cosmetic[] = [
  { id: 'platform', kind: 'background', name: 'Pixel Kingdom', price: 0, bg: 'platform', blurb: 'Side-scrolling multi-layer parallax.' },
  { id: 'crt', kind: 'background', name: 'CRT Scanlines', price: 0, bg: 'crt', blurb: 'Cozy terminal glow.' },
  { id: 'aurora', kind: 'background', name: 'Aurora', price: 70, bg: 'aurora', blurb: 'Drifting parallax light.' },
  { id: 'synthwave', kind: 'background', name: 'Synthwave', price: 90, bg: 'synthwave', blurb: 'Sun, mountains & neon grid.' },
  { id: 'starfield', kind: 'background', name: 'Starfield', price: 110, bg: 'starfield', blurb: 'Warp through space.' },
  { id: 'nebula', kind: 'background', name: 'Nebula', price: 120, bg: 'nebula', blurb: 'Deep-space color clouds.' },
  { id: 'cyber', kind: 'background', name: 'Cyber City', price: 140, bg: 'cyber', blurb: 'Neon skyline, parallax depth.' },
  { id: 'matrix', kind: 'background', name: 'Digital Rain', price: 150, bg: 'matrix', blurb: 'Follow the white rabbit.' },
]

export const COSMETICS: Cosmetic[] = [...AVATARS, ...THEMES, ...BACKGROUNDS]
export const COSMETIC_BY_ID: Record<string, Cosmetic> = Object.fromEntries(COSMETICS.map((c) => [c.id, c]))

export const DEFAULTS = { avatar: 'cursor', theme: 'nightglass', background: 'platform' } as const

/** Backgrounds that were the default in earlier versions. Save migration moves
 *  anyone still on one of these onto the current DEFAULTS.background. */
export const LEGACY_DEFAULT_BACKGROUNDS = ['crt', 'nebula']

/** Themes that were the default in earlier versions (same migration pattern). */
export const LEGACY_DEFAULT_THEMES = ['phosphor']

export function cosmeticsByKind(kind: CosmeticKind): Cosmetic[] {
  return COSMETICS.filter((c) => c.kind === kind)
}
