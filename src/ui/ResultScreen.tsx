import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { StarRow, KeyCap } from './atoms'
import { Emoji } from './Emoji'
import { sfx } from '../game/sound'
import { COMMANDS, COMMANDS_BY_ID } from '../game/commands'
import { useGame, MASTERY_THRESHOLD, type CompleteOutcome } from '../game/store'
import { levelFromXp } from '../game/xp'
import { shareScore } from '../game/share'
import { CHALLENGES } from '../content/tiers'

interface Props {
  outcome: CompleteOutcome
  keystrokes: number
  par: number
  hasNext: boolean
  onNext: () => void
  onReplay: () => void
  onMap: () => void
}

export function ResultScreen({ outcome, keystrokes, par, hasNext, onNext, onReplay, onMap }: Props) {
  const xp = useGame((s) => s.xp)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const coins = useGame((s) => s.coins)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  useEffect(() => {
    for (let i = 0; i < outcome.stars; i++) sfx.star(i)
    if (outcome.leveledUp) window.setTimeout(() => sfx.levelUp(), 520)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onShare = async () => {
    sfx.ui()
    const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length
    const res = await shareScore({
      level: levelFromXp(xp),
      solved: Object.keys(completed).length,
      total: CHALLENGES.length,
      mastered,
      coins,
    })
    setShareMsg(res === 'shared' ? 'Shared! 🎉' : res === 'copied' ? 'Copied to clipboard!' : 'Could not share')
    window.setTimeout(() => setShareMsg(null), 2500)
  }

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-bg/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="panel w-full max-w-md p-8 text-center"
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <p className="title-gradient font-terminal text-4xl">
          {outcome.isPerfect ? 'PERFECT!' : 'SOLVED!'}
        </p>

        <div className="mt-4 flex justify-center">
          <StarRow value={outcome.stars} size={40} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-6 text-sm">
          <span className="text-ink-dim">
            keystrokes <b className="text-ink">{keystrokes}</b>
          </span>
          <span className="text-ink-dim">
            par <b className="text-ink">{par}</b>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          {outcome.xpGained > 0 && (
            <motion.p
              className="font-terminal text-2xl text-amber glow-amber"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              +{outcome.xpGained} XP
            </motion.p>
          )}
          {outcome.coinsGained > 0 && (
            <motion.p
              className="flex items-center gap-1.5 font-terminal text-2xl text-amber"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.32, type: 'spring', stiffness: 300 }}
            >
              +{outcome.coinsGained}
              <span className="coin" />
            </motion.p>
          )}
        </div>
        {outcome.xpGained === 0 && outcome.coinsGained === 0 && (
          <p className="mt-4 text-xs text-ink-dim">already mastered — replaying for practice</p>
        )}

        {outcome.leveledUp && (
          <motion.p
            className="mt-2 text-cyan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            ▲ LEVEL UP → {outcome.newLevel}
          </motion.p>
        )}

        {outcome.newlyMastered.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="text-ink-dim">command mastered:</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {outcome.newlyMastered.map((id) => (
                <KeyCap key={id}>{COMMANDS_BY_ID[id]?.keys ?? id}</KeyCap>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={onReplay}
            className="rounded border border-border px-4 py-2 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
          >
            ↻ Replay
          </button>
          <button
            onClick={onMap}
            className="rounded border border-border px-4 py-2 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
          >
            ⊞ Map
          </button>
          {hasNext && (
            <button
              onClick={onNext}
              className="rounded bg-term px-5 py-2 text-sm font-bold text-bg transition-transform hover:scale-105"
            >
              Next →
            </button>
          )}
        </div>

        <button
          onClick={onShare}
          className="mx-auto mt-4 inline-flex items-center gap-1.5 text-xs text-cyan underline decoration-dotted underline-offset-4 hover:opacity-80"
        >
          <Emoji name="rocket" size={14} /> share my score
        </button>
        {shareMsg && <p className="mt-1.5 text-xs text-term">{shareMsg}</p>}
      </motion.div>
    </motion.div>
  )
}
