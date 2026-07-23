import { COMMANDS, type VimCommand } from '../game/commands'
import { useGame, MASTERY_THRESHOLD } from '../game/store'
import { useT } from '../game/i18n'

/** Display order for command categories (labels are translated at render). */
const CATEGORIES: Array<{ key: string }> = [
  { key: 'modes' },
  { key: 'motion' },
  { key: 'edit' },
  { key: 'operator' },
  { key: 'text-object' },
  { key: 'ex' },
  { key: 'power' },
]

/** The player's growing collection of learned commands (Octalysis "Ownership" drive). */
export function CommandBelt() {
  const mastery = useGame((s) => s.mastery)
  const t = useT()
  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length

  const groups = CATEGORIES.map((cat) => ({
    ...cat,
    label: t(`belt.cat.${cat.key}`),
    commands: COMMANDS.filter((c) => c.category === cat.key),
  })).filter((g) => g.commands.length > 0)

  const cap = (c: VimCommand) => {
    const reps = mastery[c.id] ?? 0
    const isMastered = reps >= MASTERY_THRESHOLD
    const started = reps > 0
    const label = t(`command.${c.id}.label`, undefined, c.label)
    return (
      <span
        key={c.id}
        title={`${c.keys} — ${label}${reps ? ` (${reps})` : ''}`}
        className={`keycap ${isMastered ? 'border-term text-term' : started ? 'text-ink' : 'opacity-35'}`}
        style={isMastered ? { boxShadow: '0 0 8px color-mix(in srgb, var(--color-term) 40%, transparent)' } : undefined}
      >
        {c.keys}
      </span>
    )
  }

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-terminal text-xl font-semibold text-term">{t('belt.title')}</h3>
        <span className="text-xs tabular-nums text-ink-dim">
          {t('belt.mastered', { n: mastered, total: COMMANDS.length })}
        </span>
      </div>
      <div className="space-y-2.5">
        {groups.map((g) => (
          <div key={g.key} className="flex flex-wrap items-baseline gap-1.5">
            <span className="w-full text-[10px] uppercase tracking-widest text-ink-dim sm:w-24 sm:shrink-0">
              {g.label}
            </span>
            {g.commands.map(cap)}
          </div>
        ))}
      </div>
    </div>
  )
}
