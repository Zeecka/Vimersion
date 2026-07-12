import { WORLDS, challengesForTier } from '../content/tiers'
import { useGame } from '../game/store'
import { StarRow } from './atoms'
import { sfx } from '../game/sound'

export function WorldMap({ onPlay }: { onPlay: (id: string) => void }) {
  const completed = useGame((s) => s.completed)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="font-terminal text-4xl text-term glow-term">Campaign</h2>
      <p className="mt-1 text-ink-dim">Clear each challenge to unlock the next. Fewer keystrokes = more stars.</p>

      <div className="mt-8 space-y-6">
        {WORLDS.map((w) => {
          const chs = challengesForTier(w.tier)
          const available = chs.length > 0
          return (
            <section key={w.tier} className="panel overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h3 className="font-terminal text-2xl" style={{ color: w.accent }}>
                    World {w.tier} · {w.name}
                  </h3>
                  <p className="text-sm text-ink-dim">{w.subtitle}</p>
                </div>
                {!available && (
                  <span className="rounded border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-ink-dim">
                    Coming soon
                  </span>
                )}
              </div>

              {available ? (
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
                          {unlocked ? <StarRow value={res?.stars ?? 0} size={12} /> : <span>🔒</span>}
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-ink">{c.title}</p>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="border-t border-border px-5 py-5 text-sm text-ink-dim">
                  Curriculum stub — {w.subtitle.toLowerCase()}. Landing in a future update.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
