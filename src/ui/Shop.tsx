import { Suspense, lazy, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { THEMES, BACKGROUNDS, COSMETIC_BY_ID, type Cosmetic } from '../game/cosmetics'
import { heroLookFrom, auraSku, ACCESSORIES, VISOR_STYLES, AURA_STYLES, type AccessoryId, type VisorStyle } from '../game/heroParts'
import { effectiveQuality } from '../game/quality'
import { useStage } from '../three/stageState'
import { sfx } from '../game/sound'
import { HeroMark } from './HeroMark'
import { Emoji } from './Emoji'

// Local Suspense boundary — the 3D hero preview never blocks the rest of the Shop.
const Hero3D = lazy(() => import('../three/Hero3D'))

type TabKey = 'characters' | 'theme' | 'background'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'characters', label: 'Characters' },
  { key: 'theme', label: 'Themes' },
  { key: 'background', label: 'Backgrounds' },
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

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-ink-dim">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-border bg-panel-2"
        aria-label={hint ?? `${label} color`}
      />
      {label}
    </label>
  )
}

function PickRow<T extends string>({
  label,
  items,
  active,
  onPick,
}: {
  label: string
  items: { id: T; name: string }[]
  active: T
  onPick: (id: T) => void
}) {
  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-widest text-ink-dim">{label}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => {
              onPick(it.id)
              sfx.ui()
            }}
            className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
              active === it.id ? 'border-term text-term' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            {it.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The Hero customizer — replaces the old fixed-avatar roster. A live 3D preview
 * of the equipped Hero (2D <HeroMark/> in the lite tier) plus controls for
 * per-zone colors, visor style, accessory and a custom aura.
 */
function CharacterStudio() {
  const hero = useGame((s) => s.hero)
  const setHero = useGame((s) => s.setHero)
  const equipped = useGame((s) => s.equipped)
  const owned = useGame((s) => s.owned)
  const coins = useGame((s) => s.coins)
  const buyAura = useGame((s) => s.buyAura)
  const quality = useGame((s) => s.quality)
  const contextLost = useStage((s) => s.contextLost)
  const tier = contextLost ? 'lite' : effectiveQuality(quality)

  const look = heroLookFrom(hero)
  const accent = COSMETIC_BY_ID[equipped.theme]?.accent ?? '#7c6bff'
  const auraColor = hero.aura.color ?? accent
  const customized =
    !!(hero.body || hero.trim || hero.visor || hero.aura.color) ||
    hero.accessory !== 'none' ||
    hero.visorStyle !== 'bar' ||
    hero.aura.style !== 'sparkles' ||
    hero.aura.intensity !== 0.6

  return (
    <div className="panel mt-5 p-4 sm:p-5">
      <p className="text-sm text-ink-dim">Your one Hero — style it, and it appears everywhere you play.</p>

      {/* live preview */}
      <div
        className="relative mx-auto mt-3 h-56 w-full max-w-xs overflow-hidden rounded-xl border border-border"
        style={{ background: 'radial-gradient(ellipse at 50% 15%, color-mix(in srgb, var(--color-term) 12%, #0b0f18), #080b11 78%)' }}
      >
        {tier === 'webgl' ? (
          <Suspense fallback={<div className="grid h-full place-items-center"><HeroMark look={look} size={120} /></div>}>
            <Hero3D reaction="idle" hero={hero} />
          </Suspense>
        ) : (
          <div className="grid h-full place-items-center">
            <HeroMark look={look} size={120} />
          </div>
        )}
      </div>

      {/* colors */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-dim">Colors</div>
        <div className="mt-2 flex gap-4">
          <ColorField label="Body" value={look.body} onChange={(v) => setHero({ body: v })} />
          <ColorField label="Trim" value={look.trim} onChange={(v) => setHero({ trim: v })} />
          <ColorField label="Visor" value={look.visor} onChange={(v) => setHero({ visor: v })} />
        </div>
      </div>

      <PickRow<VisorStyle> label="Visor Style" items={VISOR_STYLES} active={hero.visorStyle} onPick={(id) => setHero({ visorStyle: id })} />
      <PickRow<AccessoryId> label="Accessory" items={ACCESSORIES} active={hero.accessory} onPick={(id) => setHero({ accessory: id })} />

      {/* aura — each style is a coin purchase; color & intensity are free once owned */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-dim">Aura</div>
        <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-3">
          <ColorField label="Color" hint="Aura color" value={auraColor} onChange={(v) => setHero({ aura: { color: v } })} />
          <div className="flex flex-wrap gap-1.5">
            {AURA_STYLES.map((a) => {
              const isOwned = owned.includes(auraSku(a.id))
              const isActive = hero.aura.style === a.id
              const canAfford = coins >= a.price
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (isOwned) {
                      setHero({ aura: { style: a.id } })
                      sfx.ui()
                    } else if (buyAura(a.id)) {
                      setHero({ aura: { style: a.id } }) // auto-equip on purchase
                      sfx.levelUp()
                    } else {
                      sfx.error()
                    }
                  }}
                  title={isOwned ? `Equip ${a.name}` : `Buy ${a.name} for ${a.price} coins`}
                  className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'border-term text-term'
                      : isOwned
                        ? 'border-border text-ink-dim hover:text-ink'
                        : canAfford
                          ? 'border-amber/50 text-amber hover:bg-amber/10'
                          : 'cursor-not-allowed border-border text-ink-dim opacity-60'
                  }`}
                >
                  <Emoji name={a.emoji} size={14} /> {a.name}
                  {!isOwned && (
                    <span className="ml-0.5 inline-flex items-center gap-0.5 tabular-nums">
                      <span className="coin" style={{ width: '0.85em', height: '0.85em' }} /> {a.price}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <label className="flex min-w-[130px] flex-1 flex-col gap-1 text-[10px] uppercase tracking-widest text-ink-dim">
            Intensity
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={hero.aura.intensity}
              onChange={(e) => setHero({ aura: { intensity: Number(e.target.value) } })}
              style={{ accentColor: 'var(--color-term)' }}
              aria-label="Aura intensity"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          disabled={!customized}
          onClick={() => {
            sfx.ui()
            setHero({ body: null, trim: null, visor: null, accessory: 'none', visorStyle: 'bar', aura: { color: null, style: 'sparkles', intensity: 0.6 } })
          }}
          className={`rounded border border-border px-3 py-1.5 text-xs transition-colors ${
            customized ? 'text-ink-dim hover:border-term hover:text-term' : 'cursor-not-allowed opacity-40'
          }`}
        >
          reset hero
        </button>
      </div>
    </div>
  )
}

function ItemPreview({ c }: { c: Cosmetic }) {
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
  const [tab, setTab] = useState<TabKey>('characters')
  const items = tab === 'theme' ? THEMES : tab === 'background' ? BACKGROUNDS : []

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

      {tab === 'characters' ? (
        <CharacterStudio />
      ) : (
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
      )}
    </div>
  )
}
