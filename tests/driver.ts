import { EditorSelection, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { Vim, getCM } from '@replit/codemirror-vim'
import { html } from '@codemirror/lang-html'
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
    state: EditorState.create({
      doc: ch.startText,
      // Mirror VimEditor: challenges with a lang get their syntax tree (it/at).
      // (Imported statically here — tests aren't bundle-size constrained.)
      extensions: makeExtensions(() => {}, ch.lang === 'html' ? [html()] : []),
    }),
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

function dialogKeyName(token: string): { key: string; keyCode: number } {
  if (token === '<CR>') return { key: 'Enter', keyCode: 13 }
  if (token === '<Esc>') return { key: 'Escape', keyCode: 27 }
  return { key: token, keyCode: token.toUpperCase().charCodeAt(0) }
}

/**
 * Feed one token. Three routing modes, mirroring real play:
 * - vim dialog open (`/`, `?`, `:` prompts, :s///c confirm): synthesize a
 *   keydown on the dialog's <input> — the shim's own listeners consume it
 *   (confirm y/n swallow keys; Enter fires the callback with input.value);
 *   unconsumed plain chars get typed into the input like a browser would.
 * - insert mode: literal text insertion via the editor.
 * - otherwise: Vim.handleKey.
 */
export function press(view: EditorView, token: string): void {
  const cm = getCM(view)
  if (!cm) throw new Error('vim shim missing')

  const dialog = (cm.state as { dialog?: HTMLElement }).dialog
  const inp = dialog?.querySelector('input')
  if (dialog && inp) {
    const { key, keyCode } = dialogKeyName(token)
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'keyCode', { get: () => keyCode })
    inp.dispatchEvent(ev)
    if (!ev.defaultPrevented && token.length === 1) {
      inp.value += token
      inp.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
    }
    return
  }

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
