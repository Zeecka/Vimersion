import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Hud } from './ui/Hud'
import { CommandBelt } from './ui/CommandBelt'
import { WorldMap } from './ui/WorldMap'
import { Shop } from './ui/Shop'
import { Background } from './ui/Background'
import { PlayerAvatar } from './ui/Avatar'
import { Emoji } from './ui/Emoji'
import { Profile } from './ui/Profile'
import { CampaignMode } from './modes/CampaignMode'
import { ArcadeMode } from './modes/ArcadeMode'
import { CHALLENGES } from './content/tiers'
import { useGame, MASTERY_THRESHOLD } from './game/store'
import { levelFromXp } from './game/xp'
import { COMMANDS } from './game/commands'
import { initAccount } from './game/account'
import { DONATE_URL } from './game/links'
import { setSoundMuted, sfx } from './game/sound'
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
  | { name: 'profile'; publicId: string }

function firstUnsolvedId(completed: Record<string, unknown>): string | null {
  return CHALLENGES.find((ch) => !completed[ch.id])?.id ?? null
}

/** A shared verified-score link (?u=<publicId>) opens on the score page. */
function initialScreen(): Screen {
  const u = new URLSearchParams(window.location.search).get('u')
  return u ? { name: 'profile', publicId: u } : { name: 'home' }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen)
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

  // Probe the optional backend once: restores the session, merges progress,
  // starts auto-sync. A static deployment simply reports 'offline'.
  useEffect(() => {
    void initAccount()
  }, [])

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
  const leaveProfile = () => {
    // Drop the ?u= param so a reload doesn't bounce back to the shared score.
    window.history.replaceState(null, '', window.location.pathname)
    go({ name: 'home' })
  }

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
        {screen.name !== 'profile' && (
          <Hud onHome={() => go({ name: 'home' })} onShop={() => go({ name: 'shop' })} onMap={() => go({ name: 'map' })} />
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
            {screen.name === 'profile' && <Profile publicId={screen.publicId} onPlay={leaveProfile} />}
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
  const arcadeBest = useGame((s) => s.arcadeBest)
  const reset = useGame((s) => s.resetProgress)

  const solved = Object.keys(completed).length
  const hasProgress = solved > 0 || xp > 0 || coins > 0 || arcadeBest > 0
  const nextId = firstUnsolvedId(completed)

  const startCampaign = () => {
    sfx.ui()
    if (nextId) onPlay(nextId)
    else onMap()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <button
          onClick={() => {
            sfx.ui()
            onShop()
          }}
          title="Customize your character"
          className="group mx-auto mb-4 block"
        >
          <span
            className="mx-auto block w-fit rounded-full p-[2.5px] transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, var(--color-term), var(--color-cyan), var(--color-magenta))' }}
          >
            <span className="grid h-24 w-24 place-items-center rounded-full bg-bg">
              <PlayerAvatar size={56} />
            </span>
          </span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber underline decoration-dotted underline-offset-4 group-hover:opacity-80">
            <Emoji name="palette" size={13} /> customize your character
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

      <HomeStats />

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

      <div className="mt-10">
        <CommandBelt />
      </div>

      <div className="mt-8 flex items-center justify-center text-xs text-ink-dim">
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

      <p className="mt-8 flex items-center justify-center gap-3 text-center text-xs text-ink-dim">
        free &amp; open source
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => sfx.ui()}
          className="inline-flex items-center gap-1.5 rounded-full border border-magenta/50 px-3 py-1 font-bold text-magenta transition-colors hover:bg-magenta/10"
        >
          ♥ donate
        </a>
      </p>
    </div>
  )
}

function HomeStats() {
  const xp = useGame((s) => s.xp)
  const coins = useGame((s) => s.coins)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const arcadeBest = useGame((s) => s.arcadeBest)

  const level = levelFromXp(xp)
  const solved = Object.keys(completed).length
  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length

  const stats = [
    { label: 'LEVEL', value: level, color: 'text-term', bar: 'var(--color-term)' },
    { label: 'COINS', value: coins, color: 'text-amber', bar: 'var(--color-amber)' },
    { label: 'SOLVED', value: `${solved}/${CHALLENGES.length}`, color: 'text-cyan', bar: 'var(--color-cyan)' },
    { label: 'MASTERED', value: mastered, color: 'text-magenta', bar: 'var(--color-magenta)' },
    { label: 'ARCADE', value: arcadeBest, color: 'text-term', bar: 'var(--color-term)' },
  ]

  return (
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
