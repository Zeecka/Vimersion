import type { EditorView } from '@codemirror/view'

export type Tier = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Read-only vim-state helpers handed to goal predicates (lazily built from
 * the live editor). Lets goals verify registers, marks, modes and macros —
 * things invisible to the buffer text. See src/game/verify.ts for composable
 * checkers built on top of this.
 */
export interface VimCtx {
  mode(): 'normal' | 'insert' | 'visual' | 'visualLine' | 'visualBlock' | 'replace' | 'unknown'
  /** Contents of a register (single-char name), or null if empty/unavailable. */
  register(name: string): { text: string; linewise: boolean } | null
  /** Position of a mark — 1-based line, 0-based column (like startCursor). */
  mark(name: string): { line: number; ch: number } | null
  isRecording(): boolean
}

/** A win condition: exact buffer text, or a predicate over the live editor. */
export interface Goal {
  /** Win when the buffer exactly equals this text. */
  targetText?: string
  /** Or win when this predicate is true. Checked on every editor update AND
   *  after every completed vim command (so register/mark goals re-check even
   *  when the doc/selection didn't change). */
  predicate?: (view: EditorView, vim: VimCtx) => boolean
  /** Human-readable description of the win condition. */
  describe: string
}

/**
 * Authored copy shown to the player. Keys are named in `backticks` and render
 * as keycaps — see <KeyedText> in src/ui/atoms.tsx. Backtick the keys the
 * player presses ('delete it with `x`'), not prose that merely mentions a
 * concept ('you are in normal mode').
 */
type Copy = string

/** One stage of a multi-stage (boss) challenge, fought in the SAME buffer. */
export interface ChallengeStage {
  /** Instruction shown when this stage begins (falls back to the challenge brief). */
  brief?: Copy
  goal: Goal
}

/** A single campaign challenge, authored as pure data (content-as-data). */
export interface Challenge {
  id: string
  tier: Tier
  title: string
  /** One-line instruction shown above the editor. */
  brief: Copy
  /** Command ids credited toward mastery when this challenge is completed. */
  taughtCommands: string[]
  startText: string
  /** Optional starting cursor (1-based line, 0-based column). Defaults to top-left. */
  startCursor?: { line: number; ch: number }
  goal: Goal
  /** Target keystroke count for a perfect (3-star) solve. */
  par: number
  hint: Copy
  /** 'boss' gets multi-stage flow, a keystroke budget & a special result screen. */
  kind?: 'standard' | 'boss'
  /** Boss stages 2..n, checked in order after `goal` (stage 1) — same buffer,
   *  no editor remount between stages. */
  stages?: ChallengeStage[]
  /** Boss "HP bar": exceeding this many keystrokes fails the attempt
   *  (free retry, no penalty). Guideline ≈ ceil(par · 2.2). */
  keystrokeBudget?: number
  /** Language extension for the editor (e.g. 'html' enables it/at tag
   *  text objects, which need a syntax tree). */
  lang?: 'html'
}

/** Normalized stage list — the ONLY way runtime code should read goals. */
export function stagesOf(ch: Challenge): ChallengeStage[] {
  return [{ brief: ch.brief, goal: ch.goal }, ...(ch.stages ?? [])]
}

export interface WorldMeta {
  tier: Tier
  name: string
  subtitle: string
  /** CSS color token used as the world accent. */
  accent: string
}

export type Stars = 1 | 2 | 3

export interface ChallengeResult {
  keystrokes: number
  par: number
  stars: Stars
  xp: number
}
