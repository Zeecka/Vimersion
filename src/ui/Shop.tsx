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

function bgPreviewStyle(bg?: string): CSSProperties {
  switch (bg) {
    case 'platform':
      return {
        background:
          'radial-gradient(circle at 24% 78%, #1f6b3f 0 22px, transparent 22px), radial-gradient(circle at 60% 82%, #1f6b3f 0 28px, transparent 28px), linear-gradient(180deg, #241a4e 0%, #5a2f6e 55%, #ff9e64 100%)',
      }
    case 'aurora':
      return {
        background:
          'radial-gradient(circle at 30% 30%, #3ddc84, transparent 55%), radial-gradient(circle at 72% 65%, #59c2ff, transparent 55%), #0a0e14',
      }
    case 'synthwave':
      return { background: 'linear-gradient(180deg, #1a1030, #3a1547)' }
    case 'starfield':
      return {
        background:
          'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 62% 68%, #fff, transparent), radial-gradient(1px 1px at 82% 22%, #fff, transparent), #0a0e14',
      }
    case 'nebula':
      return {
        background:
          'radial-gradient(circle at 30% 28%, #7c3aed, transparent 55%), radial-gradient(circle at 72% 70%, #db2777, transparent 55%), radial-gradient(circle at 55% 45%, #0ea5e9, transparent 60%), #0a0e14',
      }
    case 'cyber':
      return { background: 'linear-gradient(180deg, #101a2e 40%, #2a0e3a 100%)' }
    case 'matrix':
      return { background: 'linear-gradient(180deg, #0a0e14, #04140a)' }
    default:
      return {
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(61,220,132,0.16), transparent 60%), repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.35) 3px, transparent 4px), #0a0e14',
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
