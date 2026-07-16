import type { Challenge } from '../game/types'
import { allOf, bufferEquals, recordedMacro } from '../game/verify'

/**
 * Tier 5 — "Superpowers". The force multipliers: the dot command, named
 * registers, Ctrl-a arithmetic, gn, and the crown jewel — macros. These are
 * what separate "I know Vim" from "Vim thinks for me": one edit, repeated
 * everywhere, for free.
 *
 * Authoring note: register/macro challenges are "method-forced" — the buffer
 * outcome is only reachable at par with the intended register/macro, because
 * intervening deletes clobber the unnamed register. Macro challenges verify
 * honestly with `bufferEquals(target) && recordedMacro('a')`, so a hand-edit
 * that never records a macro can't win. Every par is proven in tests/par.test.ts.
 */
export const tier5: Challenge[] = [
  {
    id: 't5-dot',
    tier: 5,
    title: 'Rubber Stamp',
    brief: 'Three statements are missing a trailing semicolon. Fix the first, then let the dot command stamp the rest.',
    taughtCommands: ['dot'],
    startText: ['const a = read()', 'const b = read()', 'const c = read()'].join('\n'),
    goal: {
      targetText: ['const a = read();', 'const b = read();', 'const c = read();'].join('\n'),
      describe: 'Every line ends with a semicolon',
    },
    par: 7, // A;<Esc> j. j.
    hint: '`A` appends at line end; type ; then `Esc`. The `.` command replays that entire change — so it becomes `j``.`  `j``.`',
  },
  {
    id: 't5-dot-op',
    tier: 5,
    title: 'Weed Whacker',
    brief: 'Rip out every DEBUG token. `daw` the first, then hop with `;` and replay with `.` — no retyping.',
    taughtCommands: ['dot', 'aw', 'f'],
    startText: 'foo DEBUG bar DEBUG baz DEBUG qux',
    goal: { targetText: 'foo bar baz qux', describe: 'All three DEBUG words are gone' },
    par: 9, // fD daw ;. ;.
    hint: '`fD` lands on a DEBUG; `daw` deletes the word and its space. `;` repeats the find, `.` repeats the delete — chain `;``.` `;``.`',
  },
  {
    id: 't5-gn',
    tier: 5,
    title: 'Ghostwriter',
    brief: 'Rename draft to final in all three spots. `*` arms the search; `cgn` changes a match, and `.` just keeps going.',
    taughtCommands: ['gn', 'dot'],
    startText: ['draft = load()', 'print(draft)', 'return draft'].join('\n'),
    goal: {
      targetText: ['final = load()', 'print(final)', 'return final'].join('\n'),
      describe: 'Every draft now reads final',
    },
    par: 12, // * cgnfinal<Esc> . .
    hint: '`*` searches the word under the cursor. `cgn` changes the next match; because `.` repeats a change, one `.` per remaining match finishes the job (it even wraps).',
  },
  {
    id: 't5-incr',
    tier: 5,
    title: 'Level Up',
    brief: 'The player is stuck at level 7 and needs to reach 10. Do it in two keystrokes — no insert mode.',
    taughtCommands: ['incr', 'count'],
    startText: 'player.level = 7',
    goal: { targetText: 'player.level = 10', describe: 'Level reads 10' },
    par: 2, // 3<C-a>
    hint: '`Ctrl-a` increments the next number on the line. Prefix it with a count: `3` then `Ctrl-a` adds three.',
  },
  {
    id: 't5-reg-named',
    tier: 5,
    title: 'Two Pockets',
    brief: 'Copy KEEPER into register a, delete both scratch lines, then paste it back from a — the unnamed register won’t survive the deletes.',
    taughtCommands: ['registers', 'dd'],
    startText: ['KEEPER = alpha', 'scratch_1 = x', 'scratch_2 = y', '# paste KEEPER below:'].join('\n'),
    goal: {
      targetText: ['KEEPER = alpha', '# paste KEEPER below:', 'KEEPER = alpha'].join('\n'),
      describe: 'Both scratch lines gone; KEEPER copied under the comment',
    },
    par: 12, // "ayy j dd dd "ap
    hint: '`"ayy` yanks the line into register a. After two `dd`’s clobber the unnamed register, `"ap` pastes straight from a.',
  },
  {
    id: 't5-reg-zero',
    tier: 5,
    title: 'Safety Copy',
    brief: 'Yank MASTER, delete the temp line, then paste MASTER — but a delete just overwrote the unnamed register. Reach for `"0`.',
    taughtCommands: ['reg-zero'],
    startText: ['MASTER = base', 'temp = junk', '# restore MASTER here:'].join('\n'),
    goal: {
      targetText: ['MASTER = base', '# restore MASTER here:', 'MASTER = base'].join('\n'),
      describe: 'temp gone; MASTER restored under the comment',
    },
    par: 8, // yy j dd "0p
    hint: 'Every yank also lands in register 0, and deletes never touch it. So after `yy` and a `dd`, `"0p` still pastes what you yanked.',
  },
  {
    id: 't5-blackhole',
    tier: 5,
    title: 'Black Hole',
    brief: 'You’ve yanked WANTED. Delete the noise line WITHOUT losing your yank by sending it to the black-hole register `"_`.',
    taughtCommands: ['blackhole'],
    startText: ['WANTED = gold', 'noise = static', '# duplicate WANTED:'].join('\n'),
    goal: {
      targetText: ['WANTED = gold', '# duplicate WANTED:', 'WANTED = gold'].join('\n'),
      describe: 'noise gone; WANTED duplicated under the comment',
    },
    par: 8, // yy j "_dd p
    hint: '`"_dd` deletes into the black hole — the unnamed register keeps your yank, so a plain `p` still pastes WANTED.',
  },
  {
    id: 't5-reg-append',
    tier: 5,
    title: 'Magpie',
    brief: 'Collect both pick lines into register a (uppercase `A` appends), then drop them together under the comment.',
    taughtCommands: ['reg-append', 'registers'],
    startText: ['pick RED', 'drop this', 'pick BLUE', 'drop that', '# collected colors:'].join('\n'),
    goal: {
      targetText: ['pick RED', 'drop this', 'pick BLUE', 'drop that', '# collected colors:', 'pick RED', 'pick BLUE'].join(
        '\n',
      ),
      describe: 'Both pick lines copied under the comment, in order',
    },
    par: 14, // "ayy jj "Ayy G "ap
    hint: '`"ayy` starts register a; `"Ayy` (capital A) APPENDS to it instead of replacing. Gather, then `"ap` pastes the whole stack.',
  },
  {
    id: 't5-macro',
    tier: 5,
    title: 'Port Authority',
    brief: 'Bump every PORT by one. Record the fix once into register a with `q`, then replay it with `@a`.',
    taughtCommands: ['macro', 'macro-replay', 'incr'],
    startText: ['PORT=8080', 'PORT=8090', 'PORT=9000'].join('\n'),
    goal: {
      predicate: allOf(bufferEquals(['PORT=8081', 'PORT=8091', 'PORT=9001'].join('\n')), recordedMacro('a')),
      describe: 'Every port incremented — via a recorded macro',
    },
    par: 9, // qa<C-a>jq @a @a
    hint: '`qa` starts recording into a. Do the edit for ONE line (`Ctrl-a` then `j`), press `q` to stop, then `@a` replays it on each remaining line.',
  },
  {
    id: 't5-macro-scale',
    tier: 5,
    title: 'Take Five',
    brief: 'Turn five plain tasks into a checklist. Record the "[ ] " prefix once, then let `@a` and `@@` do the other four.',
    taughtCommands: ['macro', 'macro-replay'],
    startText: ['deploy the build', 'run the tests', 'tag the release', 'update the docs', 'notify the team'].join('\n'),
    goal: {
      predicate: allOf(
        bufferEquals(
          ['[ ] deploy the build', '[ ] run the tests', '[ ] tag the release', '[ ] update the docs', '[ ] notify the team'].join(
            '\n',
          ),
        ),
        recordedMacro('a'),
      ),
      describe: 'All five tasks boxed — via a recorded macro',
    },
    par: 18, // qaI[ ] <Esc>jq @a @@ @@ @@
    hint: 'Record `I`[ ] `Esc``j` into a. `@a` plays it once; `@@` then repeats the LAST macro — tap `@@` for each line left.',
  },
  {
    id: 't5-macro-text',
    tier: 5,
    title: 'One-Take Wonder',
    brief: 'Each build must go from "100 pending" to "101 shipped": increment AND relabel. One macro handles both — search-and-replace can’t do the math.',
    taughtCommands: ['macro', 'macro-replay', 'incr'],
    startText: ['build 100 pending', 'build 100 pending', 'build 100 pending'].join('\n'),
    goal: {
      predicate: allOf(
        bufferEquals(['build 101 shipped', 'build 101 shipped', 'build 101 shipped'].join('\n')),
        recordedMacro('a'),
      ),
      describe: 'Every build bumped to 101 and marked shipped — via a recorded macro',
    },
    par: 22, // qa0<C-a>$ciwshipped<Esc>jq @a @a
    hint: 'Record: `0` returns to the line start, `Ctrl-a` bumps the number, `$` jumps to the last word, `ciw`shipped rewrites it, `Esc`, `j`. Stop with `q`, then `@a` `@a`.',
  },
]
