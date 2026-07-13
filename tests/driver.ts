import { EditorSelection, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { Vim, getCM } from '@replit/codemirror-vim'
import { makeExtensions } from '../src/editor/vimSetup'
import { makeVimCtx } from '../src/game/verify'
import { stagesOf, type Challenge, type Goal } from '../src/game/types'

/**
 * Headless solution driver: builds a REAL EditorView with the production
 * extension stack and feeds vim keys through Vim.handleKey. Used by the par
 * validator — every authored par must be proven by a reference solution here.
 *
 * Solution notation: plain characters are individual keydowns; `<...>` groups
 * are special keys (`<Esc>`, `<C-r>`, `<CR>`). One token = one counted key.
 */
export function tokenize(solution: string): string[] {
  const tokens: string[] = []
  for (let i = 0; i < solution.length; i++) {
    if (solution[i] === '<') {
      const end = solution.indexOf('>', i)
      if (end === -1) throw new Error(`Unterminated <...> token in: ${solution}`)
      tokens.push(solution.slice(i, end + 1))
      i = end
    } else {
      tokens.push(solution[i])
    }
  }
  return tokens
}

export function createEditor(ch: Challenge): EditorView {
  const view = new EditorView({
    state: EditorState.create({ doc: ch.startText, extensions: makeExtensions(() => {}) }),
    parent: document.body,
  })

  // jsdom has no layout, but the vim shim's vertical motions (j/k/Ctrl-d/…)
  // consult the PIXEL-based findPosV/charCoords oracles — under zero-height
  // layout they jump to document end. Replace them with logical line math.
  // (Real-browser fidelity is covered by the Playwright QA scripts.)
  interface P {
    line: number
    ch: number
  }
  const cm = getCM(view) as unknown as {
    findPosV(start: P, amount: number, unit: string, goal?: number): P
    charCoords(pos: P, mode?: string): { left: number; right: number; top: number; bottom: number }
  }
  cm.findPosV = (start, amount, unit) => {
    const doc = view.state.doc
    const delta = unit === 'page' ? amount * 20 : amount
    const line = Math.max(0, Math.min(doc.lines - 1, start.line + delta))
    return { line, ch: Math.min(start.ch, doc.line(line + 1).length) }
  }
  cm.charCoords = (pos) => ({
    left: pos.ch * 8,
    right: pos.ch * 8 + 8,
    top: pos.line * 20,
    bottom: pos.line * 20 + 20,
  })

  if (ch.startCursor) {
    const line = view.state.doc.line(Math.min(ch.startCursor.line, view.state.doc.lines))
    view.dispatch({ selection: EditorSelection.cursor(Math.min(line.from + ch.startCursor.ch, line.to)) })
  }
  return view
}

/** Feed one token: vim key normally, literal text insertion in insert mode. */
export function press(view: EditorView, token: string): void {
  const cm = getCM(view)
  if (!cm) throw new Error('vim shim missing')
  const vim = (cm.state as { vim?: { insertMode?: boolean } }).vim
  if (vim?.insertMode && token.length === 1) {
    view.dispatch(view.state.replaceSelection(token))
  } else {
    Vim.handleKey(cm as Parameters<typeof Vim.handleKey>[0], token, 'user')
  }
}

export function goalMet(view: EditorView, goal: Goal): boolean {
  if (goal.targetText !== undefined) return view.state.doc.toString() === goal.targetText
  if (goal.predicate) return goal.predicate(view, makeVimCtx(view))
  return false
}

export interface PlayResult {
  /** 1-based token index at which the final stage completed, or null. */
  solvedAtKey: number | null
  totalKeys: number
  finalText: string
}

/** Play a full solution against a challenge, honoring the stage ratchet. */
export function playChallenge(ch: Challenge, solution: string): PlayResult {
  const view = createEditor(ch)
  const stages = stagesOf(ch)
  const tokens = tokenize(solution)
  let stage = 0
  let solvedAtKey: number | null = null
  try {
    for (let i = 0; i < tokens.length; i++) {
      press(view, tokens[i])
      while (stage < stages.length && goalMet(view, stages[stage].goal)) stage++
      if (stage >= stages.length) {
        solvedAtKey = i + 1
        break
      }
    }
    return { solvedAtKey, totalKeys: tokens.length, finalText: view.state.doc.toString() }
  } finally {
    view.destroy()
  }
}
