import { Emoji } from './Emoji'

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
  return <Emoji name={id} size={size} className={className} />
}
