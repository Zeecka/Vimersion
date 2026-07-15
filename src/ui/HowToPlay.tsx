import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CheatsheetButton } from './Cheatsheet'
import { Emoji } from './Emoji'

/**
 * A 60-second primer for players who've never touched Vim — the one thing the
 * app was missing before you're dropped into a real modal editor. Lazy-loaded
 * (default export) so it never weighs on the sync bundle. Auto-shown once to
 * brand-new players (see App's Home), and always reachable from the Home button.
 */
export default function HowToPlay({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const steps = [
    {
      k: 'Two modes',
      body: (
        <>
          Vim starts in <b className="text-term">NORMAL</b> mode — keys <i>move</i> and <i>run commands</i>, they
          don’t type. Press <Key>i</Key> to enter <b className="text-cyan">INSERT</b> mode and type text; press{' '}
          <Key>Esc</Key> to snap back to NORMAL. The badge above the editor always shows where you are.
        </>
      ),
    },
    {
      k: 'Move without arrows',
      body: (
        <>
          In NORMAL mode, <Key>h</Key> <Key>j</Key> <Key>k</Key> <Key>l</Key> move left / down / up / right. It feels
          strange for a day, then your hands never leave the home row. No mouse needed — ever.
        </>
      ),
    },
    {
      k: 'Every keystroke counts',
      body: (
        <>
          Each level has a <b>goal</b> and a <b className="text-amber">par</b> — the fewest keystrokes a pro would use.
          Solve it under par for <span className="text-amber">⭐⭐⭐</span>. It’s golf: think, don’t mash.
        </>
      ),
    },
    {
      k: 'Never stuck',
      body: (
        <>
          Below the editor: <b>Need a hint?</b> spells out the move, <b>Commands</b> opens the full cheatsheet, and{' '}
          <b>Restart</b> resets the level if you tangle it up. You can’t break anything.
        </>
      ),
    },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="How to play Vimersion"
        className="panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden outline-none"
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Emoji name="keyboard" size={20} />
            <h2 className="font-terminal text-xl font-bold text-term">How to play</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-border px-2.5 py-1 text-sm text-ink-dim transition-colors hover:border-danger hover:text-danger"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <p className="text-sm text-ink-dim">
            Vimersion teaches Vim in a <b className="text-ink">real editor</b> — the skills transfer straight to your
            terminal. Sixty seconds and you’re playing:
          </p>
          {steps.map((s, i) => (
            <div key={s.k} className="flex gap-3 rounded-xl border border-border bg-panel-2/40 p-3.5">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-bg"
                style={{ background: 'var(--color-term)' }}
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{s.k}</p>
                <p className="mt-0.5 text-sm text-ink-dim">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-border px-5 py-3.5">
          <CheatsheetButton
            label="Cheatsheet"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm text-ink-dim transition-colors hover:border-magenta hover:text-magenta"
          />
          <button onClick={onClose} className="btn-primary ml-auto rounded-lg px-4 py-1.5 text-sm font-bold">
            Let’s go →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Key({ children }: { children: ReactNode }) {
  return <span className="keycap">{children}</span>
}
