import { describe, expect, it } from 'vitest'
import { mergeSnapshots, type Snapshot } from '../src/game/account'

/** Minimal valid snapshot factory for merge tests. */
function snap(over: Partial<Snapshot> = {}): Snapshot {
  return {
    xp: 0,
    coins: 0,
    completed: {},
    mastery: {},
    streak: { count: 0, lastPlayed: null },
    arcadeBest: 0,
    owned: ['nightglass', 'crt'],
    equipped: { theme: 'nightglass', background: 'crt' },
    hero: { body: null, trim: null, visor: null, accessory: 'none', visorStyle: 'bar', aura: { color: null, style: 'sparkles', intensity: 0.6 } },
    ...over,
  }
}

describe('account snapshot merge (login reconciliation)', () => {
  it('takes the max of numeric totals so neither side loses progress', () => {
    const m = mergeSnapshots(snap({ xp: 500, coins: 10, arcadeBest: 90 }), snap({ xp: 200, coins: 60, arcadeBest: 40 }))
    expect(m.xp).toBe(500)
    expect(m.coins).toBe(60)
    expect(m.arcadeBest).toBe(90)
  })

  it('keeps the better per-challenge result (stars first, then keystrokes)', () => {
    const local = snap({ completed: { a: { stars: 2, keystrokes: 9, par: 3, xp: 60 } } })
    const server = snap({
      completed: {
        a: { stars: 3, keystrokes: 3, par: 3, xp: 75 },
        b: { stars: 1, keystrokes: 20, par: 4, xp: 45 },
      },
    })
    const m = mergeSnapshots(local, server)
    expect(m.completed.a).toEqual({ stars: 3, keystrokes: 3, par: 3, xp: 75 })
    expect(m.completed.b).toEqual({ stars: 1, keystrokes: 20, par: 4, xp: 45 })
  })

  it('unions owned cosmetics and per-command mastery maxes', () => {
    const m = mergeSnapshots(
      snap({ owned: ['crt', 'amber'], mastery: { x: 5, dd: 1 } }),
      snap({ owned: ['crt', 'matrix'], mastery: { x: 2, u: 4 } }),
    )
    expect(new Set(m.owned)).toEqual(new Set(['crt', 'amber', 'matrix']))
    expect(m.mastery).toEqual({ x: 5, dd: 1, u: 4 })
  })

  it('keeps the most recently played streak', () => {
    const local = snap({ streak: { count: 2, lastPlayed: '2026-7-14' } })
    const server = snap({ streak: { count: 9, lastPlayed: '2026-7-1' } })
    expect(mergeSnapshots(local, server).streak).toEqual({ count: 2, lastPlayed: '2026-7-14' })
  })

  it('cosmetic loadout follows the higher-xp profile', () => {
    const local = snap({ xp: 10, equipped: { theme: 'amber', background: 'crt' } })
    const server = snap({
      xp: 900,
      equipped: { theme: 'gold', background: 'matrix' },
      hero: { body: '#112233', trim: null, visor: null, accessory: 'tophat', visorStyle: 'bar', aura: { color: null, style: 'fire', intensity: 0.6 } },
    })
    const m = mergeSnapshots(local, server)
    expect(m.equipped.theme).toBe('gold')
    expect(m.equipped.background).toBe('matrix')
    expect(m.hero.accessory).toBe('tophat')
    expect(m.hero.aura.style).toBe('fire')
  })
})
