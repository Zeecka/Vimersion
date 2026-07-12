import { useEffect, useRef } from 'react'
import { EditorSelection, EditorState } from '@codemirror/state'
import { EditorView, type ViewUpdate } from '@codemirror/view'
import { getCM } from '@replit/codemirror-vim'
import { makeExtensions } from './vimSetup'
import type { Challenge } from '../game/types'
import { sfx } from '../game/sound'

interface Props {
  challenge: Challenge
  onComplete: (keystrokes: number) => void
  onKeystroke?: (count: number) => void
  onModeChange?: (mode: string) => void
  /** When true, keystrokes are ignored for scoring (e.g. after completion). */
  frozen?: boolean
}

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Dead'])

function goalMet(view: EditorView, ch: Challenge): boolean {
  if (ch.goal.targetText !== undefined) {
    return view.state.doc.toString() === ch.goal.targetText
  }
  if (ch.goal.predicate) return ch.goal.predicate(view)
  return false
}

/**
 * An embedded CodeMirror 6 editor running real Vim keybindings (@replit/codemirror-vim),
 * instrumented to (a) count keystrokes, (b) detect goal completion, (c) report the vim mode.
 * Remount (via a `key` on the parent) to reset for a new challenge.
 */
export default function VimEditor({ challenge, onComplete, onKeystroke, onModeChange, frozen }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const keystrokes = useRef(0)
  const done = useRef(false)
  const frozenRef = useRef(frozen)
  frozenRef.current = frozen

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const onUpdate = (u: ViewUpdate) => {
      if (done.current) return
      if (!u.docChanged && !u.selectionSet) return
      if (goalMet(u.view, challenge)) {
        done.current = true
        sfx.success()
        onComplete(keystrokes.current)
      }
    }

    const view = new EditorView({
      state: EditorState.create({ doc: challenge.startText, extensions: makeExtensions(onUpdate) }),
      parent: host,
    })

    // Place the starting cursor if requested.
    if (challenge.startCursor) {
      try {
        const { line, ch } = challenge.startCursor
        const lineInfo = view.state.doc.line(Math.min(line, view.state.doc.lines))
        const pos = Math.min(lineInfo.from + ch, lineInfo.to)
        view.dispatch({ selection: EditorSelection.cursor(pos) })
      } catch {
        /* out-of-range cursor: ignore, leave at default */
      }
    }

    // Count keystrokes (VimGolf-style: every non-modifier key press counts as 1).
    // Capture phase is essential: the CodeMirror/vim keymap handles and stops
    // propagation of keys it consumes, so a bubble-phase listener would miss them.
    const onKeyDown = (e: KeyboardEvent) => {
      if (done.current || frozenRef.current) return
      if (MODIFIER_KEYS.has(e.key)) return
      keystrokes.current += 1
      onKeystroke?.(keystrokes.current)
      sfx.key()
    }
    view.dom.addEventListener('keydown', onKeyDown, true)

    // Report vim mode changes for the HUD (best-effort — API may be absent).
    let detachMode: (() => void) | undefined
    try {
      const cm = getCM(view) as unknown as {
        on?: (ev: string, fn: (arg: { mode?: string; subMode?: string }) => void) => void
        off?: (ev: string, fn: (arg: { mode?: string; subMode?: string }) => void) => void
      } | null
      if (cm?.on) {
        const handler = (arg: { mode?: string; subMode?: string }) => onModeChange?.(arg.mode ?? 'normal')
        cm.on('vim-mode-change', handler)
        detachMode = () => cm.off?.('vim-mode-change', handler)
      }
    } catch {
      /* mode reporting unavailable */
    }
    onModeChange?.('normal')

    view.focus()

    return () => {
      view.dom.removeEventListener('keydown', onKeyDown, true)
      detachMode?.()
      view.destroy()
    }
    // Remount on challenge change via key; deps intentionally exclude callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge])

  return <div ref={hostRef} className="h-full w-full" />
}
