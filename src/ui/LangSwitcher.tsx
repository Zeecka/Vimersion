import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LANGS, LANG_META, useLangStore, type Lang } from '../game/i18n'
import { useT } from '../game/i18n'
import { sfx } from '../game/sound'

/** Short code shown on the pill (script-appropriate, font-independent). */
const SHORT: Record<Lang, string> = { en: 'EN', fr: 'FR', es: 'ES', ru: 'RU', zh: '中' }

/** A small inline globe — bundled Twemoji has no globe glyph, and flag emoji are
 *  OS-font-dependent (which this app avoids), so we draw our own. */
function Globe({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18M4.5 7.5c4.5 2.2 10.5 2.2 15 0M4.5 16.5c4.5-2.2 10.5-2.2 15 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Language selector for the HUD. Auto-detects on first load (see detectLang in
 * game/i18n) and lets the player switch at any time. Lives on every screen —
 * including during play — so it preventDefaults mousedown to never steal focus
 * from the editor surface (the z-stack "engine surface is sacred" rule).
 */
export function LangSwitcher() {
  const lang = useLangStore((s) => s.lang)
  const explicit = useLangStore((s) => s.explicit)
  const setLang = useLangStore((s) => s.setLang)
  const t = useT()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (l: Lang) => {
    setLang(l)
    setOpen(false)
    sfx.ui()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          sfx.ui()
          setOpen((o) => !o)
        }}
        title={t('lang.label')}
        aria-label={t('lang.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-cyan hover:text-cyan"
      >
        <Globe /> <span className="tabular-nums">{SHORT[lang]}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-panel p-1 shadow-xl"
          >
            {!explicit && (
              <li className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-ink-dim">
                {t('lang.auto')}
              </li>
            )}
            {LANGS.map((l) => {
              const active = l === lang
              return (
                <li key={l} role="none">
                  <button
                    role="menuitemradio"
                    aria-checked={active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(l)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                      active ? 'bg-cyan/10 text-cyan' : 'text-ink hover:bg-panel-2'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 text-[11px] font-bold tabular-nums text-ink-dim">{SHORT[l]}</span>
                      {LANG_META[l].label}
                    </span>
                    {active && <span aria-hidden>✓</span>}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
