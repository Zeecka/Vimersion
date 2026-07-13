import { XPBar } from './XPBar'
import { Avatar } from './Avatar'
import { Emoji } from './Emoji'
import { useGame } from '../game/store'
import { sfx } from '../game/sound'
import { effectiveQuality, type QualitySetting } from '../game/quality'

const QUALITY_CYCLE: Record<QualitySetting, QualitySetting> = {
  auto: 'webgl',
  webgl: 'lite',
  lite: 'auto',
}
const QUALITY_LABEL: Record<QualitySetting, string> = { auto: 'Auto', webgl: '3D', lite: 'Lite' }

export function Hud({ onHome, onShop }: { onHome: () => void; onShop: () => void }) {
  const streak = useGame((s) => s.streak.count)
  const soundOn = useGame((s) => s.soundOn)
  const toggleSound = useGame((s) => s.toggleSound)
  const coins = useGame((s) => s.coins)
  const avatar = useGame((s) => s.equipped.avatar)
  const quality = useGame((s) => s.quality)
  const setQuality = useGame((s) => s.setQuality)

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 border-b border-border bg-panel/70 px-4 py-3 backdrop-blur">
      <button
        onClick={() => {
          sfx.ui()
          onHome()
        }}
        className="flex items-center gap-2"
      >
        <Avatar id={avatar} size={22} />
        <span className="font-terminal text-xl font-bold tracking-tight text-term glow-term transition-opacity hover:opacity-80">
          :Vimersion
        </span>
      </button>

      <div className="flex items-center gap-3 sm:gap-4">
        <XPBar />
        <button
          onClick={() => {
            sfx.ui()
            onShop()
          }}
          title="Shop"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-amber transition-colors hover:border-amber"
        >
          <span className="coin" /> <span className="tabular-nums">{coins}</span>
        </button>
        {streak > 0 && (
          <span title={`${streak}-day streak`} className="hidden items-center gap-1.5 text-sm text-amber sm:flex">
            <Emoji name="fire" size={14} /> <span className="tabular-nums">{streak}</span>
          </span>
        )}
        <button
          // Never steal focus from the editor when toggling mid-level.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            sfx.ui()
            setQuality(QUALITY_CYCLE[quality])
          }}
          className="rounded-full border border-border px-2.5 py-1 text-xs text-ink-dim transition-colors hover:border-term hover:text-term"
          title={`Graphics: ${QUALITY_LABEL[quality]}${quality === 'auto' ? ` (${effectiveQuality(quality) === 'webgl' ? '3D' : 'Lite'})` : ''} — click to change`}
          aria-label="Cycle graphics quality"
        >
          FX·{QUALITY_LABEL[quality]}
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            toggleSound()
            sfx.ui()
          }}
          className="opacity-80 transition-opacity hover:opacity-100"
          title={soundOn ? 'Mute sound' : 'Unmute sound'}
          aria-label="Toggle sound"
        >
          <Emoji name={soundOn ? 'sound-on' : 'mute'} size={18} />
        </button>
      </div>
    </header>
  )
}
