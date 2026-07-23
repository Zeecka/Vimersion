import type { CSSProperties } from 'react'
import { SISTER_ACCENT, SISTER_NAME, SISTER_URL } from '../game/links'
import { sfx } from '../game/sound'
import { useT } from '../game/i18n'

/**
 * Cross-promo button linking to the sibling game (Vim ⇄ tmux). It is coloured in
 * the *destination's* accent hue (`SISTER_ACCENT`, exposed as the `--sib` CSS var)
 * rather than this app's, so it reads as a doorway to the other brand. All the
 * per-game specifics live in `game/links.ts`, keeping this component identical in
 * both projects.
 */

function TerminalMark({ size = 15 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="M6.5 9.5l3 2.5-3 2.5" />
      <path d="M12.5 15h5" />
    </svg>
  )
}

export function SisterAppButton() {
  const t = useT()
  return (
    <a
      href={SISTER_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() => sfx.ui()}
      title={t('home.sisterTitle')}
      style={{ '--sib': SISTER_ACCENT } as CSSProperties}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sib)]/50 px-3 py-1 font-bold text-[var(--sib)] transition-colors hover:bg-[var(--sib)]/10"
    >
      <TerminalMark /> {t('home.sisterApp', { name: SISTER_NAME }, `try ${SISTER_NAME}`)}
    </a>
  )
}
