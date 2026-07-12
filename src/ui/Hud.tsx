import { XPBar } from './XPBar'
import { useGame } from '../game/store'
import { sfx } from '../game/sound'

export function Hud({ onHome }: { onHome: () => void }) {
  const streak = useGame((s) => s.streak.count)
  const soundOn = useGame((s) => s.soundOn)
  const toggleSound = useGame((s) => s.toggleSound)

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 border-b border-border bg-panel/70 px-4 py-3 backdrop-blur">
      <button
        onClick={() => {
          sfx.ui()
          onHome()
        }}
        className="font-terminal text-2xl text-term glow-term transition-opacity hover:opacity-80"
      >
        :Vimersion
      </button>

      <div className="flex items-center gap-4">
        <XPBar />
        {streak > 0 && (
          <span title={`${streak}-day streak`} className="flex items-center gap-1 text-sm text-amber">
            🔥 <span className="tabular-nums">{streak}</span>
          </span>
        )}
        <button
          onClick={() => {
            toggleSound()
            sfx.ui()
          }}
          className="text-ink-dim transition-colors hover:text-term"
          title={soundOn ? 'Mute sound' : 'Unmute sound'}
          aria-label="Toggle sound"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>
    </header>
  )
}
