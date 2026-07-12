import type { Stars } from './types'

/** Cumulative XP required to *reach* a given level (level 1 = 0 XP). */
export function totalXpForLevel(level: number): number {
  return Math.round(37.5 * (level - 1) * level)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (totalXpForLevel(level + 1) <= xp) level++
  return level
}

export interface LevelProgress {
  level: number
  into: number // xp earned into the current level
  span: number // xp needed to span the current level
  pct: number // 0..1 progress through the current level
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp)
  const cur = totalXpForLevel(level)
  const next = totalXpForLevel(level + 1)
  const span = next - cur
  const into = xp - cur
  return { level, into, span, pct: span > 0 ? into / span : 0 }
}

/** Stars for a solve, from keystrokes vs. par. */
export function starsFor(keystrokes: number, par: number): Stars {
  if (keystrokes <= par) return 3
  if (keystrokes <= Math.ceil(par * 1.75)) return 2
  return 1
}

/** XP granted for a challenge result, given the player's previous best stars. */
export function xpForChallenge(stars: Stars, prevBestStars: number): number {
  const base = 30 + stars * 15 // 45 / 60 / 75
  if (prevBestStars === 0) return base // first completion: full award
  if (stars > prevBestStars) return (stars - prevBestStars) * 15 // improvement bonus
  return 0 // no reward for a non-improving replay
}
