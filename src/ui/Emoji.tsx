import { EMOJI } from './emoji'

/** Renders a bundled Twemoji SVG as an inline image (font-independent). */
export function Emoji({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const src = EMOJI[name]
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
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
    />
  )
}
