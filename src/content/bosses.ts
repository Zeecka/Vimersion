import type { Challenge } from '../game/types'
import { allOf, bufferEquals, recordedMacro } from '../game/verify'

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
  brief: 'BOSS: The Gatekeeper blocks World 1. First — purge both SPAM lines with `dd`.',
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
      brief: "Stage 2 — fix the guard's report: 'aslep' → `asleep`, then 'lockedd' → `locked`.",
      goal: {
        targetText: ['The gate of World 1.', 'the guard is asleep', 'gate: locked'].join('\n'),
        describe: 'Stage 2: both typos fixed',
      },
    },
    {
      brief: "Stage 3 — open a new line at the bottom with `o` and declare: `onward!`",
      goal: {
        targetText: ['The gate of World 1.', 'the guard is asleep', 'gate: locked', 'onward!'].join('\n'),
        describe: 'Stage 3: the buffer ends with onward!',
      },
    },
  ],
  par: 21,
  keystrokeBudget: 47,
  hint: '`dd` deletes a line. `$` jumps to line end, `i` inserts before the cursor, `x` deletes under it. `o` opens a line below — `Esc` when done.',
}

/** World 2 boss — the whole "Comfortable" kit in one proofread: change-word
 *  (cw) twice with a line delete (dd) between, navigating by line.
 *  Optimal: cwthe<Esc> (6) · jdd (3) · cwsave<Esc> (7) = 16 keys. */
export const proofreader: Challenge = {
  id: 'boss-proofreader',
  tier: 2,
  kind: 'boss',
  title: 'The Proofreader',
  brief: 'BOSS: The Proofreader guards World 2. Stage 1 — fix the typo: change `teh` to `the` with `cw`.',
  taughtCommands: ['cw', 'w', 'dd'],
  startText: ['teh readme file', 'REMOVE ME', 'saev the draft'].join('\n'),
  startCursor: { line: 1, ch: 0 },
  goal: {
    targetText: ['the readme file', 'REMOVE ME', 'saev the draft'].join('\n'),
    describe: 'Stage 1: the first word reads "the"',
  },
  stages: [
    {
      brief: 'Stage 2 — a whole line has to go. Drop down a line and delete `REMOVE ME` with `dd`.',
      goal: {
        targetText: ['the readme file', 'saev the draft'].join('\n'),
        describe: 'Stage 2: the REMOVE ME line is gone',
      },
    },
    {
      brief: 'Stage 3 — one more typo. Change `saev` to `save` with `cw`.',
      goal: {
        targetText: ['the readme file', 'save the draft'].join('\n'),
        describe: 'Stage 3: the buffer reads "save the draft"',
      },
    },
  ],
  par: 18,
  keystrokeBudget: 40,
  hint: '`cw` changes the word under the cursor — type the fix, then `Esc`. `j` moves down a line; `dd` deletes a whole line.',
}

/** World 3 boss — chains the tier's grammar: ciw rename, daw dedupe, dd cleanup.
 *  Optimal: ciwcount (8) · <Esc> j wwww daw (9) · j dd (3) = 20 keys. */
export const gauntlet: Challenge = {
  id: 'boss-gauntlet',
  tier: 3,
  kind: 'boss',
  title: 'The Refactor Gauntlet',
  brief: 'BOSS: This function fights back. Stage 1 — rename cnt to `count` with `ciw`.',
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
      brief: 'Stage 2 — the message stutters. Delete the duplicated to with `daw`.',
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
      brief: 'Stage 3 — finish it: kill the legacy comment line with `dd`.',
      goal: {
        targetText: ['let count = fetchItems()', 'let msg = "Ready to launch"', 'print(msg)'].join('\n'),
        describe: 'Stage 3: the legacy comment is gone',
      },
    },
  ],
  par: 22,
  keystrokeBudget: 49,
  hint: '`ciw` changes the word under the cursor. `daw` deletes a word plus its space (`w` hops words to reach it). `dd` kills a whole line.',
}

/** World 4 boss — log-file surgery with the whole Seeker kit: search-and-
 *  destroy, mass-substitute, precision bracket work.
 *  Optimal: /eror<CR>dd n dd (11) · :%s/warn/WARN/g<CR> (16) · j f( d% x (6) = 33. */
export const grepgut: Challenge = {
  id: 'boss-grepgut',
  tier: 4,
  kind: 'boss',
  title: 'Grep & Gut',
  brief: 'BOSS: This log lies. Stage 1 — hunt down BOTH [eror] lines with `/eror` and delete them (`n` finds the next).',
  taughtCommands: ['search', 'n', 'sub-all', 'percent', 'dd'],
  startText: [
    '[boot] service starting',
    '[warn] legacy_mode enabled',
    '[info] user login: admin',
    '[eror] connection refused',
    '[info] retry in 5s',
    '[eror] connection refused',
    '[info] connected',
    '[warn] legacy_mode enabled',
    '[stat] uptime 99.9% (target: 99.5%)',
    '[done] service ready',
  ].join('\n'),
  goal: {
    targetText: [
      '[boot] service starting',
      '[warn] legacy_mode enabled',
      '[info] user login: admin',
      '[info] retry in 5s',
      '[info] connected',
      '[warn] legacy_mode enabled',
      '[stat] uptime 99.9% (target: 99.5%)',
      '[done] service ready',
    ].join('\n'),
    describe: 'Stage 1: both [eror] lines are gone',
  },
  stages: [
    {
      brief: 'Stage 2 — promote every [warn] tag to [WARN] in one blast: `:%s/warn/WARN/g`.',
      goal: {
        targetText: [
          '[boot] service starting',
          '[WARN] legacy_mode enabled',
          '[info] user login: admin',
          '[info] retry in 5s',
          '[info] connected',
          '[WARN] legacy_mode enabled',
          '[stat] uptime 99.9% (target: 99.5%)',
          '[done] service ready',
        ].join('\n'),
        describe: 'Stage 2: both warn tags read WARN',
      },
    },
    {
      brief: 'Stage 3 — the stat line leaks internals. Land on the ( with `f(`, gut it with `d%`, and `x` the leftover space.',
      goal: {
        targetText: [
          '[boot] service starting',
          '[WARN] legacy_mode enabled',
          '[info] user login: admin',
          '[info] retry in 5s',
          '[info] connected',
          '[WARN] legacy_mode enabled',
          '[stat] uptime 99.9%',
          '[done] service ready',
        ].join('\n'),
        describe: 'Stage 3: the (target: …) parenthetical is gone',
      },
    },
  ],
  par: 36,
  keystrokeBudget: 80,
  hint: '`/pattern` then `n` hops matches; `dd` per hit. `:%s/old/new/g` fixes the whole file. `d%` deletes from a bracket to its partner.',
}

/** World 5 boss — the whole Superpowers kit in one machine: record a macro to
 *  arm the counters, register-juggle to salvage a template past a delete, then
 *  dot-stamp the finish.
 *  Optimal: qa<C-a>jq @a @a (9) · yy j "_dd p (8) · gg A;<Esc> j. j. (9) = 26. */
export const automaton: Challenge = {
  id: 'boss-automaton',
  tier: 5,
  kind: 'boss',
  title: 'The Automaton',
  brief: 'BOSS: The Automaton runs on repetition. Stage 1 — record a macro (`qa`…`q`) that bumps a count with `Ctrl-a`, then `@a` it down the column.',
  taughtCommands: ['macro', 'macro-replay', 'incr', 'blackhole', 'registers', 'dot'],
  startText: ['count = 0', 'count = 0', 'count = 0', 'KEEP = base', 'trash = tmp', '# end'].join('\n'),
  goal: {
    predicate: allOf(
      bufferEquals(['count = 1', 'count = 1', 'count = 1', 'KEEP = base', 'trash = tmp', '# end'].join('\n')),
      recordedMacro('a'),
    ),
    describe: 'Stage 1: every count reads 1 — via a recorded macro',
  },
  stages: [
    {
      brief: 'Stage 2 — yank KEEP, then black-hole (`"_dd`) the trash line so your yank survives, and paste KEEP under # end.',
      goal: {
        targetText: ['count = 1', 'count = 1', 'count = 1', 'KEEP = base', '# end', 'KEEP = base'].join('\n'),
        describe: 'Stage 2: trash gone, KEEP duplicated under # end',
      },
    },
    {
      brief: 'Stage 3 — finish the counters: append `;` to the first, then dot your way down (`j``.` `j``.`).',
      goal: {
        targetText: ['count = 1;', 'count = 1;', 'count = 1;', 'KEEP = base', '# end', 'KEEP = base'].join('\n'),
        describe: 'Stage 3: all three counters end with a semicolon',
      },
    },
  ],
  par: 26,
  keystrokeBudget: 58,
  hint: '`qa``Ctrl-a``j``q` records a one-line bump; `@a` replays it. `"_dd` deletes without touching your yank. `A`; then `j``.` `j``.` stamps the semicolons.',
}

/** World 6 boss — bulk-editing legend: purge with :g, reorder with :sort, then
 *  comment the survivors with a visual-block insert.
 *  Optimal: :g/DEBUG/d<CR> (11) · :sort<CR> (6) · gg <C-v>jjj I# <Esc> (10) = 27. */
export const archivist: Challenge = {
  id: 'boss-archivist',
  tier: 6,
  kind: 'boss',
  title: 'The Archivist',
  brief: 'BOSS: The Archivist demands order. Stage 1 — purge every DEBUG line in one sweep with `:g/DEBUG/d`.',
  taughtCommands: ['global', 'sort', 'block-i', 'ctrl-v'],
  startText: ['zeta = 3', 'alpha = 1', 'DEBUG trace', 'beta = 2', 'DEBUG trace', 'gamma = 4'].join('\n'),
  goal: {
    targetText: ['zeta = 3', 'alpha = 1', 'beta = 2', 'gamma = 4'].join('\n'),
    describe: 'Stage 1: both DEBUG lines are gone',
  },
  stages: [
    {
      brief: 'Stage 2 — put the survivors in order with `:sort`.',
      goal: {
        targetText: ['alpha = 1', 'beta = 2', 'gamma = 4', 'zeta = 3'].join('\n'),
        describe: 'Stage 2: the four settings are sorted',
      },
    },
    {
      brief: 'Stage 3 — comment them all: `gg`, then a visual-block down the column and `I#` to prefix every line.',
      goal: {
        targetText: ['# alpha = 1', '# beta = 2', '# gamma = 4', '# zeta = 3'].join('\n'),
        describe: 'Stage 3: every line is commented with "# "',
      },
    },
  ],
  par: 27,
  keystrokeBudget: 60,
  hint: '`:g/DEBUG/d` deletes matching lines; `:sort` orders them. Then `gg` and `Ctrl-v` `jjj` selects the column — `I#` `Esc` comments every row.',
}

export const BOSSES: Challenge[] = [gatekeeper, proofreader, gauntlet, grepgut, automaton, archivist]
