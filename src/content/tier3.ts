import type { Challenge } from '../game/types'

/**
 * Tier 3 — "Faster". Operators + text objects + visual mode: the Vim grammar
 * epiphany. Currently just the opener; the rest of the tier ships in the
 * Content-I phase.
 */
export const tier3: Challenge[] = [
  {
    id: 't3-ciw',
    tier: 3,
    title: 'Inside Job',
    brief: 'Rename cnt to count — your cursor is already INSIDE the word. Use ciw.',
    taughtCommands: ['iw', 'c-motion'],
    startText: 'let cnt = items.length',
    startCursor: { line: 1, ch: 5 }, // mid-word, on the 'n' of cnt
    goal: { targetText: 'let count = items.length', describe: 'Buffer reads: let count = items.length' },
    par: 9, // ciw (3) + "count" (5) + Esc (1); the match lands on the final 't'
    hint: 'ciw = change inner word — it works from ANYWHERE inside the word, no need to move to its start. Type count, then Esc.',
  },
]
