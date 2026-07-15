/**
 * The one customizable Hero (the animated robot in play mode). Replaces the old
 * fixed-avatar roster: instead of buying a character, the player styles this Hero
 * — per-zone colors, a procedural accessory, a visor style, and a custom aura.
 *
 * Zone → model material (public/models/hero.glb): body=`Main`, trim=`Grey`,
 * visor=`Black`. The 2D <HeroMark/> mirrors the same three zones.
 */

export type AccessoryId = 'none' | 'antenna' | 'halo' | 'tophat' | 'headphones' | 'cape'
export type VisorStyle = 'bar' | 'goggles' | 'single' | 'grille'
export type AuraStyle = 'sparkles' | 'fire' | 'bolt' | 'orbit' | 'rings'

export interface HeroAura {
  /** Custom aura tint; null = the equipped theme accent. */
  color: string | null
  style: AuraStyle
  /** 0..1 — particle density / glow strength. */
  intensity: number
}

/** Persisted Hero customization. null colors = the default look below. */
export interface HeroCustom {
  body: string | null
  trim: string | null
  visor: string | null
  accessory: AccessoryId
  visorStyle: VisorStyle
  aura: HeroAura
}

/** Resolved (non-null) colors, ready to paint the 3D materials / 2D mark. */
export interface HeroLook {
  body: string
  trim: string
  visor: string
}

export const DEFAULT_HERO_LOOK: HeroLook = { body: '#7c6bff', trim: '#9aa7c7', visor: '#0e1119' }

export const INITIAL_HERO: HeroCustom = {
  body: null,
  trim: null,
  visor: null,
  accessory: 'none',
  visorStyle: 'bar',
  aura: { color: null, style: 'sparkles', intensity: 0.6 },
}

/** Catalogs — labels + the `emoji` used for the lite-tier 2D aura particles. */
export const ACCESSORIES: { id: AccessoryId; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'antenna', name: 'Antenna' },
  { id: 'halo', name: 'Halo' },
  { id: 'tophat', name: 'Top Hat' },
  { id: 'headphones', name: 'Headphones' },
  { id: 'cape', name: 'Cape' },
]

export const VISOR_STYLES: { id: VisorStyle; name: string }[] = [
  { id: 'bar', name: 'Visor' },
  { id: 'goggles', name: 'Goggles' },
  { id: 'single', name: 'Cyclops' },
  { id: 'grille', name: 'Grille' },
]

export const AURA_STYLES: { id: AuraStyle; name: string; emoji: string }[] = [
  { id: 'sparkles', name: 'Sparkles', emoji: 'sparkles' },
  { id: 'fire', name: 'Fire', emoji: 'fire' },
  { id: 'bolt', name: 'Bolt', emoji: 'bolt' },
  { id: 'orbit', name: 'Orbit', emoji: 'sparkles' },
  { id: 'rings', name: 'Rings', emoji: 'sparkles' },
]

const ACCESSORY_IDS = ACCESSORIES.map((a) => a.id) as string[]
const VISOR_IDS = VISOR_STYLES.map((v) => v.id) as string[]
const AURA_IDS = AURA_STYLES.map((a) => a.id) as string[]

/** Old avatar cosmetic ids (removed in v10) — stripped from `owned` on migrate. */
export const LEGACY_AVATAR_IDS = [
  'cursor', 'ninja', 'robot', 'cat', 'sprite', 'alien', 'ghost', 'fox', 'pixelpal', 'wizard', 'knight', 'glitch', 'dragon',
]

const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)

/** Resolve a HeroCustom to concrete colors (custom picks win, else the default). */
export function heroLookFrom(hero: HeroCustom): HeroLook {
  return {
    body: hero.body ?? DEFAULT_HERO_LOOK.body,
    trim: hero.trim ?? DEFAULT_HERO_LOOK.trim,
    visor: hero.visor ?? DEFAULT_HERO_LOOK.visor,
  }
}

/**
 * Coerce any persisted/legacy hero blob to the canonical shape. Accepts the old
 * `{ primary, secondary, effect }` (pre-v10) and the new shape; invalid fields
 * fall back to defaults. Colors are validated as 6-digit hex (server contract).
 */
export function normalizeHero(raw: unknown): HeroCustom {
  const h = (raw ?? {}) as Record<string, unknown>
  const aura = (h.aura ?? {}) as Record<string, unknown>
  const style = AURA_IDS.includes(aura.style as string)
    ? (aura.style as AuraStyle)
    : AURA_IDS.includes(h.effect as string)
      ? (h.effect as AuraStyle)
      : 'sparkles'
  return {
    body: isHex(h.body) ? h.body : isHex(h.primary) ? (h.primary as string) : null,
    trim: isHex(h.trim) ? h.trim : isHex(h.secondary) ? (h.secondary as string) : null,
    visor: isHex(h.visor) ? h.visor : null,
    accessory: ACCESSORY_IDS.includes(h.accessory as string) ? (h.accessory as AccessoryId) : 'none',
    visorStyle: VISOR_IDS.includes(h.visorStyle as string) ? (h.visorStyle as VisorStyle) : 'bar',
    aura: {
      color: isHex(aura.color) ? aura.color : null,
      style,
      intensity: typeof aura.intensity === 'number' ? Math.min(1, Math.max(0, aura.intensity)) : 0.6,
    },
  }
}
