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
    '.cm-content': { caretColor: '#3ddc84', padding: '14px 0' },
    '.cm-line': { padding: '0 14px' },
    '.cm-gutters': { backgroundColor: 'transparent', color: '#3a4454', border: 'none' },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 14px' },
    '.cm-activeLine': { backgroundColor: 'rgba(61,220,132,0.06)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#7a8494' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#3ddc84', borderLeftWidth: '2px' },
    // Vim block cursor (normal mode)
    '.cm-fat-cursor': { background: '#3ddc84 !important', color: '#0a0e14 !important', outline: 'none' },
    '&:not(.cm-focused) .cm-fat-cursor': {
      background: 'rgba(61,220,132,0.45) !important',
      outline: 'none',
    },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(89,194,255,0.30) !important',
    },
  },
  { dark: true },
)

/** Build the extension set for a challenge editor. `vim()` must come first. */
export function makeExtensions(onUpdate: (v: ViewUpdate) => void): Extension[] {
  return [
    vim(),
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    EditorView.lineWrapping,
    vimersionTheme,
    EditorState.allowMultipleSelections.of(false),
    EditorView.updateListener.of(onUpdate),
  ]
}
