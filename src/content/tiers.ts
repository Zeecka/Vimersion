import type { Challenge, Tier, WorldMeta } from '../game/types'
import { tier1 } from './tier1'
import { tier2 } from './tier2'
import { tier3 } from './tier3'
import { gatekeeper, gauntlet } from './bosses'

/**
 * Authoring notes (keystroke pars):
 * - Pars are OPTIMAL raw keydown counts (VimGolf-style; every non-modifier
 *   keydown counts, incl. Esc/Enter; OS key-repeat counts per repeat).
 * - Exact-text goals complete the instant the buffer matches — often while
 *   still in insert mode, BEFORE the closing Esc. Budget pars assuming the
 *   player DOES press Esc; the optimal line in tests may be one lower.
 * - Every par must be proven by a reference solution in tests/par.test.ts.
 */
export const WORLDS: WorldMeta[] = [
  { tier: 1, name: 'Survive', subtitle: 'Modes, motion & first edits', accent: '#3ddc84' },
  { tier: 2, name: 'Comfortable', subtitle: 'Words, lines & jumps', accent: '#59c2ff' },
  { tier: 3, name: 'Faster', subtitle: 'Operators, objects & visual', accent: '#ffb454' },
  { tier: 4, name: 'Seeker', subtitle: 'Search, substitute & marks', accent: '#a78bfa' },
  { tier: 5, name: 'Superpowers', subtitle: 'Registers, macros & the dot', accent: '#ff6ac1' },
  { tier: 6, name: 'Legend', subtitle: 'Global commands & power idioms', accent: '#ffd76b' },
]

/** All authored challenges, in play order. Tiers 4–6 are coming next. */
export const CHALLENGES: Challenge[] = [...tier1, gatekeeper, ...tier2, ...tier3, gauntlet]

export function challengesForTier(tier: Tier): Challenge[] {
  return CHALLENGES.filter((c) => c.tier === tier)
}

export function worldMeta(tier: Tier): WorldMeta {
  return WORLDS.find((w) => w.tier === tier)!
}

/**
 * A world is unlocked when the previous world's STANDARD challenges are all
 * cleared. Bosses are a flex, not a wall (white-hat: no progress gate behind
 * them — this also keeps old saves' unlocks intact). Tier 1 is always unlocked.
 */
export function tierUnlocked(tier: Tier, completed: Record<string, unknown>): boolean {
  if (tier <= 1) return true
  const prev = challengesForTier((tier - 1) as Tier).filter((c) => (c.kind ?? 'standard') !== 'boss')
  if (prev.length === 0) return false // previous world not built yet → keep this one locked
  return prev.every((c) => completed[c.id])
}
