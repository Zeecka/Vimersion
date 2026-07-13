import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Hud } from './ui/Hud'
import { CommandBelt } from './ui/CommandBelt'
import { WorldMap } from './ui/WorldMap'
import { Shop } from './ui/Shop'
import { Background } from './ui/Background'
import { Avatar } from './ui/Avatar'
import { Emoji } from './ui/Emoji'
import { CampaignMode } from './modes/CampaignMode'
import { ArcadeMode } from './modes/ArcadeMode'
import { CHALLENGES } from './content/tiers'
import { useGame, MASTERY_THRESHOLD } from './game/store'
import { levelFromXp } from './game/xp'
import { shareScore } from './game/share'
import { setSoundMuted, sfx } from './game/sound'
import { COMMANDS } from './game/commands'
import { COSMETIC_BY_ID } from './game/cosmetics'
import { effectiveQuality } from './game/quality'
import { setStage, useStage } from './three/stageState'

// The entire 3D graph (three, r3f, drei, models) lives behind this one lazy
// boundary — the sync bundle stays 3D-free and the editor stays instant.
const Stage3D = lazy(() => import('./three/Stage3D'))

type Screen =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'play'; id: string }
  | { name: 'arcade' }
  | { name: 'shop' }

function firstUnsolvedId(completed: Record<string, unknown>): string | null {
  return CHALLENGES.find((ch) => !completed[ch.id])?.id ?? null
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const soundOn = useGame((s) => s.soundOn)
  const equipped = useGame((s) => s.equipped)
  const quality = useGame((s) => s.quality)
  const contextLost = useStage((s) => s.contextLost)
  const stageReady = useStage((s) => s.ready)

  const theme = COSMETIC_BY_ID[equipped.theme]
  const accent = theme?.accent ?? '#7c6bff'
  const accentDim = theme?.accentDim ?? '#5a4cd6'
  const bgId = COSMETIC_BY_ID[equipped.background]?.bg ?? 'crt'

  // A lost WebGL context downgrades to lite for the rest of the session.
  const tier = contextLost ? 'lite' : effectiveQuality(quality)

  useEffect(() => {
    setSoundMuted(!soundOn)
  }, [soundOn])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-term', accent)
    root.style.setProperty('--color-term-dim', accentDim)
  }, [accent, accentDim])

  // Mirror UI state into the 3D bridge store (safe before the chunk loads).
  useEffect(() => {
    setStage({ screen: screen.name, accent, bgId })
  }, [screen.name, accent, bgId])

  // Warm the 3D chunk on idle so route transitions never await it.
  useEffect(() => {
    if (tier !== 'webgl') return
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb) : window.setTimeout(cb, 1500))
    idle(() => {
      void import('./three/Stage3D')
    })
  }, [tier])

  const go = (s: Screen) => setScreen(s)
  const play = (id: string) => go({ name: 'play', id })

  const challenge = screen.name === 'play' ? CHALLENGES.find((c) => c.id === screen.id) : undefined

  return (
    <MotionConfig reducedMotion="user">
      {/* Lite background stays mounted until the 3D stage has painted a frame
          (and forever in the lite tier) — never a blank flash. */}
      {(tier === 'lite' || !stageReady) && <Background bg={bgId} accent={accent} />}
      {tier === 'webgl' && (
        <Suspense fallback={null}>
          <Stage3D />
        </Suspense>
      )}
      <div className="relative z-10 min-h-screen">
        {screen.name !== 'home' && (
          <Hud onHome={() => go({ name: 'home' })} onShop={() => go({ name: 'shop' })} />
        )}

        <AnimatePresence mode="wait">
          <motion.main
            key={screen.name + (screen.name === 'play' ? screen.id : '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {screen.name === 'home' && (
              <Home
                onPlay={play}
                onMap={() => go({ name: 'map' })}
                onArcade={() => go({ name: 'arcade' })}
                onShop={() => go({ name: 'shop' })}
              />
            )}
            {screen.name === 'map' && <WorldMap onPlay={play} />}
            {screen.name === 'arcade' && <ArcadeMode />}
            {screen.name === 'shop' && <Shop />}
            {screen.name === 'play' &&
              (challenge ? (
                <CampaignMode challenge={challenge} onPlay={play} onMap={() => go({ name: 'map' })} />
              ) : (
                <Fallback onHome={() => go({ name: 'home' })} />
              ))}
          </motion.main>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}

function Home({
  onPlay,
  onMap,
  onArcade,
  onShop,
}: {
  onPlay: (id: string) => void
  onMap: () => void
  onArcade: () => void
  onShop: () => void
}) {
  const xp = useGame((s) => s.xp)
  const coins = useGame((s) => s.coins)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const streak = useGame((s) => s.streak.count)
  const arcadeBest = useGame((s) => s.arcadeBest)
  const avatar = useGame((s) => s.equipped.avatar)
  const reset = useGame((s) => s.resetProgress)

  const [shareMsg, setShareMsg] = useState<string | null>(null)

  const level = levelFromXp(xp)
  const solved = Object.keys(completed).length
  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length
  const hasProgress = solved > 0 || xp > 0 || coins > 0
  const nextId = firstUnsolvedId(completed)

  const onShare = async () => {
    sfx.ui()
    const res = await shareScore({ level, solved, total: CHALLENGES.length, mastered, coins })
    setShareMsg(res === 'shared' ? 'Shared! 🎉' : res === 'copied' ? 'Score copied to clipboard!' : 'Could not share — try again')
    window.setTimeout(() => setShareMsg(null), 2600)
  }

  const startCampaign = () => {
    sfx.ui()
    if (nextId) onPlay(nextId)
    else onMap()
  }

  const stats = [
    { label: 'LEVEL', value: level, color: 'text-term', bar: 'var(--color-term)' },
    { label: 'COINS', value: coins, color: 'text-amber', bar: 'var(--color-amber)' },
    { label: 'SOLVED', value: `${solved}/${CHALLENGES.length}`, color: 'text-cyan', bar: 'var(--color-cyan)' },
    { label: 'MASTERED', value: mastered, color: 'text-magenta', bar: 'var(--color-magenta)' },
    { label: 'ARCADE', value: arcadeBest, color: 'text-term', bar: 'var(--color-term)' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <button
          onClick={() => {
            sfx.ui()
            onShop()
          }}
          title="Customize your character"
          className="mx-auto mb-4 block rounded-full p-[2.5px] transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, var(--color-term), var(--color-cyan), var(--color-magenta))' }}
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-bg">
            <Avatar id={avatar} size={46} />
          </span>
        </button>
        <motion.h1
          className="title-gradient font-terminal text-6xl font-bold tracking-tight sm:text-7xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          :Vimersion
        </motion.h1>
        <p className="mt-3 text-lg text-ink-dim">
          Learn Vim by playing. Real editor, real keystrokes, real muscle memory.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="panel py-3"
            style={{ borderTop: `2.5px solid ${s.bar}`, boxShadow: `0 -1px 16px -7px ${s.bar}` }}
          >
            <div className={`font-terminal text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-ink-dim">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={startCampaign}
          className="btn-primary flex-1 rounded-xl px-6 py-4 text-lg font-bold"
        >
          {hasProgress ? '▶ Continue Campaign' : '▶ Start Campaign'}
        </button>
        <button
          onClick={() => {
            sfx.ui()
            onArcade()
          }}
          className="btn-accent flex-1 rounded-xl px-6 py-4 text-lg font-bold"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Emoji name="target" size={22} /> Motion Rush
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <button onClick={() => { sfx.ui(); onShop() }} className="inline-flex items-center gap-1.5 text-amber underline decoration-dotted underline-offset-4 hover:opacity-80">
          <Emoji name="palette" size={16} /> customize your character
        </button>
        <button onClick={onShare} className="inline-flex items-center gap-1.5 text-cyan underline decoration-dotted underline-offset-4 hover:opacity-80">
          <Emoji name="rocket" size={16} /> share my score
        </button>
        <button onClick={() => { sfx.ui(); onMap() }} className="text-ink-dim underline decoration-dotted underline-offset-4 hover:text-term">
          world map
        </button>
      </div>
      {shareMsg && (
        <p className="mt-2 text-center text-xs text-term">{shareMsg}</p>
      )}

      <div className="mt-10">
        <CommandBelt />
      </div>

      <div className="mt-8 flex items-center justify-between text-xs text-ink-dim">
        <span className="inline-flex items-center gap-1.5">
          {streak > 0 ? (
            <>
              <Emoji name="fire" size={13} /> {streak}-day streak
            </>
          ) : (
            'Play daily to build a streak'
          )}
        </span>
        {hasProgress && (
          <button
            onClick={() => {
              if (window.confirm('Reset all progress and cosmetics? This cannot be undone.')) reset()
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
    <div className="grid min-h-[60vh] place-items-center">
      <button onClick={onHome} className="text-term underline">
        ← back home
      </button>
    </div>
  )
}
