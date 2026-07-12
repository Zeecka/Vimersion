import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { levelProgress } from '../game/xp'

export function XPBar({ showNumbers = true }: { showNumbers?: boolean }) {
  const xp = useGame((s) => s.xp)
  const { level, into, span, pct } = levelProgress(xp)
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-ink-dim">LVL</span>
        <span className="font-terminal text-2xl leading-none text-term glow-term">{level}</span>
      </div>
      <div className="relative h-2.5 w-36 overflow-hidden rounded-full border border-border bg-panel-2 sm:w-44">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-term"
          animate={{ width: `${Math.round(pct * 100)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      {showNumbers && (
        <span className="hidden text-xs tabular-nums text-ink-dim sm:inline">
          {into}/{span} XP
        </span>
      )}
    </div>
  )
}
