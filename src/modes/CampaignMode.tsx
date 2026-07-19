import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import VimEditor, { type VimEditorHandle } from '../editor/VimEditor'
import { KeyedText, ModeBadge } from '../ui/atoms'
import { Emoji } from '../ui/Emoji'
import { ResultScreen } from '../ui/ResultScreen'
import { CheatsheetButton } from '../ui/Cheatsheet'
import { HeroPanel, type Reaction } from '../ui/HeroPanel'
import { WorldArt } from '../ui/WorldArt'
import { useGame, type CompleteOutcome } from '../game/store'
import { CHALLENGES, challengesForTier, worldMeta } from '../content/tiers'
import { setStage } from '../three/stageState'
import { stagesOf, type Challenge, type Tier } from '../game/types'

// The first-run "how to play" primer — lazy so it never weighs on the bundle.
const HowToPlay = lazy(() => import('../ui/HowToPlay'))

interface Props {
  challenge: Challenge
  onPlay: (id: string) => void
  onMap: () => void
}

export function CampaignMode({ challenge, onPlay, onMap }: Props) {
  const complete = useGame((s) => s.completeChallenge)
  const seenPrimer = useGame((s) => s.seenPrimer)
  const markPrimerSeen = useGame((s) => s.markPrimerSeen)
  const [keystrokes, setKeystrokes] = useState(0)
  const [finalKs, setFinalKs] = useState(0)
  const [mode, setMode] = useState('normal')
  const [outcome, setOutcome] = useState<CompleteOutcome | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [reaction, setReaction] = useState<Reaction>('idle')
  const [stageIdx, setStageIdx] = useState(0)
  const [failed, setFailed] = useState(false)
  const editorRef = useRef<VimEditorHandle>(null)
  const idleTimer = useRef<number | undefined>(undefined)

  const stages = stagesOf(challenge)
  const isBoss = challenge.kind === 'boss'
  const activeStage = stages[Math.min(stageIdx, stages.length - 1)]

  const world = worldMeta(challenge.tier)
  const siblings = challengesForTier(challenge.tier)
  const idx = siblings.findIndex((c) => c.id === challenge.id)
  const next = siblings[idx + 1]
  const sceneIndex = CHALLENGES.findIndex((c) => c.id === challenge.id)

  // First playable level of the next world (its boss is skipped), or undefined
  // when that world isn't built yet. A boss caps its world → beating it leaps
  // there. A standard level normally steps to the next sibling, but the LAST
  // level of a world with no boss cap has no sibling left, so it rolls over to
  // the next world too. Either way the ResultScreen's "next" button (and Enter)
  // fires.
  const nextWorldFirst = challengesForTier((challenge.tier + 1) as Tier).find(
    (c) => (c.kind ?? 'standard') !== 'boss',
  )
  const nextTarget = isBoss ? nextWorldFirst : (next ?? nextWorldFirst)
  const crossesWorld = !!nextTarget && nextTarget.tier !== challenge.tier

  useEffect(() => {
    setStage({ sceneIndex })
    return () => setStage({ sceneIndex: null })
  }, [sceneIndex])

  // First-run primer: auto-open once, on the player's very first campaign level.
  useEffect(() => {
    if (!seenPrimer) {
      setShowHelp(true)
      markPrimerSeen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A keystroke makes the hero "think"; it relaxes to idle shortly after you stop.
  const onKeystroke = useCallback((n: number) => {
    setKeystrokes(n)
    setReaction('typing')
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setReaction('idle'), 900)
  }, [])

  const handleComplete = useCallback(
    (ks: number) => {
      window.clearTimeout(idleTimer.current)
      setFinalKs(ks)
      setKeystrokes(ks)
      const out = complete(challenge, ks)
      setReaction(out.leveledUp ? 'levelup' : 'win')
      setOutcome(out)
    },
    [challenge, complete],
  )

  const handleStageAdvance = useCallback((stage: number) => {
    setStageIdx(stage)
  }, [])

  const handleFail = useCallback((ks: number) => {
    window.clearTimeout(idleTimer.current)
    setFinalKs(ks)
    setFailed(true)
    setReaction('fail')
  }, [])

  const replay = () => {
    setOutcome(null)
    setKeystrokes(0)
    setFinalKs(0)
    setMode('normal')
    setShowHint(false)
    setReaction('idle')
    setStageIdx(0)
    setFailed(false)
    setEditorKey((k) => k + 1)
  }
  // Same reset, invoked mid-attempt from the in-play toolbar (the remounted
  // editor auto-focuses, so Vim keys keep landing without an explicit focus()).
  const restart = replay

  const revealHint = () => {
    setShowHint(true)
    // Clicking the button pulls focus off the editor; hand it straight back so
    // the next Vim keystroke lands in the editor, not nowhere.
    editorRef.current?.focus()
  }

  // Focus safety net: a click on dead space (the page background, the brief, the
  // hero panel) blurs the editor to <body>, and from there every Vim keystroke is
  // silently swallowed — the level looks broken with no way back but clicking the
  // editor. Whenever focus lands on nothing, hand it to the editor.
  //
  // Only the <body> case is reclaimed: focus that lands on a real element (a
  // toolbar button, a modal's dialog panel) is left alone, so Tab-navigation and
  // modal focus traps keep working. This also covers modal close, where the
  // unmounting panel drops focus to <body>.
  useEffect(() => {
    let timer: number | undefined
    const onFocusOut = () => {
      window.clearTimeout(timer)
      // Defer: at focusout time activeElement is still transitioning.
      timer = window.setTimeout(() => {
        if (!document.hasFocus()) return // window itself lost focus — not ours to fix
        const active = document.activeElement
        if (!active || active === document.body) editorRef.current?.focus()
      }, 0)
    }
    document.addEventListener('focusout', onFocusOut)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const overPar = keystrokes > challenge.par

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Hero companion */}
        <div className="lg:w-72 lg:shrink-0">
          <HeroPanel reaction={reaction} />
        </div>

        {/* Play column */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              {isBoss ? (
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-magenta/50 bg-magenta/15 px-2.5 py-0.5 text-magenta shadow-[0_0_16px_-6px_var(--color-magenta)]">
                    <span aria-hidden>☠</span> Boss Fight
                  </span>
                  <span className="text-magenta/70">
                    World {challenge.tier} · {challenge.title}
                  </span>
                </p>
              ) : (
                <p className="text-xs uppercase tracking-widest" style={{ color: world.accent }}>
                  World {challenge.tier} · {challenge.title}
                </p>
              )}
              <h2 className="mt-1 text-lg text-ink">
                <KeyedText text={activeStage.brief ?? challenge.brief} />
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {stages.length > 1 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-magenta/40 bg-magenta/10 px-3 py-1 text-xs font-bold tabular-nums text-magenta">
                  {stages.map((_, i) => (
                    <span key={i} className={i < stageIdx ? 'opacity-100' : i === stageIdx ? 'animate-pulse' : 'opacity-30'}>
                      ◆
                    </span>
                  ))}
                  <span className="ml-0.5">
                    {Math.min(stageIdx + 1, stages.length)}/{stages.length}
                  </span>
                </span>
              )}
              <ModeBadge mode={mode} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className={`inline-flex items-center gap-1.5 tabular-nums ${overPar ? 'text-amber' : 'text-term'}`}>
              <Emoji name="keyboard" size={15} /> {keystrokes}
            </span>
            <span className="text-ink-dim">goal {challenge.par}</span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-panel-2/60 px-2 py-0.5 text-ink-dim sm:ml-auto">
              <Emoji name="target" size={15} /> {activeStage.goal.describe}
            </span>
          </div>

          {/* Boss HP bar — the keystroke budget depleting in real time. */}
          {isBoss && challenge.keystrokeBudget !== undefined && (
            <BossBar spent={keystrokes} budget={challenge.keystrokeBudget} />
          )}

          {/* The editor sits on a dark glass panel so the equipped background shows
              through behind the code. Behind the code, each WORLD paints its own
              procedural abstract art (accent-tinted) so every level in a world
              shares one landscape. The 78%-opaque glass keeps the code legible. */}
          <div
            className="panel-glass relative mt-3 h-[42vh] min-h-[240px] max-h-[480px] overflow-hidden"
            style={{
              borderColor: isBoss
                ? 'color-mix(in srgb, var(--color-magenta) 55%, var(--color-border))'
                : `color-mix(in srgb, ${world.accent} 38%, var(--color-border))`,
            }}
          >
            {/* Per-world abstract-art backdrop — consistent across every level. */}
            <WorldArt tier={challenge.tier} accent={world.accent} />
            <div className="relative z-10 h-full">
              <VimEditor
                ref={editorRef}
                key={`${challenge.id}-${editorKey}`}
                challenge={challenge}
                onComplete={handleComplete}
                onKeystroke={onKeystroke}
                onModeChange={setMode}
                onStageAdvance={handleStageAdvance}
                onFail={handleFail}
                frozen={!!outcome || failed}
              />
            </div>
          </div>

          {/* In-play toolbar: hint on the left, quick controls on the right.
              Every control preventDefaults mousedown so clicking it never pulls
              Vim focus out of the editor (Restart remounts + auto-focuses; the
              cheatsheet hands focus back on close). */}
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {!showHint && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={revealHint}
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-panel-2/50 px-3.5 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:border-amber hover:text-amber"
                >
                  <Emoji name="bulb" size={14} />
                  Need a hint?
                </button>
              )}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowHelp(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-panel-2/50 px-3.5 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:border-cyan hover:text-cyan"
              >
                <Emoji name="wave" size={14} />
                How to play
              </button>
              <div className="ml-auto flex items-center gap-2">
                <CheatsheetButton
                  label="Cheatsheet"
                  keepEditorFocus
                  onClosed={() => editorRef.current?.focus()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-2/50 px-3.5 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:border-magenta hover:text-magenta"
                />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={restart}
                  title="Restart this level from the beginning"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-2/50 px-3.5 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:border-term hover:text-term"
                >
                  <span aria-hidden>⟳</span> Restart
                </button>
                <button
                  onClick={onMap}
                  title="Leave this level and return to the world map"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-2/50 px-3.5 py-1.5 text-xs font-medium text-ink-dim transition-colors hover:border-danger hover:text-danger"
                >
                  <span aria-hidden>⊞</span> Quit
                </button>
              </div>
            </div>
            {showHint && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/10 px-3.5 py-2.5 text-sm text-ink">
                <span className="mt-0.5 shrink-0">
                  <Emoji name="bulb" size={16} />
                </span>
                <span>
                  <span className="mr-1.5 text-[11px] font-bold uppercase tracking-widest text-amber">Hint</span>
                  <KeyedText text={challenge.hint} />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {outcome && (
        <ResultScreen
          outcome={outcome}
          keystrokes={finalKs}
          par={challenge.par}
          boss={isBoss}
          hasNext={!!nextTarget}
          nextLabel={crossesWorld ? 'Next world →' : 'Next →'}
          onNext={() => nextTarget && onPlay(nextTarget.id)}
          onReplay={replay}
          onMap={onMap}
        />
      )}

      {/* Boss fail overlay — free retry, zero penalty, no guilt. */}
      {failed && !outcome && (
        <div className="absolute inset-0 z-30 grid place-items-center rounded-xl bg-bg/70 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 text-center">
            <p className="font-terminal text-3xl font-bold text-danger">REPELLED!</p>
            <p className="mt-2 text-sm text-ink-dim">
              {challenge.title} shrugged off your {finalKs} keystrokes — the budget was {challenge.keystrokeBudget}. Reload and
              clear it in <b className="text-term">{challenge.par}</b> keystrokes or fewer to earn <span className="text-amber">★★★</span>.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={replay} className="btn-primary rounded-xl px-5 py-2.5 font-bold">
                ⟳ Retry for 3 ★
              </button>
              <button
                onClick={onMap}
                className="rounded-xl border border-border px-5 py-2.5 text-ink-dim transition-colors hover:border-term hover:text-term"
              >
                Back to map
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <Suspense fallback={null}>
          <HowToPlay
            onClose={() => {
              setShowHelp(false)
              editorRef.current?.focus()
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

/** Depleting keystroke-budget bar (boss levels). */
function BossBar({ spent, budget }: { spent: number; budget: number }) {
  const remaining = Math.max(0, budget - spent)
  const pct = (remaining / budget) * 100
  const color = pct > 50 ? 'var(--color-term)' : pct > 25 ? 'var(--color-amber)' : 'var(--color-danger)'
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-dim">
        <span>Boss integrity</span>
        <span className="tabular-nums">{remaining} keystrokes left</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-200"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}
