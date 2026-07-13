import { EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  type ViewUpdate,
} from '@codemirror/view'
import { history } from '@codemirror/commands'
import { vim } from '@replit/codemirror-vim'

/** Retro-terminal CodeMirror theme matching the app's phosphor-green palette. */
export const vimersionTheme = EditorView.theme(
  {
    '&': { color: '#c7d0d9', backgroundColor: 'transparent', height: '100%' },
    '.cm-scroller': {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: '18px',
      lineHeight: '1.65',
      overflow: 'auto',
    },
    '.cm-content': { caretColor: 'var(--color-term)', padding: '14px 0' },
    '.cm-line': { padding: '0 14px' },
    '.cm-gutters': { backgroundColor: 'transparent', color: '#3a4454', border: 'none' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px' },
    '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-term) 7%, transparent)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#7a8494' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-term)', borderLeftWidth: '2px' },
    // Vim block cursor (normal mode) — colors follow the equipped theme
    '.cm-fat-cursor': {
      background: 'var(--color-term) !important',
      color: 'var(--color-bg) !important',
      outline: 'none',
    },
    '&:not(.cm-focused) .cm-fat-cursor': {
      background: 'color-mix(in srgb, var(--color-term) 45%, transparent) !important',
      outline: 'none',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(89,194,255,0.30) !important',
    },
  },
  { dark: true },
)

/** Build the extension set for a challenge editor. `vim()` must come first.
 *  `extra` lets a challenge add e.g. a language extension (tag text objects). */
export function makeExtensions(onUpdate: (v: ViewUpdate) => void, extra: Extension[] = []): Extension[] {
  return [
    vim(),
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    EditorView.lineWrapping,
    vimersionTheme,
    // MUST be true: visual-block mode (Ctrl-v, block I/A) dispatches
    // multi-range selections — with this facet false, CM6 collapses them
    // to one range and block editing silently breaks.
    EditorState.allowMultipleSelections.of(true),
    EditorView.updateListener.of(onUpdate),
    ...extra,
  ]
}
