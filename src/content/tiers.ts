import type { Challenge, Tier, WorldMeta } from '../game/types'
import { tier1 } from './tier1'
import { tier2 } from './tier2'

export const WORLDS: WorldMeta[] = [
  { tier: 1, name: 'Survive', subtitle: 'Modes, motion & first edits', accent: '#3ddc84' },
  { tier: 2, name: 'Comfortable', subtitle: 'Words, lines & jumps', accent: '#59c2ff' },
  { tier: 3, name: 'Faster', subtitle: 'Operators & text objects', accent: '#ffb454' },
  { tier: 4, name: 'Superpowers', subtitle: 'Macros, marks & the dot', accent: '#ff6ac1' },
]

/** All authored challenges, in play order. Tiers 3–4 are curriculum stubs. */
export const CHALLENGES: Challenge[] = [...tier1, ...tier2]

export function challengesForTier(tier: Tier): Challenge[] {
  return CHALLENGES.filter((c) => c.tier === tier)
}

export function worldMeta(tier: Tier): WorldMeta {
  return WORLDS.find((w) => w.tier === tier)!
}

/**
 * A world is unlocked when the previous world (that has content) is fully cleared.
 * Tier 1 is always unlocked.
 */
export function tierUnlocked(tier: Tier, completed: Record<string, unknown>): boolean {
  if (tier <= 1) return true
  const prev = challengesForTier((tier - 1) as Tier)
  if (prev.length === 0) return false // previous world not built yet → keep this one locked
  return prev.every((c) => completed[c.id])
}
