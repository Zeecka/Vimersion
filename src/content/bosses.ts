import type { Challenge } from '../game/types'

/**
 * Zone bosses — multi-stage fights in a single buffer with a keystroke budget
 * (the boss "HP bar"). Stage goals ratchet: undo can't rewind a cleared stage.
 *
 * Authoring notes: par = optimal keydown count + ~10% slack;
 * keystrokeBudget ≈ ceil(par · 2.2) — just past the 1★ threshold, so any win
 * earns at least one star but three demand real keystroke economy.
 */

/** World 1 boss — tests everything Tier 1 taught: dd, i, x, o, Esc.
 *  Optimal: dd dd (4) · $ i e Esc j x (6) · o onward! Esc (9) = 19 keys. */
export const gatekeeper: Challenge = {
  id: 'boss-gatekeeper',
  tier: 1,
  kind: 'boss',
  title: 'The Gatekeeper',
  brief: 'BOSS: The Gatekeeper blocks World 1. First — purge both SPAM lines with dd.',
  taughtCommands: ['dd', 'i', 'x', 'o', 'esc'],
  startText: [
    'The gate of World 1.',
    'SPAM: win a free mechanical keyboard',
    'SPAM: hot singles in your buffer',
    'the guard is aslep',
    'gate: lockedd',
  ].join('\n'),
  startCursor: { line: 2, ch: 0 },
  goal: {
    targetText: ['The gate of World 1.', 'the guard is aslep', 'gate: lockedd'].join('\n'),
    describe: 'Stage 1: both SPAM lines are gone',
  },
  stages: [
    {
      brief: "Stage 2 — fix the guard's report: 'aslep' → 'asleep', then 'lockedd' → 'locked'.",
      goal: {
        targetText: ['The gate of World 1.', 'the guard is asleep', 'gate: locked'].join('\n'),
        describe: 'Stage 2: both typos fixed',
      },
    },
    {
      brief: "Stage 3 — open a new line at the bottom with o and declare: onward!",
      goal: {
        targetText: ['The gate of World 1.', 'the guard is asleep', 'gate: locked', 'onward!'].join('\n'),
        describe: 'Stage 3: the buffer ends with onward!',
      },
    },
  ],
  par: 21,
  keystrokeBudget: 47,
  hint: 'dd deletes a line. $ jumps to line end, i inserts before the cursor, x deletes under it. o opens a line below — Esc when done.',
}

/** World 3 boss — chains the tier's grammar: ciw rename, daw dedupe, dd cleanup.
 *  Optimal: ciwcount (8) · <Esc> j wwww daw (9) · j dd (3) = 20 keys. */
export const gauntlet: Challenge = {
  id: 'boss-gauntlet',
  tier: 3,
  kind: 'boss',
  title: 'The Refactor Gauntlet',
  brief: 'BOSS: This function fights back. Stage 1 — rename cnt to count with ciw.',
  taughtCommands: ['iw', 'aw', 'c-motion', 'dd'],
  startText: [
    'let cnt = fetchItems()',
    'let msg = "Ready to to launch"',
    '// legacy init, delete me',
    'print(msg)',
  ].join('\n'),
  startCursor: { line: 1, ch: 5 }, // inside "cnt"
  goal: {
    targetText: [
      'let count = fetchItems()',
      'let msg = "Ready to to launch"',
      '// legacy init, delete me',
      'print(msg)',
    ].join('\n'),
    describe: 'Stage 1: the variable is named count',
  },
  stages: [
    {
      brief: 'Stage 2 — the message stutters. Delete the duplicated to with daw.',
      goal: {
        targetText: [
          'let count = fetchItems()',
          'let msg = "Ready to launch"',
          '// legacy init, delete me',
          'print(msg)',
        ].join('\n'),
        describe: 'Stage 2: "Ready to launch" — no stutter',
      },
    },
    {
      brief: 'Stage 3 — finish it: kill the legacy comment line with dd.',
      goal: {
        targetText: ['let count = fetchItems()', 'let msg = "Ready to launch"', 'print(msg)'].join('\n'),
        describe: 'Stage 3: the legacy comment is gone',
      },
    },
  ],
  par: 22,
  keystrokeBudget: 49,
  hint: 'ciw changes the word under the cursor. daw deletes a word plus its space (w hops words to reach it). dd kills a whole line.',
}

export const BOSSES: Challenge[] = [gatekeeper, gauntlet]
