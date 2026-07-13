import { useCallback, useRef, useState } from 'react'
import VimEditor, { type VimEditorHandle } from '../editor/VimEditor'
import { ModeBadge } from '../ui/atoms'
import { Emoji } from '../ui/Emoji'
import { ResultScreen } from '../ui/ResultScreen'
import { HeroPanel, type Reaction } from '../ui/HeroPanel'
import { EditorScene } from '../ui/Background'
import { useGame, type CompleteOutcome } from '../game/store'
import { challengesForTier, worldMeta } from '../content/tiers'
import type { Challenge } from '../game/types'

interface Props {
  challenge: Challenge
  onPlay: (id: string) => void
  onMap: () => void
}

export function CampaignMode({ challenge, onPlay, onMap }: Props) {
  const complete = useGame((s) => s.completeChallenge)
  const [keystrokes, setKeystrokes] = useState(0)
  const [finalKs, setFinalKs] = useState(0)
  const [mode, setMode] = useState('normal')
  const [outcome, setOutcome] = useState<CompleteOutcome | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [reaction, setReaction] = useState<Reaction>('idle')
  const editorRef = useRef<VimEditorHandle>(null)
  const idleTimer = useRef<number | undefined>(undefined)

  const world = worldMeta(challenge.tier)
  const siblings = challengesForTier(challenge.tier)
  const idx = siblings.findIndex((c) => c.id === challenge.id)
  const next = siblings[idx + 1]

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
      setReaction('win')
      setOutcome(complete(challenge, ks))
    },
    [challenge, complete],
  )

  const replay = () => {
    setOutcome(null)
    setKeystrokes(0)
    setFinalKs(0)
    setMode('normal')
    setShowHint(false)
    setReaction('idle')
    setEditorKey((k) => k + 1)
  }

  const revealHint = () => {
    setShowHint(true)
    // Clicking the button pulls focus off the editor; hand it straight back so
    // the next Vim keystroke lands in the editor, not nowhere.
    editorRef.current?.focus()
  }

  const overPar = keystrokes > challenge.par

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Hero companion */}
        <div className="lg:w-72 lg:shrink-0">
          <HeroPanel reaction={reaction} />
        </div>

        {/* Play column */}
        <div className="flex min-h-[calc(100vh-93px)] flex-1 flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: world.accent }}>
                World {challenge.tier} · {challenge.title}
              </p>
              <h2 className="mt-1 text-lg text-ink">{challenge.brief}</h2>
            </div>
            <ModeBadge mode={mode} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className={`inline-flex items-center gap-1.5 tabular-nums ${overPar ? 'text-amber' : 'text-term'}`}>
              <Emoji name="keyboard" size={15} /> {keystrokes}
            </span>
            <span className="text-ink-dim">par {challenge.par}</span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-panel-2/60 px-2 py-0.5 text-ink-dim sm:ml-auto">
              <Emoji name="target" size={15} /> {challenge.goal.describe}
            </span>
          </div>

          <div className="panel relative mt-3 flex-1 overflow-hidden">
            <EditorScene />
            <div className="relative z-10 h-full">
              <VimEditor
                ref={editorRef}
                key={`${challenge.id}-${editorKey}`}
                challenge={challenge}
                onComplete={handleComplete}
                onKeystroke={onKeystroke}
                onModeChange={setMode}
                frozen={!!outcome}
              />
            </div>
          </div>

          <div className="mt-3 min-h-[1.75rem] text-sm">
            {showHint ? (
              <p className="inline-flex items-center gap-1.5 text-ink-dim">
                <Emoji name="bulb" size={15} /> {challenge.hint}
              </p>
            ) : (
              <button
                // preventDefault on mousedown keeps focus in the editor (a normal click
                // would move focus to this button and swallow subsequent Vim keys).
                onMouseDown={(e) => e.preventDefault()}
                onClick={revealHint}
                className="text-ink-dim underline decoration-dotted underline-offset-4 hover:text-term"
              >
                need a hint?
              </button>
            )}
          </div>
        </div>
      </div>

      {outcome && (
        <ResultScreen
          outcome={outcome}
          keystrokes={finalKs}
          par={challenge.par}
          hasNext={!!next}
          onNext={() => next && onPlay(next.id)}
          onReplay={replay}
          onMap={onMap}
        />
      )}
    </div>
  )
}
