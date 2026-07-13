import { WORLDS, challengesForTier, tierUnlocked } from '../content/tiers'
import { useGame } from '../game/store'
import { StarRow } from './atoms'
import { Emoji } from './Emoji'
import { sfx } from '../game/sound'

export function WorldMap({ onPlay }: { onPlay: (id: string) => void }) {
  const completed = useGame((s) => s.completed)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="font-terminal text-4xl text-term glow-term">Campaign</h2>
      <p className="mt-1 text-ink-dim">Clear a world to unlock the next. Fewer keystrokes = more stars.</p>

      <div className="mt-8 space-y-6">
        {WORLDS.map((w) => {
          const chs = challengesForTier(w.tier)
          const hasContent = chs.length > 0
          const worldUnlocked = tierUnlocked(w.tier, completed)
          const cleared = hasContent && chs.every((c) => completed[c.id])
          const playable = hasContent && worldUnlocked
          return (
            <section key={w.tier} className="panel overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h3
                    className="font-terminal text-2xl"
                    style={{ color: playable ? w.accent : 'var(--color-ink-dim)' }}
                  >
                    World {w.tier} · {w.name}
                  </h3>
                  <p className="text-sm text-ink-dim">{w.subtitle}</p>
                </div>
                {!hasContent ? (
                  <span className="rounded border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-ink-dim">
                    Coming soon
                  </span>
                ) : cleared ? (
                  <span className="rounded border border-term px-2 py-1 text-[10px] uppercase tracking-widest text-term">
                    ✓ Cleared
                  </span>
                ) : !worldUnlocked ? (
                  <span className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-ink-dim">
                    <Emoji name="lock" size={11} /> Locked
                  </span>
                ) : null}
              </div>

              {playable ? (
                <div className="grid grid-cols-2 gap-3 border-t border-border p-5 sm:grid-cols-4">
                  {chs.map((c, i) => {
                    const prev = i === 0 ? null : chs[i - 1]
                    const unlocked = i === 0 || !!completed[prev!.id]
                    const res = completed[c.id]
                    return (
                      <button
                        key={c.id}
                        disabled={!unlocked}
                        onClick={() => {
                          sfx.ui()
                          onPlay(c.id)
                        }}
                        className={`rounded border p-3 text-left transition-all ${
                          unlocked
                            ? 'border-border hover:-translate-y-0.5 hover:border-term hover:bg-panel-2'
                            : 'cursor-not-allowed border-border/40 opacity-40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs tabular-nums text-ink-dim">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {unlocked ? <StarRow value={res?.stars ?? 0} size={12} /> : <Emoji name="lock" size={13} />}
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-ink">{c.title}</p>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="border-t border-border px-5 py-5 text-sm text-ink-dim">
                  {!hasContent
                    ? `Curriculum stub — ${w.subtitle.toLowerCase()}. Landing in a future update.`
                    : `Locked — clear World ${w.tier - 1} to unlock these ${chs.length} challenges.`}
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
