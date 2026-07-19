export type CosmeticKind = 'theme' | 'background'

export interface Cosmetic {
  id: string
  kind: CosmeticKind
  name: string
  price: number // 0 = free default
  // theme payload
  accent?: string
  accentDim?: string
  // background payload — key consumed by <Background/>
  bg?: string
  blurb?: string
}

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

/** Animated, parallax backgrounds (react to the mouse). CRT Scanlines is the
 *  free default; Synthwave is the other free option. The rest are unlockable. */
export const BACKGROUNDS: Cosmetic[] = [
  { id: 'crt', kind: 'background', name: 'CRT Scanlines', price: 0, bg: 'crt', blurb: 'Cozy terminal glow.' },
  { id: 'synthwave', kind: 'background', name: 'Synthwave', price: 0, bg: 'synthwave', blurb: 'Sun, mountains & neon grid.' },
  { id: 'aurora', kind: 'background', name: 'Aurora', price: 70, bg: 'aurora', blurb: 'Drifting parallax light.' },
  { id: 'starfield', kind: 'background', name: 'Starfield', price: 110, bg: 'starfield', blurb: 'Warp through space.' },
  { id: 'nebula', kind: 'background', name: 'Nebula', price: 120, bg: 'nebula', blurb: 'Deep-space color clouds.' },
  { id: 'cyber', kind: 'background', name: 'Cyber City', price: 140, bg: 'cyber', blurb: 'Neon skyline, parallax depth.' },
  { id: 'matrix', kind: 'background', name: 'Digital Rain', price: 150, bg: 'matrix', blurb: 'Follow the white rabbit.' },
]

export const COSMETICS: Cosmetic[] = [...THEMES, ...BACKGROUNDS]
export const COSMETIC_BY_ID: Record<string, Cosmetic> = Object.fromEntries(COSMETICS.map((c) => [c.id, c]))

export const DEFAULTS = { theme: 'nightglass', background: 'crt' } as const

/** Everything free — owned from the first launch (shows Equip/Equipped in the
 *  Shop, never a "0" price button). */
export const FREE_COSMETICS: string[] = COSMETICS.filter((c) => c.price === 0).map((c) => c.id)

/** Backgrounds that were the default in earlier versions. Save migration moves
 *  anyone still on one of these onto the current DEFAULTS.background.
 *  'platform' (Pixel Kingdom) was removed in v7; 'synthwave' was the v8 default
 *  before CRT Scanlines returned as the default in v9. Both remain free to
 *  re-equip from the Shop. */
export const LEGACY_DEFAULT_BACKGROUNDS = ['platform', 'synthwave', 'nebula']

/** Themes that were the default in earlier versions (same migration pattern). */
export const LEGACY_DEFAULT_THEMES = ['phosphor']

export function cosmeticsByKind(kind: CosmeticKind): Cosmetic[] {
  return COSMETICS.filter((c) => c.kind === kind)
}
