import { CHARACTER_SVG } from '../game/characters'
import { heroColorsFor, useAvatarSrc } from '../game/avatarStyle'
import { useGame } from '../game/store'

interface AvatarProps {
  id: string
  size?: number
  className?: string
  /** Hero personalization colors; null/undefined renders the stock art. */
  colors?: { primary: string; secondary: string } | null
}

/** Renders a character. The default 'cursor' shows a themed block. */
export function Avatar({ id, size = 24, className = '', colors = null }: AvatarProps) {
  const src = useAvatarSrc(id, colors)
  if (id === 'cursor') {
    const color = colors?.primary ?? 'var(--color-term)'
    return (
      <span
        className={className}
        style={{
          fontSize: size,
          lineHeight: 1,
          display: 'inline-block',
          color,
          textShadow: `0 0 8px color-mix(in srgb, ${color} 60%, transparent)`,
        }}
      >
        ▉
      </span>
    )
  }
  if (!CHARACTER_SVG[id]) return null
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

/** The player's own equipped character, with their personalization applied. */
export function PlayerAvatar({ size = 24, className = '' }: { size?: number; className?: string }) {
  const avatar = useGame((s) => s.equipped.avatar)
  const hero = useGame((s) => s.hero)
  // Only recolor when the player actually picked colors — the stock asset
  // already carries the character's own palette.
  const custom = hero.primary || hero.secondary ? heroColorsFor(avatar, hero) : null
  return <Avatar id={avatar} size={size} className={className} colors={custom} />
}
