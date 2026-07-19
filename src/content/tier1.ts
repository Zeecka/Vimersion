import type { Challenge } from '../game/types'
import { allOf, bufferEquals, inMode } from '../game/verify'

/** Char currently under the cursor (normal-mode "on" a character). */
function charUnderCursor(view: import('@codemirror/view').EditorView): string {
  const pos = view.state.selection.main.head
  return view.state.doc.sliceString(pos, pos + 1)
}

// Text reused by the undo challenge (start === target: delete then restore).
const UNDO_TEXT = ['function greet() {', '  return "hi"', '}'].join('\n')

/**
 * Tier 1 — "Survive". Teaches modes (i/a/o/Esc), motion (hjkl), and the first
 * edits (x, dd, u). No :w/:q — there is no file to write in a browser sandbox,
 * which is exactly why those are omitted here.
 */
export const tier1: Challenge[] = [
  {
    id: 't1-first-blood',
    tier: 1,
    title: 'First Blood',
    brief: 'There is one character too many. Delete it with `x`.',
    taughtCommands: ['x'],
    startText: 'hello worldd',
    startCursor: { line: 1, ch: 11 }, // on the extra trailing "d"
    goal: { targetText: 'hello world', describe: 'Buffer reads: hello world' },
    par: 1,
    hint: '`x` deletes the character under the block cursor. Press it once.',
  },
  {
    id: 't1-navigate',
    tier: 1,
    title: 'Home Row Hero',
    brief: 'Move the cursor onto the @ using `h` `j` `k` `l`.',
    taughtCommands: ['h', 'j', 'k', 'l'],
    startText: ['.........', '....@....', '.........'].join('\n'),
    startCursor: { line: 1, ch: 0 },
    goal: { predicate: (v) => charUnderCursor(v) === '@', describe: 'Cursor sits on the @' },
    par: 5,
    hint: '`h` = left, `j` = down, `k` = up, `l` = right. Go down one line, then right to the @.',
  },
  {
    id: 't1-insert',
    tier: 1,
    title: 'Mind the Gap',
    brief: 'Insert a space so it reads "hello world". Use `i`, type `Space`, then leave with `Esc`.',
    taughtCommands: ['i', 'esc'],
    startText: 'helloworld',
    startCursor: { line: 1, ch: 5 }, // on the "w"
    // Only a win once you've LEFT insert mode: the space alone would trigger
    // mid-type, so require normal mode — the player must press Esc to finish.
    goal: {
      predicate: allOf(bufferEquals('hello world'), inMode('normal')),
      describe: 'Buffer reads "hello world" — and you are back in normal mode',
    },
    par: 3,
    hint: 'Cursor on the w → press `i`, type `Space`, then press `Esc` to leave insert mode.',
  },
  {
    id: 't1-append',
    tier: 1,
    title: 'Big Finish',
    brief: 'Append a `!` to the end so it reads "You win!". Use `a`, then `Esc`.',
    taughtCommands: ['a', 'esc'],
    startText: 'You win',
    startCursor: { line: 1, ch: 6 }, // on the last "n"
    goal: { targetText: 'You win!', describe: 'Buffer reads: You win!' },
    par: 3,
    hint: '`a` inserts AFTER the cursor. Put it on the last letter, press `a`, type `!`, then `Esc`.',
  },
  {
    id: 't1-delete-line',
    tier: 1,
    title: 'Spam Filter',
    brief: 'Delete the entire spam line with `dd`.',
    taughtCommands: ['dd'],
    startText: ['keep this', 'BUY N0W!!! cheap pixels', 'and keep this too'].join('\n'),
    startCursor: { line: 2, ch: 0 },
    goal: { targetText: ['keep this', 'and keep this too'].join('\n'), describe: 'The spam line is gone' },
    par: 2,
    hint: '`dd` deletes the whole current line. The cursor already sits on it.',
  },
  {
    id: 't1-undo',
    tier: 1,
    title: 'Second Thoughts',
    brief: 'Delete any line with `dd`, then restore the file exactly with `u`.',
    taughtCommands: ['dd', 'u'],
    startText: UNDO_TEXT,
    startCursor: { line: 1, ch: 0 },
    // Two ratcheted stages: the file must first CHANGE, then be restored —
    // a single targetText === startText goal would be met before any keypress.
    goal: {
      predicate: (v) => v.state.doc.toString() !== UNDO_TEXT,
      describe: 'A line is deleted — the file no longer matches',
    },
    stages: [
      {
        brief: 'Now press `u` — restore the file exactly as it was.',
        goal: { targetText: UNDO_TEXT, describe: 'File restored to its original state' },
      },
    ],
    par: 3,
    hint: 'Press `dd` to delete a line — then `u` to undo it. `u` is your best friend.',
  },
  {
    id: 't1-open-line',
    tier: 1,
    title: 'Room Below',
    brief: 'Open a new line below and type `world`. Use `o`, then `Esc`.',
    taughtCommands: ['o', 'esc'],
    startText: 'hello',
    startCursor: { line: 1, ch: 0 },
    goal: { targetText: ['hello', 'world'].join('\n'), describe: 'A second line reads: world' },
    par: 7,
    hint: '`o` opens a new line BELOW and drops you into insert mode. Type `world`, then `Esc`.',
  },
  {
    id: 't1-capstone',
    tier: 1,
    title: 'Cleanup Crew',
    brief: 'Remove both TODO lines. Leave only the print statement.',
    taughtCommands: ['dd', 'j', 'k'],
    startText: ['TODO delete this line', 'print("Hello, Vim")', 'TODO and this one'].join('\n'),
    startCursor: { line: 1, ch: 0 },
    goal: { targetText: 'print("Hello, Vim")', describe: 'Only the print line remains' },
    par: 5,
    hint: '`dd` on the first TODO, then move down (`j`) onto the second TODO and `dd` again.',
  },
]
