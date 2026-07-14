import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchScore, type PublicScore } from '../game/account'
import { CHALLENGES } from '../content/tiers'
import { Emoji } from './Emoji'

/**
 * Public score page for a shared link (?u=<publicId>). The numbers come from
 * the server's database — this is the "verified score" a player shares, as
 * opposed to editable text — so tampering with the link can't inflate them.
 */
export function Profile({ publicId, onPlay }: { publicId: string; onPlay: () => void }) {
  const [score, setScore] = useState<PublicScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchScore(publicId)
      .then((s) => {
        if (!cancelled) setScore(s)
      })
      .catch((e: Error & { status?: number }) => {
        if (!cancelled) setError(e.status === 404 ? 'This score link does not exist (or was deleted).' : 'Could not load this score right now.')
      })
    return () => {
      cancelled = true
    }
  }, [publicId])

  const stats = score
    ? [
        { label: 'LEVEL', value: score.level, color: 'text-term' },
        { label: 'SOLVED', value: `${score.solved}/${CHALLENGES.length}`, color: 'text-cyan' },
        { label: 'MASTERED', value: score.mastered, color: 'text-magenta' },
        { label: 'COINS', value: score.coins, color: 'text-amber' },
        { label: 'ARCADE', value: score.arcadeBest, color: 'text-term' },
      ]
    : []

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel p-8 text-center">
        {error ? (
          <p className="text-ink-dim">{error}</p>
        ) : !score ? (
          <p className="animate-pulse text-ink-dim">Loading verified score…</p>
        ) : (
          <>
            {score.avatarUrl ? (
              <img src={score.avatarUrl} alt="" referrerPolicy="no-referrer" className="mx-auto h-16 w-16 rounded-full ring-2 ring-term/50" />
            ) : (
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-panel-2 font-terminal text-2xl text-term">
                {score.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <h1 className="mt-3 font-terminal text-3xl font-bold text-ink">{score.name}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-term">
              <Emoji name="gem" size={13} /> verified score · stored server-side
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-panel-2/60 py-3">
                  <div className={`font-terminal text-xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] uppercase tracking-widest text-ink-dim">{s.label}</div>
                </div>
              ))}
            </div>

            {score.streak > 1 && (
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber">
                <Emoji name="fire" size={14} /> {score.streak}-day streak
              </p>
            )}
            <p className="mt-2 text-[11px] text-ink-dim">last played {new Date(score.updatedAt).toLocaleDateString()}</p>
          </>
        )}

        <button onClick={onPlay} className="btn-primary mt-8 w-full rounded-xl px-6 py-3.5 text-lg font-bold">
          ▶ Think you can beat it? Play Vimersion
        </button>
        <p className="mt-3 text-xs text-ink-dim">Learn Vim by playing — real editor, real keystrokes. Free, no account needed.</p>
      </motion.div>
    </div>
  )
}
