import { create } from 'zustand'
import { useGame, type Equipped, type HeroCustom } from './store'
import type { ChallengeResult } from './types'

/**
 * Optional-account layer. The game is fully playable anonymously; signing in
 * (Google/GitHub OAuth, handled server-side — see server/) saves progress
 * across devices and gives a verified, database-backed share link.
 *
 * The backend lives at /api on the same origin (nginx proxy in docker, vite
 * proxy in dev). Static-only deployments simply have no /api — everything
 * here degrades to 'offline' and the account UI stays hidden.
 */

export interface AccountUser {
  name: string
  avatarUrl: string | null
  provider: string
  publicId: string
}

/** The progress snapshot exchanged with the server (device-local settings excluded). */
export interface Snapshot {
  xp: number
  coins: number
  completed: Record<string, ChallengeResult>
  mastery: Record<string, number>
  streak: { count: number; lastPlayed: string | null }
  arcadeBest: number
  owned: string[]
  equipped: Equipped
  hero: HeroCustom
}

export interface PublicScore {
  name: string
  avatarUrl: string | null
  level: number
  xp: number
  solved: number
  mastered: number
  coins: number
  arcadeBest: number
  streak: number
  updatedAt: number
}

type AccountStatus = 'checking' | 'offline' | 'anon' | 'authed'

interface AccountState {
  status: AccountStatus
  user: AccountUser | null
  providers: string[]
  /** ms timestamp of the last successful server save, null if never. */
  syncedAt: number | null
  syncPending: boolean
}

export const useAccount = create<AccountState>()(() => ({
  status: 'checking',
  user: null,
  providers: [],
  syncedAt: null,
  syncPending: false,
}))

const API = 'api'

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/${path}`, { credentials: 'same-origin', ...init })
  if (!res.ok) {
    // Drain the body: an unconsumed error response pins its connection open
    // (blocks the browser's network-idle state and leaks keep-alive sockets).
    void res.text().catch(() => {})
    throw Object.assign(new Error(`api ${path}: ${res.status}`), { status: res.status })
  }
  return (await res.json()) as T
}

export function snapshotFromStore(): Snapshot {
  const s = useGame.getState()
  return {
    xp: s.xp,
    coins: s.coins,
    completed: s.completed,
    mastery: s.mastery,
    streak: s.streak,
    arcadeBest: s.arcadeBest,
    owned: s.owned,
    equipped: s.equipped,
    hero: s.hero,
  }
}

/**
 * Merge a server snapshot with local progress — never lose either side.
 * Numeric totals take the max, per-challenge results keep the better solve,
 * collections union; cosmetics follow whichever profile has been played more.
 */
export function mergeSnapshots(local: Snapshot, server: Snapshot): Snapshot {
  const completed: Record<string, ChallengeResult> = { ...server.completed }
  for (const [id, l] of Object.entries(local.completed)) {
    const r = completed[id]
    if (!r) {
      completed[id] = l
      continue
    }
    completed[id] = {
      stars: (l.stars > r.stars ? l.stars : r.stars),
      keystrokes: Math.min(l.keystrokes, r.keystrokes),
      par: l.par,
      xp: Math.max(l.xp, r.xp),
    }
  }

  const mastery: Record<string, number> = { ...server.mastery }
  for (const [id, n] of Object.entries(local.mastery)) mastery[id] = Math.max(mastery[id] ?? 0, n)

  const streak =
    (local.streak.lastPlayed ?? '') >= (server.streak.lastPlayed ?? '') ? local.streak : server.streak

  const cosmeticSource = local.xp >= server.xp ? local : server

  return {
    xp: Math.max(local.xp, server.xp),
    coins: Math.max(local.coins, server.coins),
    completed,
    mastery,
    streak,
    arcadeBest: Math.max(local.arcadeBest, server.arcadeBest),
    owned: Array.from(new Set([...server.owned, ...local.owned])),
    equipped: cosmeticSource.equipped,
    hero: cosmeticSource.hero,
  }
}

// ------------------------------------------------------------------ sync ---

let syncTimer: number | undefined
let lastSent = ''
let unsubscribe: (() => void) | undefined

async function pushSnapshot(): Promise<void> {
  const snap = snapshotFromStore()
  const body = JSON.stringify(snap)
  if (body === lastSent) return
  useAccount.setState({ syncPending: true })
  try {
    await apiJson('progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
    lastSent = body
    useAccount.setState({ syncedAt: Date.now(), syncPending: false })
  } catch {
    // Transient (offline, rate limit): the next store change retries.
    useAccount.setState({ syncPending: false })
  }
}

function startSync(): void {
  stopSync()
  unsubscribe = useGame.subscribe(() => {
    window.clearTimeout(syncTimer)
    syncTimer = window.setTimeout(() => void pushSnapshot(), 1500)
  })
}

function stopSync(): void {
  window.clearTimeout(syncTimer)
  unsubscribe?.()
  unsubscribe = undefined
}

/** Flush any pending changes now (e.g. right before sharing). */
export async function flushSync(): Promise<void> {
  if (useAccount.getState().status !== 'authed') return
  window.clearTimeout(syncTimer)
  await pushSnapshot()
}

// ------------------------------------------------------------ lifecycle ---

/** Probe the backend, restore the session, merge & start syncing. Call once at boot. */
export async function initAccount(): Promise<void> {
  let providers: string[]
  try {
    ;({ providers } = await apiJson<{ providers: string[] }>('config'))
  } catch {
    useAccount.setState({ status: 'offline' })
    return
  }
  if (providers.length === 0) {
    useAccount.setState({ status: 'offline', providers })
    return
  }
  try {
    const me = await apiJson<{ user: AccountUser | null; progress: Snapshot | null; updatedAt: number | null }>('me')
    if (!me.user) {
      useAccount.setState({ status: 'anon', providers })
      return
    }
    const local = snapshotFromStore()
    const merged = me.progress ? mergeSnapshots(local, me.progress) : local
    useGame.setState(merged)
    useAccount.setState({ status: 'authed', user: me.user, providers, syncedAt: me.updatedAt })
    startSync()
    void pushSnapshot() // persist the merge result right away
  } catch {
    useAccount.setState({ status: 'anon', providers })
  }
}

/** Full-page OAuth redirect — progress is preserved server-side + locally. */
export function login(provider: string): void {
  window.location.href = `${API}/auth/${provider}/start`
}

export async function logout(): Promise<void> {
  stopSync()
  try {
    await apiJson('logout', { method: 'POST' })
  } catch {
    /* session cookie may already be gone */
  }
  useAccount.setState({ status: 'anon', user: null, syncedAt: null })
}

/** Verified share URL for the signed-in player, else null. */
export function verifiedShareUrl(): string | null {
  const { status, user } = useAccount.getState()
  if (status !== 'authed' || !user) return null
  return `${location.origin}${location.pathname}?u=${user.publicId}`
}

export async function fetchScore(publicId: string): Promise<PublicScore> {
  return apiJson<PublicScore>(`score/${encodeURIComponent(publicId)}`)
}
