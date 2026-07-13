import { CHARACTER_SVG } from '../game/characters'

/** Renders the player's character. The default 'cursor' shows a themed block. */
export function Avatar({ id, size = 24, className = '' }: { id: string; size?: number; className?: string }) {
  if (id === 'cursor') {
    return (
      <span
        className={className}
        style={{
          fontSize: size,
          lineHeight: 1,
          display: 'inline-block',
          color: 'var(--color-term)',
          textShadow: '0 0 8px color-mix(in srgb, var(--color-term) 60%, transparent)',
        }}
      >
        ▉
      </span>
    )
  }
  const src = CHARACTER_SVG[id]
  if (!src) return null
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={{ display: 'inline-block', borderRadius: Math.round(size * 0.18), verticalAlign: '-0.15em' }}
    />
  )
}
