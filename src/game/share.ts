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
 *
 * `verifiedUrl` (signed-in players) points at the database-backed score page,
 * so the numbers in the link can't be forged; otherwise we link the app itself.
 */
export async function shareScore(s: ShareStats, verifiedUrl?: string | null): Promise<ShareResult> {
  const url = verifiedUrl ?? location.origin + location.pathname
  const text =
    `⌨️ VimLegends — Level ${s.level} · ${s.solved}/${s.total} challenges solved · ` +
    `${s.mastered} Vim commands mastered · ${s.coins} coins 🪙\n` +
    `Learn Vim by playing:`

  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: 'VimLegends', text, url })
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
