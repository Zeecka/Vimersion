export interface ShareStats {
  level: number
  solved: number
  total: number
  mastered: number
  coins: number
}

export type ShareResult = 'shared' | 'copied' | 'failed'

/**
 * Share the player's score. Uses the native Web Share sheet where available
 * (mobile, some desktops), otherwise copies a summary to the clipboard.
 * Real Unicode emoji are fine here — the text is handed to *other* apps.
 */
export async function shareScore(s: ShareStats): Promise<ShareResult> {
  const url = location.origin + location.pathname
  const text =
    `⌨️ Vimersion — Level ${s.level} · ${s.solved}/${s.total} challenges solved · ` +
    `${s.mastered} Vim commands mastered · ${s.coins} coins 🪙\n` +
    `Learn Vim by playing:`

  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: 'Vimersion', text, url })
      return 'shared'
    } catch (e) {
      // User dismissed the share sheet — treat as a completed (not failed) action.
      if (e instanceof Error && e.name === 'AbortError') return 'shared'
      // Otherwise fall through to the clipboard path.
    }
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
