import { Suspense, lazy, useState } from 'react'
import { Emoji } from './Emoji'
import { sfx } from '../game/sound'
import { useT } from '../game/i18n'

// The modal + the cheatsheet generator (with its inline HTML template) load
// only when a player actually opens the sheet — keeping the sync bundle lean.
const CheatsheetModal = lazy(() => import('./CheatsheetModal'))

/**
 * Self-contained trigger + lazy modal. Drop anywhere. `keepEditorFocus` uses the
 * mousedown-preventDefault trick so opening it mid-level doesn't steal Vim
 * focus, and `onClosed` lets the play screen hand focus back to the editor.
 */
export function CheatsheetButton({
  className = '',
  label,
  responsive = false,
  keepEditorFocus = false,
  onClosed,
}: {
  className?: string
  /** Visible button text (also part of the accessible name). Defaults to the
   *  translated "Cheatsheet" label when omitted. */
  label?: string
  /** Hide the label below the `md` breakpoint (for the crowded top bar). */
  responsive?: boolean
  keepEditorFocus?: boolean
  onClosed?: () => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const shownLabel = label ?? t('cheatsheet.label')
  return (
    <>
      <button
        onMouseDown={keepEditorFocus ? (e) => e.preventDefault() : undefined}
        onClick={() => {
          sfx.ui()
          setOpen(true)
        }}
        title={t('cheatsheet.buttonTitle')}
        aria-label={t('cheatsheet.buttonAria')}
        className={
          className ||
          'inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-term hover:text-term'
        }
      >
        <Emoji name="keyboard" size={14} />
        {shownLabel && <span className={responsive ? 'hidden md:inline' : undefined}>{shownLabel}</span>}
      </button>
      {open && (
        <Suspense fallback={null}>
          <CheatsheetModal
            onClose={() => {
              setOpen(false)
              onClosed?.()
            }}
          />
        </Suspense>
      )}
    </>
  )
}
