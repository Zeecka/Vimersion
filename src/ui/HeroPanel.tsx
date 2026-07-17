import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame, MASTERY_THRESHOLD } from '../game/store'
import { levelProgress } from '../game/xp'
import { COMMANDS } from '../game/commands'
import { AURA_STYLES } from '../game/heroParts'
import { WORLDS, challengesForTier } from '../content/tiers'
import { effectiveQuality } from '../game/quality'
import { useStage, type HeroReaction } from '../three/stageState'
import { PlayerAvatar } from './Avatar'
import { Emoji } from './Emoji'

/** How the hero should feel right now, driven by the play screen. */
export type Reaction = HeroReaction

// Local Suspense boundary — only the portrait ever suspends, never the editor.
const Hero3D = lazy(() => import('../three/Hero3D'))

/** Playful rank title derived from level (purely cosmetic flavor). */
const RANKS = ['Rookie', 'Operator', 'Coder', 'Hacker', 'Wizard', 'Legend']
const rankFor = (level: number) => RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 3))]

// Deterministic particle spread (no Math.random — keeps things stable across renders).
const PARTICLES = [
  { left: '12%', delay: '0s', dur: '3.4s' },
  { left: '30%', delay: '0.8s', dur: '4.1s' },
  { left: '50%', delay: '1.6s', dur: '3.0s' },
  { left: '68%', delay: '0.4s', dur: '3.8s' },
  { left: '84%', delay: '1.2s', dur: '4.4s' },
  { left: '42%', delay: '2.2s', dur: '3.3s' },
]

/** The classic SVG avatar with spinning aura — lite tier + 3D loading fallback. */
function ClassicPortrait({ reaction, bobClass }: { reaction: Reaction; bobClass: string }) {
  return (
    <div className="absolute inset-x-0 bottom-2 grid place-items-center">
      <motion.div
        animate={reaction === 'win' || reaction === 'levelup' ? { scale: [1, 1.18, 1], rotate: [0, -7, 7, 0] } : { scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className={bobClass}>
          <div className="relative grid place-items-center">
            <div
              className="absolute h-[104px] w-[104px] rounded-full opacity-70 blur-[7px]"
              style={{
                background: 'conic-gradient(from 0deg, var(--color-term), var(--color-cyan), var(--color-magenta), var(--color-term))',
                animation: 'vm-spin-slow 6s linear infinite',
              }}
            />
            <span className="relative grid h-[88px] w-[88px] place-items-center rounded-full bg-bg ring-1 ring-border">
              <PlayerAvatar size={62} />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function HeroPanel({ reaction }: { reaction: Reaction }) {
  const xp = useGame((s) => s.xp)
  const coins = useGame((s) => s.coins)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const arcadeBest = useGame((s) => s.arcadeBest)

  const [emote, setEmote] = useState<string | null>(null)
  // The aura is a persisted customization, bought & equipped in Shop → Characters.
  // Here it's display-only: the equipped style feeds the floating aura particles.
  const heroCustom = useGame((s) => s.hero)
  const auraStyle = heroCustom.aura.style
  const auraEmoji = AURA_STYLES.find((a) => a.id === auraStyle)?.emoji ?? 'sparkles'
  const clearTimer = useRef<number | undefined>(undefined)

  const quality = useGame((s) => s.quality)
  const contextLost = useStage((s) => s.contextLost)
  const tier = contextLost ? 'lite' : effectiveQuality(quality)

  const { level, into, span, pct } = levelProgress(xp)
  const name = rankFor(level)

  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length
  const perfects = Object.values(completed).filter((r) => r.stars >= 3).length
  const solved = Object.keys(completed).length
  const worldsCleared = WORLDS.filter((w) => {
    const cs = challengesForTier(w.tier)
    return cs.length > 0 && cs.every((c) => completed[c.id])
  }).length

  const pop = (name: string, hold = 1700) => {
    setEmote(name)
    window.clearTimeout(clearTimer.current)
    clearTimer.current = window.setTimeout(() => setEmote(null), hold)
  }

  // React to gameplay: celebrate wins, focus while typing, relax when idle.
  useEffect(() => {
    window.clearTimeout(clearTimer.current)
    if (reaction === 'win' || reaction === 'levelup') pop('party', 2200)
    else if (reaction === 'typing') setEmote('thinking')
    else setEmote(null)
    return () => window.clearTimeout(clearTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction])

  const bobClass =
    reaction === 'typing'
      ? 'animate-[vm-hero-bob_0.55s_ease-in-out_infinite]'
      : 'animate-[vm-hero-idle_4s_ease-in-out_infinite]'

  const trophies = [
    { icon: 'trophy', label: 'worlds cleared', n: worldsCleared },
    { icon: 'star', label: 'perfect solves', n: perfects },
    { icon: 'gem', label: 'commands mastered', n: mastered },
    { icon: 'crown', label: 'levels solved', n: solved },
    { icon: 'bolt', label: 'arcade best', n: arcadeBest },
  ]

  return (
    <aside className="panel relative flex flex-col gap-4 overflow-hidden p-4">
      <div className="text-center text-[10px] uppercase tracking-[0.2em] text-ink-dim">Your Hero</div>

      {/* portrait stage */}
      <div className="relative h-40 select-none">
        {/* rising particle effects */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 top-8">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="absolute bottom-0"
              style={{ left: p.left, animation: `vm-float ${p.dur} ease-in-out ${p.delay} infinite` }}
            >
              <Emoji name={auraEmoji} size={14} />
            </span>
          ))}
        </div>

        {/* emote speech bubble */}
        <AnimatePresence>
          {emote && (
            <motion.div
              key={emote}
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
              initial={{ opacity: 0, y: 8, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <div className="relative rounded-2xl border border-border bg-panel-2 px-2.5 py-1.5 shadow-lg">
                <Emoji name={emote} size={22} />
                <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-panel-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* character: 3D hero in the webgl tier, classic avatar bubble in lite
            (and as the Suspense fallback while the 3D chunk/model loads). */}
        {tier === 'webgl' ? (
          <div className="absolute inset-x-0 bottom-0 top-2">
            <Suspense fallback={<ClassicPortrait reaction={reaction} bobClass={bobClass} />}>
              <Hero3D reaction={reaction} hero={heroCustom} />
            </Suspense>
          </div>
        ) : (
          <ClassicPortrait reaction={reaction} bobClass={bobClass} />
        )}
      </div>

      {/* name + level + xp bar */}
      <div className="text-center">
        <div className="font-terminal text-2xl font-semibold text-ink">{name}</div>
        <div className="text-xs text-term">Level {level}</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.round(pct * 100)}%`, background: 'linear-gradient(90deg, var(--color-term), var(--color-cyan))' }}
          />
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-ink-dim">{into} / {span} XP</div>
      </div>

      {/* loadout / trophies */}
      <div>
        <div className="mb-1.5 text-[10px] uppercase tracking-widest text-ink-dim">Loadout</div>
        <div className="grid grid-cols-5 gap-1.5">
          {trophies.map((t) => (
            <div
              key={t.icon}
              title={`${t.n} ${t.label}`}
              className={`flex flex-col items-center gap-0.5 rounded-md border border-border bg-panel-2 py-1.5 ${t.n > 0 ? '' : 'opacity-40'}`}
            >
              <Emoji name={t.icon} size={16} />
              <span className="text-[11px] font-bold tabular-nums text-ink">{t.n}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-ink-dim">Coins <span className="tabular-nums text-amber">{coins}</span> · earn more to unlock gear in the Shop</p>
    </aside>
  )
}
