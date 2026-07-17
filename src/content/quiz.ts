/**
 * Quiz content — a hand-written, multiple-choice question bank grouped by world,
 * mirroring the campaign curriculum. It powers the touch-friendly Quiz mode (the
 * mobile-first way to train, where the real editor isn't practical). Pure data,
 * like challenges: `answer` indexes into `choices`; `explain` is shown after you
 * pick. Keep questions phrased so exactly one choice is unambiguously correct.
 */
export interface QuizQuestion {
  id: string
  tier: number
  prompt: string
  choices: string[]
  answer: number
  explain?: string
}

export const QUIZ: QuizQuestion[] = [
  // ── World 1 · Survive ────────────────────────────────────────────────
  {
    id: 'q1-insert',
    tier: 1,
    prompt: 'Which key enters Insert mode just BEFORE the cursor?',
    choices: ['i', 'a', 'o', 'Esc'],
    answer: 0,
    explain: 'i = insert before the cursor. a appends after it; o opens a new line.',
  },
  {
    id: 'q1-down',
    tier: 1,
    prompt: 'In Normal mode, which key moves the cursor DOWN one line?',
    choices: ['h', 'j', 'k', 'l'],
    answer: 1,
    explain: 'h ← j ↓ k ↑ l →. j has the "hook" that points down.',
  },
  {
    id: 'q1-delchar',
    tier: 1,
    prompt: 'How do you delete the single character under the cursor?',
    choices: ['x', 'dd', 'dw', 'r'],
    answer: 0,
    explain: 'x deletes one character. dd deletes a whole line.',
  },
  {
    id: 'q1-delline',
    tier: 1,
    prompt: 'Which command deletes the ENTIRE current line?',
    choices: ['dl', 'x', 'dd', 'D'],
    answer: 2,
    explain: 'dd deletes the whole line. D deletes from the cursor to end of line.',
  },
  {
    id: 'q1-undo',
    tier: 1,
    prompt: 'You made a mistake in Normal mode. Which key undoes it?',
    choices: ['u', 'r', 'Ctrl-z', 'Esc'],
    answer: 0,
    explain: 'u undoes the last change. Ctrl-r redoes it.',
  },
  {
    id: 'q1-openbelow',
    tier: 1,
    prompt: 'Which key opens a new line BELOW and enters Insert mode?',
    choices: ['O', 'o', 'a', 'i'],
    answer: 1,
    explain: 'o opens below; O (capital) opens above.',
  },

  // ── World 2 · Comfortable ────────────────────────────────────────────
  {
    id: 'q2-word',
    tier: 2,
    prompt: 'Which motion jumps to the start of the NEXT word?',
    choices: ['w', 'b', 'e', '0'],
    answer: 0,
    explain: 'w = next word start, b = back a word, e = end of word.',
  },
  {
    id: 'q2-eol',
    tier: 2,
    prompt: 'Move to the very END of the current line:',
    choices: ['0', '$', '^', 'G'],
    answer: 1,
    explain: '$ jumps to end of line; 0 jumps to the first column.',
  },
  {
    id: 'q2-top',
    tier: 2,
    prompt: 'Jump to the FIRST line of the file:',
    choices: ['gg', 'G', 'H', '0'],
    answer: 0,
    explain: 'gg goes to the top; G goes to the last line.',
  },
  {
    id: 'q2-bottom',
    tier: 2,
    prompt: 'Jump to the LAST line of the file:',
    choices: ['G', 'gg', 'L', '$'],
    answer: 0,
    explain: 'G goes to the last line; gg goes to the first.',
  },
  {
    id: 'q2-find',
    tier: 2,
    prompt: 'What does f followed by a character do?',
    choices: [
      'Jumps to the next occurrence of that character on the line',
      'Finds the character in the whole file',
      'Deletes up to that character',
      'Enters Insert mode at that character',
    ],
    answer: 0,
    explain: 'f{char} moves to the next {char} on the current line; ; repeats it.',
  },
  {
    id: 'q2-changeword',
    tier: 2,
    prompt: 'Which command changes from the cursor to the end of the word?',
    choices: ['cw', 'dw', 'x', 'yw'],
    answer: 0,
    explain: 'cw deletes to the end of the word and drops you into Insert mode.',
  },

  // ── World 3 · Faster ─────────────────────────────────────────────────
  {
    id: 'q3-cip',
    tier: 3,
    prompt: 'Cursor is inside (…). Change everything INSIDE the parentheses:',
    choices: ['ci(', 'ca(', 'di(', 'cw'],
    answer: 0,
    explain: 'ci( changes the text inside the parens; ca( also removes the parens.',
  },
  {
    id: 'q3-daw',
    tier: 3,
    prompt: 'What does daw do?',
    choices: [
      'Deletes a word AND its trailing space',
      'Deletes only the inner word',
      'Deletes to the end of the line',
      'Duplicates a word',
    ],
    answer: 0,
    explain: 'daw = delete "a word" (with surrounding space); diw deletes just the word.',
  },
  {
    id: 'q3-visual',
    tier: 3,
    prompt: 'Which key starts characterwise Visual mode?',
    choices: ['v', 'V', 'Ctrl-v', 'i'],
    answer: 0,
    explain: 'v = characterwise, V = linewise, Ctrl-v = block.',
  },
  {
    id: 'q3-vline',
    tier: 3,
    prompt: 'Select whole LINES visually with:',
    choices: ['V', 'v', 'Ctrl-v', 'S'],
    answer: 0,
    explain: 'Capital V selects entire lines.',
  },
  {
    id: 'q3-ciquote',
    tier: 3,
    prompt: 'Change the text inside double quotes "…":',
    choices: ['ci"', "ci'", 'di"', 'cw'],
    answer: 0,
    explain: 'ci" changes what is between the quotes, from anywhere on the line.',
  },
  {
    id: 'q3-block',
    tier: 3,
    prompt: 'Ctrl-v enters which Visual sub-mode?',
    choices: ['Visual block', 'Visual line', 'Replace', 'Insert'],
    answer: 0,
    explain: 'Ctrl-v is blockwise Visual — great for column edits.',
  },

  // ── World 4 · Seeker ─────────────────────────────────────────────────
  {
    id: 'q4-search',
    tier: 4,
    prompt: 'Search FORWARD for a pattern:',
    choices: ['/', '?', 'n', 'f'],
    answer: 0,
    explain: '/ searches forward, ? searches backward.',
  },
  {
    id: 'q4-next',
    tier: 4,
    prompt: 'Repeat the last search in the SAME direction:',
    choices: ['n', 'N', ';', '*'],
    answer: 0,
    explain: 'n repeats forward, N repeats in the opposite direction.',
  },
  {
    id: 'q4-match',
    tier: 4,
    prompt: 'Jump between a bracket and its match:',
    choices: ['%', '}', ']', 'b'],
    answer: 0,
    explain: '% bounces between matching (), [] and {}.',
  },
  {
    id: 'q4-suball',
    tier: 4,
    prompt: 'Replace EVERY "foo" with "bar" in the whole file:',
    choices: [':%s/foo/bar/g', ':s/foo/bar', ':%s/foo/bar', '/foo'],
    answer: 0,
    explain: '% = all lines, /g = every match on each line.',
  },
  {
    id: 'q4-star',
    tier: 4,
    prompt: 'Search for the word currently under the cursor:',
    choices: ['*', '#', 'n', '/'],
    answer: 0,
    explain: '* searches forward for the word under the cursor (# goes backward).',
  },
  {
    id: 'q4-confirm',
    tier: 4,
    prompt: 'Which substitute asks you to confirm each replacement?',
    choices: [':%s/a/b/gc', ':%s/a/b/g', ':%s/a/b/', ':s/a/b/i'],
    answer: 0,
    explain: 'The c flag prompts y/n/a/q for each match.',
  },

  // ── World 5 · Superpowers ────────────────────────────────────────────
  {
    id: 'q5-recmacro',
    tier: 5,
    prompt: 'Start recording a macro into register a:',
    choices: ['qa', '@a', 'ma', ':reg'],
    answer: 0,
    explain: 'qa starts recording into a; press q again to stop.',
  },
  {
    id: 'q5-playmacro',
    tier: 5,
    prompt: 'Replay the macro stored in register a:',
    choices: ['@a', 'qa', 'ma', '.'],
    answer: 0,
    explain: '@a runs macro a; @@ repeats the last macro you ran.',
  },
  {
    id: 'q5-dot',
    tier: 5,
    prompt: 'Which command repeats your last CHANGE?',
    choices: ['.', '@@', 'u', ';'],
    answer: 0,
    explain: 'The dot (.) repeats the last text-changing command.',
  },
  {
    id: 'q5-incr',
    tier: 5,
    prompt: 'Increment the number under the cursor:',
    choices: ['Ctrl-a', 'Ctrl-x', '+', '='],
    answer: 0,
    explain: 'Ctrl-a adds 1; Ctrl-x subtracts 1.',
  },
  {
    id: 'q5-yankreg',
    tier: 5,
    prompt: 'Which register always holds your most recent YANK (never deletes)?',
    choices: ['"0', '"1', '"_', '"a'],
    answer: 0,
    explain: 'Register 0 holds the last yank; deletes never overwrite it.',
  },
  {
    id: 'q5-blackhole',
    tier: 5,
    prompt: 'Delete text WITHOUT clobbering your yank — which register?',
    choices: ['"_', '"0', '"*', '"a'],
    answer: 0,
    explain: 'The black-hole register "_ discards text so your yank survives.',
  },

  // ── World 6 · Legend ─────────────────────────────────────────────────
  {
    id: 'q6-join',
    tier: 6,
    prompt: 'Join the current line with the one below (with a space):',
    choices: ['J', 'gJ', ':j', '>>'],
    answer: 0,
    explain: 'J joins and inserts a space; gJ joins with no space.',
  },
  {
    id: 'q6-upper',
    tier: 6,
    prompt: 'Uppercase a Visual selection:',
    choices: ['U', 'gu', '~', 'g?'],
    answer: 0,
    explain: 'In Visual mode U uppercases; u lowercases. (gU{motion} in Normal.)',
  },
  {
    id: 'q6-global',
    tier: 6,
    prompt: 'Delete every line that contains TODO:',
    choices: [':g/TODO/d', ':v/TODO/d', ':%d', ':sort'],
    answer: 0,
    explain: ':g/pat/d runs :d on every matching line; :v does the inverse.',
  },
  {
    id: 'q6-sort',
    tier: 6,
    prompt: 'Sort the selected lines alphabetically:',
    choices: [':sort', ':g', ':normal', ':s'],
    answer: 0,
    explain: ':sort orders the range; add u for unique, ! to reverse.',
  },
  {
    id: 'q6-normal',
    tier: 6,
    prompt: 'Run a Normal-mode command on every line in a range:',
    choices: [':normal', ':g', ':call', ':s'],
    answer: 0,
    explain: ':normal feeds keystrokes as if you typed them in Normal mode.',
  },
  {
    id: 'q6-invert',
    tier: 6,
    prompt: 'Which global runs a command on lines that do NOT match?',
    choices: [':v', ':g', ':s', ':sort'],
    answer: 0,
    explain: ':v (or :g!) acts on the non-matching lines.',
  },
]

/** Questions for one world, in authored order. */
export function quizForTier(tier: number): QuizQuestion[] {
  return QUIZ.filter((q) => q.tier === tier)
}
