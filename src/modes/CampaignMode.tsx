import { useCallback, useState } from 'react'
import VimEditor from '../editor/VimEditor'
import { ModeBadge } from '../ui/atoms'
import { ResultScreen } from '../ui/ResultScreen'
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

  const world = worldMeta(challenge.tier)
  const siblings = challengesForTier(challenge.tier)
  const idx = siblings.findIndex((c) => c.id === challenge.id)
  const next = siblings[idx + 1]

  const handleComplete = useCallback(
    (ks: number) => {
      setFinalKs(ks)
      setKeystrokes(ks)
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
    setEditorKey((k) => k + 1)
  }

  const overPar = keystrokes > challenge.par

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-61px)] max-w-3xl flex-col px-4 py-6">
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
        <span className={`tabular-nums ${overPar ? 'text-amber' : 'text-term'}`}>⌨ {keystrokes}</span>
        <span className="text-ink-dim">par {challenge.par}</span>
        <span className="text-ink-dim sm:ml-auto">🎯 {challenge.goal.describe}</span>
      </div>

      <div className="panel mt-3 flex-1 overflow-hidden">
        <VimEditor
          key={`${challenge.id}-${editorKey}`}
          challenge={challenge}
          onComplete={handleComplete}
          onKeystroke={setKeystrokes}
          onModeChange={setMode}
          frozen={!!outcome}
        />
      </div>

      <div className="mt-3 min-h-[1.75rem] text-sm">
        {showHint ? (
          <p className="text-ink-dim">💡 {challenge.hint}</p>
        ) : (
          <button
            onClick={() => setShowHint(true)}
            className="text-ink-dim underline decoration-dotted underline-offset-4 hover:text-term"
          >
            need a hint?
          </button>
        )}
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
