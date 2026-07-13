import { useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { AVATARS, THEMES, BACKGROUNDS, type Cosmetic, type CosmeticKind } from '../game/cosmetics'
import { sfx } from '../game/sound'
import { Avatar } from './Avatar'

const TABS: { key: CosmeticKind; label: string; items: Cosmetic[] }[] = [
  { key: 'avatar', label: 'Characters', items: AVATARS },
  { key: 'theme', label: 'Themes', items: THEMES },
  { key: 'background', label: 'Backgrounds', items: BACKGROUNDS },
]

function bgPreviewStyle(bg?: string): CSSProperties {
  switch (bg) {
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
