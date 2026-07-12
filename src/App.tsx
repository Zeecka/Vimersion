import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hud } from './ui/Hud'
import { CommandBelt } from './ui/CommandBelt'
import { WorldMap } from './ui/WorldMap'
import { CampaignMode } from './modes/CampaignMode'
import { ArcadeMode } from './modes/ArcadeMode'
import { CHALLENGES } from './content/tiers'
import { useGame } from './game/store'
import { levelFromXp } from './game/xp'
import { setSoundMuted, sfx } from './game/sound'
import { COMMANDS } from './game/commands'
import { MASTERY_THRESHOLD } from './game/store'

type Screen = { name: 'home' } | { name: 'map' } | { name: 'play'; id: string } | { name: 'arcade' }

function firstUnsolvedId(completed: Record<string, unknown>): string | null {
  const c = CHALLENGES.find((ch) => !completed[ch.id])
  return c?.id ?? null
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const soundOn = useGame((s) => s.soundOn)

  useEffect(() => {
    setSoundMuted(!soundOn)
  }, [soundOn])

  const go = (s: Screen) => setScreen(s)
  const play = (id: string) => go({ name: 'play', id })

  const challenge = screen.name === 'play' ? CHALLENGES.find((c) => c.id === screen.id) : undefined
  if (screen.name === 'play' && !challenge) return <Fallback onHome={() => go({ name: 'home' })} />

  return (
    <div className="relative z-10 min-h-screen">
      {screen.name !== 'home' && <Hud onHome={() => go({ name: 'home' })} />}

      <AnimatePresence mode="wait">
        <motion.main
          key={screen.name + (screen.name === 'play' ? screen.id : '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {screen.name === 'home' && <Home onPlay={play} onMap={() => go({ name: 'map' })} onArcade={() => go({ name: 'arcade' })} />}
          {screen.name === 'map' && <WorldMap onPlay={play} />}
          {screen.name === 'arcade' && <ArcadeMode />}
          {screen.name === 'play' && challenge && (
            <CampaignMode challenge={challenge} onPlay={play} onMap={() => go({ name: 'map' })} />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  )
}

function Home({
  onPlay,
  onMap,
  onArcade,
}: {
  onPlay: (id: string) => void
  onMap: () => void
  onArcade: () => void
}) {
  const xp = useGame((s) => s.xp)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const streak = useGame((s) => s.streak.count)
  const arcadeBest = useGame((s) => s.arcadeBest)
  const reset = useGame((s) => s.resetProgress)

  const level = levelFromXp(xp)
  const solved = Object.keys(completed).length
  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length
  const hasProgress = solved > 0 || xp > 0
  const nextId = firstUnsolvedId(completed)

  const startCampaign = () => {
    sfx.ui()
    if (nextId) onPlay(nextId)
    else onMap()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-center">
        <motion.h1
          className="font-terminal text-7xl text-term glow-term sm:text-8xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          :Vimersion
        </motion.h1>
        <p className="mt-3 text-lg text-ink-dim">
          Learn Vim by playing. Real editor, real keystrokes, real muscle memory.
        </p>
      </div>

      {/* Stats strip */}
      <div className="mt-10 grid grid-cols-4 gap-3 text-center">
        {[
          { label: 'LEVEL', value: level, color: 'text-term' },
          { label: 'SOLVED', value: `${solved}/${CHALLENGES.length}`, color: 'text-cyan' },
          { label: 'MASTERED', value: mastered, color: 'text-amber' },
          { label: 'ARCADE', value: arcadeBest, color: 'text-magenta' },
        ].map((s) => (
          <div key={s.label} className="panel py-3">
            <div className={`font-terminal text-2xl tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={startCampaign}
          className="flex-1 rounded bg-term px-6 py-4 text-lg font-bold text-bg transition-transform hover:scale-[1.02]"
        >
          {hasProgress ? '▶ Continue Campaign' : '▶ Start Campaign'}
        </button>
        <button
          onClick={() => {
            sfx.ui()
            onArcade()
          }}
          className="flex-1 rounded border border-amber/60 px-6 py-4 text-lg font-bold text-amber transition-colors hover:bg-amber/10"
        >
          🎯 Motion Rush
        </button>
      </div>
      <div className="mt-2 text-center">
        <button onClick={() => { sfx.ui(); onMap() }} className="text-sm text-ink-dim underline decoration-dotted underline-offset-4 hover:text-term">
          browse the world map
        </button>
      </div>

      <div className="mt-10">
        <CommandBelt />
      </div>

      <div className="mt-8 flex items-center justify-between text-xs text-ink-dim">
        <span>
          {streak > 0 ? `🔥 ${streak}-day streak` : 'Play daily to build a streak'}
        </span>
        {hasProgress && (
          <button
            onClick={() => {
              if (window.confirm('Reset all progress? This cannot be undone.')) reset()
            }}
            className="underline decoration-dotted underline-offset-4 hover:text-danger"
          >
            reset progress
          </button>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-ink-dim">
        Built with CodeMirror + real Vim keybindings · free &amp; open source
      </p>
    </div>
  )
}

function Fallback({ onHome }: { onHome: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center">
      <button onClick={onHome} className="text-term underline">
        ← back home
      </button>
    </div>
  )
}
