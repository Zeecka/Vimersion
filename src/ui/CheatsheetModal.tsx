import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { filterCheatsheetSections, downloadCheatsheet, printCheatsheet } from '../game/cheatsheet'
import { useGame, MASTERY_THRESHOLD } from '../game/store'
import { COMMANDS } from '../game/commands'
import { Emoji } from './Emoji'
import { sfx } from '../game/sound'

/**
 * The in-app Vim cheatsheet: every command the game teaches, grouped by world,
 * with your mastered keys highlighted. Downloadable as Markdown or a printable
 * HTML page (→ Save as PDF). Lazy-loaded (default export) so the generator's
 * HTML template never weighs down the sync bundle. See ./Cheatsheet.tsx.
 */
export default function CheatsheetModal({ onClose }: { onClose: () => void }) {
  const mastery = useGame((s) => s.mastery)
  const panelRef = useRef<HTMLDivElement>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const sections = useMemo(() => filterCheatsheetSections(q), [q])
  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length

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

  const toast = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 2400)
  }

  // Portal to <body>: the top bar (backdrop-blur) is a containing block for
  // fixed-position descendants, which would otherwise squash this overlay into
  // the header bar. Rendering at the document root escapes that trap.
  return createPortal(
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
        aria-label="Vim cheatsheet"
        className="panel flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden outline-none"
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Emoji name="keyboard" size={20} />
            <div>
              <h2 className="font-terminal text-xl font-bold text-term">Vim Cheatsheet</h2>
              <p className="text-[11px] text-ink-dim">
                {COMMANDS.length} commands · {mastered} mastered
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cheatsheet"
            className="rounded-full border border-border px-2.5 py-1 text-sm text-ink-dim transition-colors hover:border-danger hover:text-danger"
          >
            ✕
          </button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter commands..."
              aria-label="Filter commands"
              className="w-full rounded-lg border border-border bg-panel-2/60 px-3 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-dim/60 focus:border-term"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim hover:text-term"
              >
                ✕
              </button>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim">
            <span className="inline-block h-2 w-2 rounded-full bg-term" /> mastered
          </span>
        </div>

        {/* Scrollable command list */}
        {sections.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-dim">Nothing matches &ldquo;{q}&rdquo;.</p>
        ) : (
        <div className="grid gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          {sections.map((s) => (
            <section
              key={s.tier}
              className="rounded-xl border border-border bg-panel-2/40 p-4"
              style={{ borderTop: `2.5px solid ${s.accent}` }}
            >
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-widest text-ink-dim">World {s.tier}</span>
                <h3 className="font-terminal text-lg font-semibold" style={{ color: s.accent }}>
                  {s.name}
                </h3>
                <p className="text-xs text-ink-dim">{s.subtitle}</p>
              </div>
              <div className="space-y-2.5">
                {s.groups.map((g) => (
                  <div key={g.label}>
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-dim">{g.label}</p>
                    <div className="space-y-1">
                      {g.commands.map((c) => {
                        const done = (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD
                        return (
                          <div key={c.id} className="flex items-baseline gap-2.5">
                            <span
                              className={`keycap shrink-0 ${done ? 'border-term text-term' : 'text-ink'}`}
                              style={
                                done
                                  ? { boxShadow: '0 0 8px color-mix(in srgb, var(--color-term) 40%, transparent)' }
                                  : undefined
                              }
                            >
                              {c.keys}
                            </span>
                            <span className="text-sm text-ink">
                              {c.label}
                              {done && <span className="ml-1 text-term">✓</span>}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        )}

        {/* Download actions */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-border px-5 py-3.5">
          <span className="mr-auto text-xs text-ink-dim">Take it with you:</span>
          <button
            onClick={() => {
              sfx.ui()
              downloadCheatsheet('md')
              toast('Downloaded Markdown ✓')
            }}
            className="rounded-lg border border-border px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-term hover:text-term"
          >
            ↓ Markdown
          </button>
          <button
            onClick={() => {
              sfx.ui()
              downloadCheatsheet('html')
              toast('Downloaded HTML ✓')
            }}
            className="rounded-lg border border-border px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-cyan hover:text-cyan"
          >
            ↓ HTML
          </button>
          <button
            onClick={() => {
              sfx.ui()
              printCheatsheet()
            }}
            className="btn-primary rounded-lg px-3.5 py-1.5 text-sm font-bold"
          >
            🖶 Print / PDF
          </button>
        </div>

        {flash && (
          <p className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 rounded-lg border border-term/50 bg-panel px-3 py-1.5 text-xs text-term shadow-lg">
            {flash}
          </p>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  )
}
