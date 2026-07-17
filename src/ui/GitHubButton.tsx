import { useEffect, useState } from 'react'
import { GITHUB_REPO, GITHUB_URL } from '../game/links'
import { sfx } from '../game/sound'

/**
 * "Star on GitHub" button with a live star count. The game is offline-first, so
 * the count is strictly best-effort: we show a cached value instantly, then try
 * a single unauthenticated GitHub API call to refresh it. Any failure (offline,
 * rate-limited, private mode) is swallowed — the button still links out, just
 * without a number. The count is cached in localStorage so it survives reloads
 * and shows even when offline.
 */

const CACHE_KEY = `gh-stars:${GITHUB_REPO}`
const TTL_MS = 6 * 60 * 60 * 1000 // refresh at most every 6h

interface Cache {
  n: number
  at: number
}

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Cache
    return typeof c?.n === 'number' && typeof c?.at === 'number' ? c : null
  } catch {
    return null
  }
}

function writeCache(n: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ n, at: Date.now() } satisfies Cache))
  } catch {
    /* storage disabled — the in-memory value is enough for this session */
  }
}

/** 1234 → "1.2k"; small counts stay exact. */
function formatStars(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`.replace('.0k', 'k')
}

function GitHubMark({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  )
}

export function GitHubButton() {
  const [stars, setStars] = useState<number | null>(() => readCache()?.n ?? null)

  useEffect(() => {
    const cached = readCache()
    if (cached && Date.now() - cached.at < TTL_MS) return // fresh enough — skip the network
    const ctrl = new AbortController()
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { stargazers_count?: number }) => {
        if (typeof d.stargazers_count === 'number') {
          setStars(d.stargazers_count)
          writeCache(d.stargazers_count)
        }
      })
      .catch(() => {
        /* offline / rate-limited — keep whatever cached value we have */
      })
    return () => ctrl.abort()
  }, [])

  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() => sfx.ui()}
      title="Star this project on GitHub"
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-bold text-ink transition-colors hover:border-term hover:text-term"
    >
      <GitHubMark /> Star
      {stars !== null && (
        <span className="inline-flex items-center gap-0.5 tabular-nums text-amber">★ {formatStars(stars)}</span>
      )}
    </a>
  )
}
