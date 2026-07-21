import { useGame } from '../game/store'
import type { HeroCustom } from '../game/heroParts'
import { characterFrom } from '../game/characters'

/**
 * A hero's 2D mark — the equipped character's static PNG thumbnail. Used wherever
 * a lightweight avatar is needed: the lite tier, Suspense fallbacks, and any 2D
 * placement. (The full animated 3D hero lives in <Hero3D/>.)
 */
export function CharacterMark({ hero, size = 24, className = '' }: { hero: HeroCustom; size?: number; className?: string }) {
  const cfg = characterFrom(hero.character)
  return (
    <img
      src={cfg.thumb.url}
      width={size}
      height={size}
      alt=""
      aria-hidden
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain', verticalAlign: '-0.15em' }}
    />
  )
}

/**
 * The player's Hero, rendered as the minimalistic 2D mark for their equipped
 * character. Used in the top bar, home portrait, lite "Your Hero" panel and the
 * Arcade piece. (The full animated 3D hero lives in <Hero3D/>.)
 */
export function PlayerAvatar({ size = 24, className = '' }: { size?: number; className?: string }) {
  const hero = useGame((s) => s.hero)
  return <CharacterMark hero={hero} size={size} className={className} />
}
