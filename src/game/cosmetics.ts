export type CosmeticKind = 'avatar' | 'theme' | 'background'

export interface Cosmetic {
  id: string
  kind: CosmeticKind
  name: string
  price: number // 0 = free default
  // avatar payload
  glyph?: string
  // theme payload
  accent?: string
  accentDim?: string
  // background payload — key consumed by <Background/>
  bg?: string
  blurb?: string
}

/** Player characters. 'cursor' is the free default (a Vim block cursor). */
export const AVATARS: Cosmetic[] = [
  { id: 'cursor', kind: 'avatar', name: 'Block Cursor', price: 0, blurb: 'The classic. You are the cursor.' },
  { id: 'ninja', kind: 'avatar', name: 'Vim Ninja', price: 40, blurb: 'Silent, deadly, motion-efficient.' },
  { id: 'robot', kind: 'avatar', name: 'Macro Bot', price: 50, blurb: 'Never mistypes a keystroke.' },
  { id: 'cat', kind: 'avatar', name: 'Copy Cat', price: 50, blurb: 'yy, then curls up.' },
  { id: 'sprite', kind: 'avatar', name: 'Sprite Runner', price: 70, blurb: 'Small, fast, always moving.' },
  { id: 'alien', kind: 'avatar', name: 'Buffer Alien', price: 60, blurb: 'From the register dimension.' },
  { id: 'ghost', kind: 'avatar', name: 'Esc Ghost', price: 60, blurb: 'Slips out of insert mode.' },
  { id: 'fox', kind: 'avatar', name: 'Quick Fox', price: 70, blurb: 'Jumps over the lazy dot.' },
  { id: 'pixelpal', kind: 'avatar', name: 'Pixel Pal', price: 80, blurb: '8-bit and proud of it.' },
  { id: 'wizard', kind: 'avatar', name: 'Regex Wizard', price: 90, blurb: 'Substitutes with a wave.' },
  { id: 'knight', kind: 'avatar', name: 'Neon Knight', price: 100, blurb: 'Guards the home row.' },
  { id: 'glitch', kind: 'avatar', name: 'Glitch Byte', price: 110, blurb: '0x1337 and unstable.' },
  { id: 'dragon', kind: 'avatar', name: 'Motion Dragon', price: 130, blurb: 'Hoards keystrokes.' },
]

/** Color themes — override the primary accent app-wide (UI + editor cursor). */
export const THEMES: Cosmetic[] = [
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

export const DEFAULTS = { avatar: 'cursor', theme: 'phosphor', background: 'crt' } as const

export function cosmeticsByKind(kind: CosmeticKind): Cosmetic[] {
  return COSMETICS.filter((c) => c.kind === kind)
}
