import type { EditorView } from '@codemirror/view'
import { getCM, Vim } from '@replit/codemirror-vim'
import type { VimCtx } from './types'

/**
 * Composable goal checkers for challenge authoring, plus the VimCtx factory.
 *
 * Content files import these instead of writing ad-hoc predicate logic —
 * keeps challenges declarative (content-as-data). All checkers are pure
 * factories returning a GoalPredicate; combine with allOf/anyOf/not.
 *
 * This is the ONLY module that reaches into the vim runtime for verification.
 */
export type GoalPredicate = (view: EditorView, vim: VimCtx) => boolean

// ---------------------------------------------------------------- VimCtx ---

/** Loose view of the CM5-shim vim state (the package's types are partial). */
interface VimStateLoose {
  insertMode?: boolean
  visualMode?: boolean
  visualLine?: boolean
  visualBlock?: boolean
  marks?: Record<string, { find(): { line: number; ch: number } | null } | undefined>
}

export function makeVimCtx(view: EditorView): VimCtx {
  const vimState = (): VimStateLoose | null => {
    try {
      const cm = getCM(view) as unknown as { state?: { vim?: VimStateLoose } } | null
      return cm?.state?.vim ?? null
    } catch {
      return null
    }
  }

  return {
    mode() {
      const vim = vimState()
      if (!vim) return 'unknown'
      if (vim.visualMode) return vim.visualBlock ? 'visualBlock' : vim.visualLine ? 'visualLine' : 'visual'
      if (vim.insertMode) return 'insert'
      return 'normal'
    },
    register(name) {
      try {
        const rc = (Vim as unknown as {
          getRegisterController(): { getRegister(n: string): { toString(): string; linewise?: boolean } }
        }).getRegisterController()
        const reg = rc.getRegister(name)
        const text = reg.toString()
        if (!text) return null
        return { text, linewise: !!reg.linewise }
      } catch {
        return null
      }
    },
    mark(name) {
      try {
        const pos = vimState()?.marks?.[name]?.find()
        if (!pos) return null
        return { line: pos.line + 1, ch: pos.ch } // 1-based line, like startCursor
      } catch {
        return null
      }
    },
    isRecording() {
      try {
        const gs = (Vim as unknown as {
          getVimGlobalState_(): { macroModeState?: { isRecording?: boolean } }
        }).getVimGlobalState_()
        return !!gs.macroModeState?.isRecording
      } catch {
        return false
      }
    },
  }
}

// ------------------------------------------------------- buffer & cursor ---

export const bufferEquals = (text: string): GoalPredicate => (view) => view.state.doc.toString() === text

export const bufferMatches = (re: RegExp): GoalPredicate => (view) => re.test(view.state.doc.toString())

export const lineCount = (n: number): GoalPredicate => (view) => view.state.doc.lines === n

/** Cursor at exact position — 1-based line, 0-based column (like startCursor). */
export const cursorAt = (line: number, ch: number): GoalPredicate => (view) => {
  const head = view.state.selection.main.head
  const l = view.state.doc.lineAt(head)
  return l.number === line && head - l.from === ch
}

export const cursorLine = (line: number): GoalPredicate => (view) =>
  view.state.doc.lineAt(view.state.selection.main.head).number === line

/** The character under the (normal-mode) cursor. */
export const charUnder = (c: string): GoalPredicate => (view) => {
  const head = view.state.selection.main.head
  return view.state.doc.sliceString(head, head + 1) === c
}

// ------------------------------------------------------------- vim state ---

export const inMode = (mode: ReturnType<VimCtx['mode']>): GoalPredicate => (_v, vim) => vim.mode() === mode

export const registerEquals = (name: string, text: string, opts?: { linewise?: boolean }): GoalPredicate => (_v, vim) => {
  const reg = vim.register(name)
  if (!reg) return false
  // Linewise register text carries a trailing newline; compare tolerantly.
  const norm = (s: string) => s.replace(/\n$/, '')
  if (norm(reg.text) !== norm(text)) return false
  if (opts?.linewise !== undefined && reg.linewise !== opts.linewise) return false
  return true
}

export const registerNonEmpty = (name: string): GoalPredicate => (_v, vim) => vim.register(name) !== null

export const markSet = (name: string): GoalPredicate => (_v, vim) => vim.mark(name) !== null

export const markAt = (name: string, line: number): GoalPredicate => (_v, vim) => vim.mark(name)?.line === line

/** Macros live in registers — "recorded macro in q" ⇔ register q non-empty.
 *  Verify REPLAY honestly by pairing this with a bufferEquals target whose
 *  par is unreachable without @-replays. */
export const recordedMacro = (reg: string): GoalPredicate => registerNonEmpty(reg)

// ------------------------------------------------------------ combinators ---

export const allOf = (...ps: GoalPredicate[]): GoalPredicate => (v, vim) => ps.every((p) => p(v, vim))

export const anyOf = (...ps: GoalPredicate[]): GoalPredicate => (v, vim) => ps.some((p) => p(v, vim))

export const not = (p: GoalPredicate): GoalPredicate => (v, vim) => !p(v, vim)
