import type { EditorView } from '@codemirror/view'

export type Tier = 1 | 2 | 3 | 4

/** A single campaign challenge, authored as pure data (content-as-data). */
export interface Challenge {
  id: string
  tier: Tier
  title: string
  /** One-line instruction shown above the editor. */
  brief: string
  /** Command ids credited toward mastery when this challenge is completed. */
  taughtCommands: string[]
  startText: string
  /** Optional starting cursor (1-based line, 0-based column). Defaults to top-left. */
  startCursor?: { line: number; ch: number }
  goal: {
    /** Win when the buffer exactly equals this text. */
    targetText?: string
    /** Or win when this predicate is true (checked on every editor update). */
    predicate?: (view: EditorView) => boolean
    /** Human-readable description of the win condition. */
    describe: string
  }
  /** Target keystroke count for a perfect (3-star) solve. */
  par: number
  hint: string
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
