import { useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useGame, type HeroEffect } from '../game/store'
import { AVATARS, THEMES, BACKGROUNDS, COSMETIC_BY_ID, type Cosmetic, type CosmeticKind } from '../game/cosmetics'
import { heroColorsFor } from '../game/avatarStyle'
import { sfx } from '../game/sound'
import { Avatar, PlayerAvatar } from './Avatar'
import { Emoji } from './Emoji'

const TABS: { key: CosmeticKind; label: string; items: Cosmetic[] }[] = [
  { key: 'avatar', label: 'Characters', items: AVATARS },
  { key: 'theme', label: 'Themes', items: THEMES },
  { key: 'background', label: 'Backgrounds', items: BACKGROUNDS },
]

/**
 * Static thumbnail for each background — a faithful, cheap snapshot of what the
 * live <Background/> scene renders (no canvas/parallax in the grid). CRT & Matrix
 * are theme-tinted with var(--color-term) so their swatches recolor exactly like
 * the real scenes do. Keep these in sync when a scene's look changes.
 */
function bgPreviewStyle(bg?: string): CSSProperties {
  switch (bg) {
    case 'synthwave':
      // sunset gradient + glowing striped sun
      return {
        background:
          'radial-gradient(circle at 50% 46%, #ffe66d, rgba(255,106,193,0.9) 24%, transparent 46%), linear-gradient(180deg, #180b2e 0%, #2d1b4e 34%, #6b2d5c 60%, #c94b7b 80%, #ff9e64 100%)',
      }
    case 'aurora':
      // drifting green/blue/violet light over deep navy
      return {
        background:
          'radial-gradient(circle at 24% 26%, #3ddc84, transparent 52%), radial-gradient(circle at 76% 36%, #59c2ff, transparent 52%), radial-gradient(circle at 52% 96%, #b78cff, transparent 56%), linear-gradient(180deg, #060a16, #0a0e14)',
      }
    case 'starfield':
      // warp: faint center glow with stars streaming outward
      return {
        background:
          'radial-gradient(circle at 50% 50%, rgba(89,194,255,0.16), transparent 42%), radial-gradient(1.4px 1.4px at 30% 42%, #fff, transparent), radial-gradient(1.4px 1.4px at 68% 58%, #59c2ff, transparent), radial-gradient(1px 1px at 44% 30%, #fff, transparent), radial-gradient(1px 1px at 60% 74%, #fff, transparent), radial-gradient(1px 1px at 82% 40%, #fff, transparent), #06080d',
      }
    case 'nebula':
      // deep-space color clouds + a bright core
      return {
        background:
          'radial-gradient(circle at 30% 26%, #7c3aed, transparent 55%), radial-gradient(circle at 74% 68%, #db2777, transparent 55%), radial-gradient(circle at 56% 48%, #0ea5e9, transparent 60%), radial-gradient(ellipse at 28% 18%, #1e1b4b, #0a0e14 70%)',
      }
    case 'cyber':
      // moon glow + dark skyline band over a violet city gradient
      return {
        background:
          'radial-gradient(circle at 78% 22%, rgba(89,194,255,0.5), transparent 40%), linear-gradient(180deg, transparent 62%, #0e0722 62%), linear-gradient(180deg, #0a0e14 0%, #101a2e 52%, #2a0e3a 100%)',
      }
    case 'matrix':
      // digital rain: theme-tinted glyph columns falling from the top
      return {
        background:
          'repeating-linear-gradient(90deg, transparent 0 6px, color-mix(in srgb, var(--color-term) 24%, transparent) 6px 7px, transparent 7px 13px), linear-gradient(180deg, color-mix(in srgb, var(--color-term) 16%, transparent), transparent 58%), #04120a',
      }
    case 'crt':
    default:
      // terminal glow at the top + scanlines, theme-tinted like the live scene
      return {
        background:
          'radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--color-term) 30%, transparent), transparent 62%), repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.28) 3px, transparent 4px), radial-gradient(ellipse at 50% -15%, #10161f, #070a11 72%)',
      }
  }
}

const EFFECTS: HeroEffect[] = ['sparkles', 'fire', 'bolt']

/**
 * Hero personalization: main colors + aura effect for the EQUIPPED character.
 * Applied everywhere the hero appears (homepage, top bar, "Your Hero" panel).
 */
function CustomizePanel() {
  const equippedAvatar = useGame((s) => s.equipped.avatar)
  const hero = useGame((s) => s.hero)
  const setHero = useGame((s) => s.setHero)

  const item = COSMETIC_BY_ID[equippedAvatar]
  const effective = heroColorsFor(equippedAvatar, hero)
  const customized = !!(hero.primary || hero.secondary)

  const pickers: { key: 'primary' | 'secondary'; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
  ]

  return (
    <div className="panel mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 p-4">
      <div className="flex items-center gap-3">
        <span
          className="rounded-full p-[2px]"
          style={{
            background: effective
              ? `linear-gradient(135deg, ${effective.primary}, ${effective.secondary})`
              : 'linear-gradient(135deg, var(--color-term), var(--color-cyan))',
          }}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-bg">
            <PlayerAvatar size={38} />
          </span>
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{item?.name ?? 'Your hero'}</p>
          <p className="text-[11px] text-ink-dim">Personalize your hero — colors &amp; aura apply everywhere.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {pickers.map((p) => (
          <label key={p.key} className="flex cursor-pointer flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-ink-dim">
            <input
              type="color"
              value={hero[p.key] ?? effective?.[p.key] ?? '#7c6bff'}
              onChange={(e) => setHero({ [p.key]: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-panel-2"
              aria-label={`${p.label} hero color`}
            />
            {p.label}
          </label>
        ))}
        <button
          disabled={!customized}
          onClick={() => {
            sfx.ui()
            setHero({ primary: null, secondary: null })
          }}
          className={`self-center rounded border border-border px-3 py-1.5 text-xs transition-colors ${
            customized ? 'text-ink-dim hover:border-term hover:text-term' : 'cursor-not-allowed opacity-40'
          }`}
        >
          reset colors
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-[10px] uppercase tracking-widest text-ink-dim">Aura</span>
        {EFFECTS.map((fx) => (
          <button
            key={fx}
            onClick={() => {
              setHero({ effect: fx })
              sfx.ui()
            }}
            title={`aura: ${fx}`}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
              hero.effect === fx ? 'border-term text-term' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            <Emoji name={fx} size={14} /> {fx}
          </button>
        ))}
      </div>
    </div>
  )
}

function ItemPreview({ c }: { c: Cosmetic }) {
  if (c.kind === 'avatar') {
    return (
      <div className="grid h-20 place-items-center rounded bg-panel-2">
        <Avatar id={c.id} size={44} />
      </div>
    )
  }
  if (c.kind === 'theme') {
    return <div className="h-20 rounded" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentDim})` }} />
  }
  return <div className="h-20 overflow-hidden rounded" style={bgPreviewStyle(c.bg)} />
}

export function Shop() {
  const coins = useGame((s) => s.coins)
  const owned = useGame((s) => s.owned)
  const equipped = useGame((s) => s.equipped)
  const buy = useGame((s) => s.buyItem)
  const equip = useGame((s) => s.equipItem)
  const [tab, setTab] = useState<CosmeticKind>('avatar')
  const items = TABS.find((t) => t.key === tab)!.items

  const onBuy = (c: Cosmetic) => {
    if (buy(c.id)) {
      sfx.levelUp()
      equip(c.id) // auto-equip on purchase
    } else sfx.error()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-terminal text-4xl text-term glow-term">Shop</h2>
          <p className="mt-1 text-ink-dim">Earn coins by playing. Spend them on your look.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="coin" style={{ width: '1.4em', height: '1.4em' }} />
          <span className="font-terminal text-3xl tabular-nums text-amber">{coins}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              sfx.ui()
            }}
            className={`rounded border px-4 py-1.5 text-sm transition-colors ${
              tab === t.key ? 'border-term text-term' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'avatar' && <CustomizePanel />}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((c) => {
          const isOwned = owned.includes(c.id)
          const isEquipped = equipped[c.kind] === c.id
          const canAfford = coins >= c.price
          return (
            <motion.div key={c.id} layout className="panel flex flex-col p-3">
              <ItemPreview c={c} />
              <div className="mt-2 flex-1">
                <p className="text-sm font-medium text-ink">{c.name}</p>
                {c.blurb && <p className="text-[11px] leading-snug text-ink-dim">{c.blurb}</p>}
              </div>
              <div className="mt-3">
                {isEquipped ? (
                  <div className="rounded py-1.5 text-center text-xs font-bold text-term" style={{ background: 'color-mix(in srgb, var(--color-term) 15%, transparent)' }}>
                    ✓ Equipped
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => {
                      equip(c.id)
                      sfx.ui()
                    }}
                    className="w-full rounded border border-term py-1.5 text-xs font-bold text-term transition-colors hover:bg-term/10"
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    disabled={!canAfford}
                    onClick={() => onBuy(c)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded py-1.5 text-xs font-bold transition-transform ${
                      canAfford ? 'btn-accent hover:scale-[1.03]' : 'cursor-not-allowed bg-panel-2 text-ink-dim'
                    }`}
                  >
                    <span className="coin" /> {c.price}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
