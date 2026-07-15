import type { Challenge } from '../game/types'

/**
 * Tier 6 — "Legend". Power idioms that operate on whole files at once:
 * :g / :v / :sort / :normal, case operators, joins, visual-block column edits,
 * paragraph objects and gq reflow. This is the editor doing bulk work on your
 * behalf — the difference between editing text and directing it.
 *
 * Every par is proven by a reference solution in tests/par.test.ts (ex-command
 * and :normal keystrokes all count — the panel lives inside the editor).
 */
export const tier6: Challenge[] = [
  {
    id: 't6-join',
    tier: 6,
    title: 'Stitch',
    brief: 'Collapse this three-line object literal onto one line with a counted J.',
    taughtCommands: ['J', 'count'],
    startText: ['const opts = {', '  cache: true', '}'].join('\n'),
    goal: { targetText: 'const opts = { cache: true }', describe: 'All three lines joined into one' },
    par: 2, // 3J
    hint: 'J joins the next line onto this one, tidying the whitespace to a single space. 3J folds three lines together.',
  },
  {
    id: 't6-gjoin',
    tier: 6,
    title: 'Weld',
    brief: 'Reassemble the URL. gJ joins like J but adds NO space — exactly what you want here.',
    taughtCommands: ['gJ'],
    startText: ['https', '://', 'example.com'].join('\n'),
    goal: { targetText: 'https://example.com', describe: 'One seamless URL, no stray spaces' },
    par: 3, // 3gJ
    hint: 'Plain J would wedge spaces into the URL. gJ (g then J) joins verbatim; 3gJ welds three lines.',
  },
  {
    id: 't6-upper',
    tier: 6,
    title: 'All Caps',
    brief: 'The log level should SHOUT. Uppercase just the word debug with the gU operator.',
    taughtCommands: ['case-upper'],
    startText: 'log.level = debug',
    startCursor: { line: 1, ch: 12 }, // on "debug"
    goal: { targetText: 'log.level = DEBUG', describe: 'debug is now DEBUG' },
    par: 4, // gUiw
    hint: 'gU is the uppercase operator; give it a motion or text object. gUiw uppercases the inner word under the cursor.',
  },
  {
    id: 't6-toggle',
    tier: 6,
    title: 'Case Flip',
    brief: 'Someone held Caps Lock wrong. Flip the case of the whole line with g~ to the end.',
    taughtCommands: ['case-toggle'],
    startText: 'hello WORLD',
    goal: { targetText: 'HELLO world', describe: 'Every letter’s case is inverted' },
    par: 3, // g~$
    hint: 'g~ toggles case over a motion. g~$ runs it from the cursor to the end of the line.',
  },
  {
    id: 't6-sort',
    tier: 6,
    title: 'Alphabetize',
    brief: 'These imports are out of order. Sort every line with a single :sort.',
    taughtCommands: ['sort'],
    startText: ['import zebra', 'import mango', 'import apple', 'import cherry'].join('\n'),
    goal: {
      targetText: ['import apple', 'import cherry', 'import mango', 'import zebra'].join('\n'),
      describe: 'Imports in alphabetical order',
    },
    par: 6, // :sort<CR>
    hint: ':sort with no range sorts the whole buffer alphabetically. One command, any number of lines.',
  },
  {
    id: 't6-sort-u',
    tier: 6,
    title: 'Roll Call',
    brief: 'The attendee list has duplicates. Sort AND dedupe in one shot with :sort u.',
    taughtCommands: ['sort'],
    startText: ['alice', 'bob', 'alice', 'carol', 'bob'].join('\n'),
    goal: { targetText: ['alice', 'bob', 'carol'].join('\n'), describe: 'One of each name, sorted' },
    par: 8, // :sort u<CR>
    hint: 'The u flag on :sort keeps only unique lines. :sort u sorts and removes duplicates together.',
  },
  {
    id: 't6-global-del',
    tier: 6,
    title: 'Fumigate',
    brief: 'Strip every DEBUG line from the log in one pass with :g/DEBUG/d.',
    taughtCommands: ['global'],
    startText: [
      'INFO app started',
      'DEBUG cache miss',
      'INFO request handled',
      'DEBUG slow query',
      'INFO done',
      'DEBUG teardown',
    ].join('\n'),
    goal: {
      targetText: ['INFO app started', 'INFO request handled', 'INFO done'].join('\n'),
      describe: 'Only the INFO lines remain',
    },
    par: 11, // :g/DEBUG/d<CR>
    hint: ':g/pattern/d runs the delete command on every line matching the pattern. :g/DEBUG/d clears them all at once.',
  },
  {
    id: 't6-vglobal',
    tier: 6,
    title: 'Survivors',
    brief: 'Keep only the FAIL lines. :v is :g inverted — it acts on lines that DON’T match.',
    taughtCommands: ['vglobal'],
    startText: ['ok: login', 'FAIL: payment', 'ok: logout', 'FAIL: refund', 'ok: browse'].join('\n'),
    goal: { targetText: ['FAIL: payment', 'FAIL: refund'].join('\n'), describe: 'Only the FAIL lines survive' },
    par: 10, // :v/FAIL/d<CR>
    hint: ':v/pattern/d (short for :g!) deletes every line that does NOT match. :v/FAIL/d keeps the failures.',
  },
  {
    id: 't6-global-normal',
    tier: 6,
    title: 'Conductor',
    brief: 'Uppercase the label on every task line — and only task lines. Feed a normal-mode edit to :g with :normal.',
    taughtCommands: ['global', 'normal', 'case-upper'],
    startText: ['task alpha', 'note x', 'task beta', 'note y', 'task gamma'].join('\n'),
    goal: {
      targetText: ['task ALPHA', 'note x', 'task BETA', 'note y', 'task GAMMA'].join('\n'),
      describe: 'The word after each task is uppercased; notes untouched',
    },
    par: 21, // :g/task/normal wgUiw<CR>
    hint: ':g/task/normal <keys> runs those normal-mode keys on each matching line. wgUiw hops to the second word and uppercases it.',
  },
  {
    id: 't6-block-insert',
    tier: 6,
    title: 'Comment Block',
    brief: 'Comment out all three config lines at once: visual-block down the left edge, then I to insert on every row.',
    taughtCommands: ['block-i', 'ctrl-v'],
    startText: ['name = "app"', 'port = 8080', 'debug = true'].join('\n'),
    goal: {
      targetText: ['# name = "app"', '# port = 8080', '# debug = true'].join('\n'),
      describe: 'Every line prefixed with "# "',
    },
    par: 7, // <C-v>jj I# <Esc>
    hint: 'Ctrl-v starts a block; jj extends it down the first column. I types before the block, and Esc mirrors it onto every line.',
  },
  {
    id: 't6-block-append',
    tier: 6,
    title: 'Line ’Em Up',
    brief: 'Add a trailing comma to every row. The lines are ragged, so block-select to the line ENDS with $ then A.',
    taughtCommands: ['block-a', 'ctrl-v'],
    startText: ['alpha', 'beta', 'gamma'].join('\n'),
    goal: { targetText: ['alpha,', 'beta,', 'gamma,'].join('\n'), describe: 'Every line ends with a comma' },
    par: 7, // <C-v>jj $A,<Esc>
    hint: 'Ctrl-v, jj, then $ stretches the block to each line’s end regardless of length. A appends, and Esc applies it to all rows.',
  },
  {
    id: 't6-para',
    tier: 6,
    title: 'Paragraph Sweep',
    brief: 'Delete the entire first paragraph — text plus its blank line — with one dap.',
    taughtCommands: ['ip'],
    startText: ['alpha one', 'alpha two', '', 'beta one', 'beta two', '', 'gamma'].join('\n'),
    startCursor: { line: 1, ch: 0 },
    goal: {
      targetText: ['beta one', 'beta two', '', 'gamma'].join('\n'),
      describe: 'The first paragraph and its trailing blank line are gone',
    },
    par: 3, // dap
    hint: 'A paragraph is a block of lines between blanks. dap deletes "a paragraph" including the blank line after it; dip would leave the blank.',
  },
  {
    id: 't6-gq',
    tier: 6,
    title: 'Reflow',
    brief: 'This line runs too long. Set a width with :set tw=20, then reflow the paragraph with gqip.',
    taughtCommands: ['gq'],
    startText: 'alpha beta gamma delta epsilon zeta',
    goal: {
      targetText: ['alpha beta gamma', 'delta epsilon zeta'].join('\n'),
      describe: 'The text is rewrapped to fit within 20 columns',
    },
    par: 15, // :set tw=20<CR> gqip
    hint: 'gq is the reformat operator; it wraps to textwidth. Set that first with :set tw=20, then gqip reflows the inner paragraph.',
  },
  {
    id: 't6-replace',
    tier: 6,
    title: 'Redact',
    brief: 'Mask the six-character secret with asterisks. r replaces one char in place — give it a count to blitz all six.',
    taughtCommands: ['replace'],
    startText: 'secret: abcdef',
    startCursor: { line: 1, ch: 8 }, // on the 'a'
    goal: { targetText: 'secret: ******', describe: 'The secret is six asterisks' },
    par: 3, // 6r*
    hint: 'r replaces the single character under the cursor without entering insert mode. 6r* overwrites six characters with *.',
  },
]
