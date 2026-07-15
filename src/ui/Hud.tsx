import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { XPBar } from './XPBar'
import { PlayerAvatar } from './Avatar'
import { Emoji } from './Emoji'
import { AccountButton, AccountModal } from './Account'
import { CheatsheetButton } from './Cheatsheet'
import { useGame, MASTERY_THRESHOLD } from '../game/store'
import { useAccount, flushSync, verifiedShareUrl } from '../game/account'
import { levelFromXp } from '../game/xp'
import { shareScore } from '../game/share'
import { COMMANDS } from '../game/commands'
import { CHALLENGES } from '../content/tiers'
import { sfx } from '../game/sound'

/**
 * The persistent top bar — on every screen, home included. Carries the main
 * shortcuts (customize / maps / share / day streak) plus coins, XP, sound and
 * the optional account control. (Graphics quality is auto-detected per device;
 * there is no manual toggle.)
 */
export function Hud({ onHome, onShop, onMap }: { onHome: () => void; onShop: () => void; onMap: () => void }) {
  const streak = useGame((s) => s.streak.count)
  const soundOn = useGame((s) => s.soundOn)
  const toggleSound = useGame((s) => s.toggleSound)
  const coins = useGame((s) => s.coins)
  const accountStatus = useAccount((s) => s.status)

  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [sharePrompt, setSharePrompt] = useState(false)

  const doShare = async (verified: string | null) => {
    const s = useGame.getState()
    const stats = {
      level: levelFromXp(s.xp),
      solved: Object.keys(s.completed).length,
      total: CHALLENGES.length,
      mastered: COMMANDS.filter((c) => (s.mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length,
      coins: s.coins,
    }
    const res = await shareScore(stats, verified)
    setShareMsg(
      res === 'shared' ? 'Shared! 🎉' : res === 'copied' ? 'Score copied to clipboard!' : 'Could not share — try again',
    )
    window.setTimeout(() => setShareMsg(null), 2600)
  }

  const onShare = async () => {
    sfx.ui()
    const verified = verifiedShareUrl()
    if (verified) {
      await flushSync() // the link must show the numbers being shared
      await doShare(verified)
    } else if (accountStatus === 'anon') {
      setSharePrompt(true) // offer a verified share first
    } else {
      await doShare(null)
    }
  }

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 border-b border-border bg-panel/70 px-4 py-3 backdrop-blur">
      <button
        onClick={() => {
          sfx.ui()
          onHome()
        }}
        className="flex items-center gap-2"
      >
        <PlayerAvatar size={22} />
        <span className="hidden font-terminal text-xl font-bold tracking-tight text-term glow-term transition-opacity hover:opacity-80 sm:inline">
          :Vimersion
        </span>
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              sfx.ui()
              onShop()
            }}
            title="Customize your character"
            aria-label="Customize your character"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-amber hover:text-amber"
          >
            <Emoji name="palette" size={14} /> <span className="hidden md:inline">customize</span>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              sfx.ui()
              onMap()
            }}
            title="World map"
            aria-label="World map"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
          >
            <Emoji name="target" size={14} /> <span className="hidden md:inline">maps</span>
          </button>
          <CheatsheetButton
            label="cheatsheet"
            responsive
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-magenta hover:text-magenta"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void onShare()}
            title="Share my score"
            aria-label="Share my score"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-cyan hover:text-cyan"
          >
            <Emoji name="rocket" size={14} /> <span className="hidden md:inline">share my score</span>
          </button>
          <span
            title={streak > 0 ? `${streak}-day streak — play daily to keep it alive` : 'Play daily to build a streak'}
            className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm ${
              streak > 0 ? 'text-amber' : 'text-ink-dim opacity-70'
            }`}
          >
            <Emoji name="fire" size={14} /> <span className="tabular-nums">{streak}</span>
            <span className="hidden lg:inline">day streak</span>
          </span>
        </nav>

        <XPBar />
        <button
          onClick={() => {
            sfx.ui()
            onShop()
          }}
          title="Shop"
          aria-label={`Shop — ${coins} coins`}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-amber transition-colors hover:border-amber"
        >
          <span className="coin" /> <span className="tabular-nums">{coins}</span>
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
        <AccountButton />
      </div>

      {shareMsg && (
        <p className="absolute right-4 top-full mt-2 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-term shadow-lg">
          {shareMsg}
        </p>
      )}
      <AnimatePresence>
        {sharePrompt && (
          <AccountModal
            onClose={() => setSharePrompt(false)}
            note="Sign in first and your share link shows a verified, server-stored score."
            onShareAnyway={() => {
              setSharePrompt(false)
              void doShare(null)
            }}
          />
        )}
      </AnimatePresence>
    </header>
  )
}
