import type { Challenge, Tier, WorldMeta } from '../game/types'
import { tier1 } from './tier1'

export const WORLDS: WorldMeta[] = [
  { tier: 1, name: 'Survive', subtitle: 'Modes, motion & first edits', accent: '#3ddc84' },
  { tier: 2, name: 'Comfortable', subtitle: 'Words, lines & jumps', accent: '#59c2ff' },
  { tier: 3, name: 'Faster', subtitle: 'Operators & text objects', accent: '#ffb454' },
  { tier: 4, name: 'Superpowers', subtitle: 'Macros, marks & the dot', accent: '#ff6ac1' },
]

/** All authored challenges. Tiers 2–4 are curriculum stubs (Phase 2). */
export const CHALLENGES: Challenge[] = [...tier1]

export function challengesForTier(tier: Tier): Challenge[] {
  return CHALLENGES.filter((c) => c.tier === tier)
}

export function worldMeta(tier: Tier): WorldMeta {
  return WORLDS.find((w) => w.tier === tier)!
}
