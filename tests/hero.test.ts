import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HERO_LOOK,
  INITIAL_HERO,
  LEGACY_AVATAR_IDS,
  heroLookFrom,
  normalizeHero,
} from '../src/game/heroParts'
import { COSMETIC_BY_ID, COSMETICS, DEFAULTS, FREE_COSMETICS } from '../src/game/cosmetics'
import {
  CHARACTERS,
  CHARACTER_IDS,
  DEFAULT_OWNED_CHARACTERS,
  characterSku,
} from '../src/game/characters'

/**
 * The Hero customizer replaced the fixed-avatar roster in save v10. These cover
 * the migration path a legacy save takes: the old `{ primary, secondary, effect }`
 * shape is coerced to the canonical HeroCustom, and nothing dangles.
 */
describe('hero customization', () => {
  it('resolves null colors to the vim-purple default look', () => {
    expect(heroLookFrom(INITIAL_HERO)).toEqual(DEFAULT_HERO_LOOK)
    expect(DEFAULT_HERO_LOOK.body).toBe('#7c6bff')
  })

  it('keeps custom colors over the defaults', () => {
    const look = heroLookFrom({ ...INITIAL_HERO, body: '#ff0000' })
    expect(look.body).toBe('#ff0000')
    expect(look.trim).toBe(DEFAULT_HERO_LOOK.trim)
  })

  it('normalizes a legacy hero ({ primary, secondary, effect }) to the canonical shape', () => {
    // pre-v10 stored { primary, secondary, effect } directly on `hero`.
    const hero = normalizeHero({ primary: '#123456', secondary: '#abcdef', effect: 'fire' })
    expect(hero.body).toBe('#123456')
    expect(hero.trim).toBe('#abcdef')
    expect(hero.aura.style).toBe('fire')
    expect(hero.accessory).toBe('none')
    expect(hero.visorStyle).toBe('bar')
  })

  it('round-trips a full hero unchanged', () => {
    const hero = {
      body: '#123456',
      trim: '#abcdef',
      visor: '#000000',
      accessory: 'tophat' as const,
      visorStyle: 'goggles' as const,
      finish: 'metallic' as const,
      aura: { color: '#ffffff', style: 'rings' as const, intensity: 0.25 },
      character: 'astronaut' as const,
    }
    expect(normalizeHero(hero)).toEqual(hero)
  })

  it('falls back to defaults on garbage input', () => {
    expect(normalizeHero(null)).toEqual(INITIAL_HERO)
    expect(normalizeHero({ body: 'not-a-color', accessory: 'jetpack', visorStyle: 9 })).toEqual(INITIAL_HERO)
    // Shorthand hex is rejected: the server contract is 6-digit.
    expect(normalizeHero({ body: '#fff' }).body).toBeNull()
  })

  it('validates the body finish, defaulting to matte', () => {
    expect(normalizeHero({ finish: 'glow' }).finish).toBe('glow')
    expect(normalizeHero({ finish: 'metallic' }).finish).toBe('metallic')
    expect(normalizeHero({ finish: 'nope' }).finish).toBe('matte')
    expect(normalizeHero({}).finish).toBe('matte')
  })

  it('clamps aura intensity into 0..1', () => {
    expect(normalizeHero({ aura: { intensity: 5 } }).aura.intensity).toBe(1)
    expect(normalizeHero({ aura: { intensity: -3 } }).aura.intensity).toBe(0)
  })
})

describe('legacy avatars', () => {
  it('LEGACY_AVATAR_IDS is an array of retired avatar ids (incl. robot)', () => {
    expect(Array.isArray(LEGACY_AVATAR_IDS)).toBe(true)
    expect(LEGACY_AVATAR_IDS).toContain('robot')
  })

  it('no longer sells avatars', () => {
    expect((COSMETICS as { kind: string }[]).some((c) => c.kind === 'avatar')).toBe(false)
  })

  it('defaults are free and therefore owned from the first launch', () => {
    expect(FREE_COSMETICS).toContain(DEFAULTS.theme)
    expect(FREE_COSMETICS).toContain(DEFAULTS.background)
    expect(COSMETIC_BY_ID[DEFAULTS.theme]).toBeTruthy()
  })
})

describe('character catalog', () => {
  const REACTIONS = ['idle', 'typing', 'win', 'levelup', 'fail'] as const

  it('leads with the free default character', () => {
    expect(CHARACTERS[0].id).toBe('astronaut')
    expect(CHARACTERS[0].price).toBe(0)
  })

  it('has unique character ids', () => {
    expect(new Set(CHARACTER_IDS).size).toBe(CHARACTER_IDS.length)
  })

  it('every config is fully specified for the 3D rig', () => {
    for (const c of CHARACTERS) {
      for (const r of REACTIONS) {
        expect(typeof c.clipMap[r], `${c.id}.clipMap.${r}`).toBe('string')
        expect(c.clipMap[r].length, `${c.id}.clipMap.${r} empty`).toBeGreaterThan(0)
      }
      expect(c.url.endsWith('.glb'), `${c.id} url`).toBe(true)
      expect(c.landmarks, `${c.id} has no landmarks`).toBeTruthy()
      expect(typeof c.landmarks.feet).toBe('number')
      expect(typeof c.scale).toBe('number')
      expect(c.thumb.kind).toBe('image')
    }
  })

  it('namespaces ownership skus and owns the default for free', () => {
    expect(characterSku('astronaut')).toBe('char:astronaut')
    expect(DEFAULT_OWNED_CHARACTERS).toContain(characterSku('astronaut'))
  })

  it('normalizeHero coerces the character field', () => {
    expect(normalizeHero({ character: 'nope' }).character).toBe('astronaut')
    expect(normalizeHero({ character: 'swat' }).character).toBe('swat')
  })
})
