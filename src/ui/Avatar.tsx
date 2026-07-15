import { useGame } from '../game/store'
import { heroLookFrom } from '../game/heroParts'
import { HeroMark } from './HeroMark'

/**
 * The player's Hero, rendered as the minimalistic 2D <HeroMark/> tinted by the
 * player's chosen colors. Used in the top bar, home portrait, lite "Your Hero"
 * panel and the Arcade piece. (The full animated 3D hero lives in <Hero3D/>.)
 */
export function PlayerAvatar({ size = 24, className = '' }: { size?: number; className?: string }) {
  const hero = useGame((s) => s.hero)
  return (
    <HeroMark
      look={heroLookFrom(hero)}
      accessory={hero.accessory}
      visorStyle={hero.visorStyle}
      size={size}
      className={className}
    />
  )
}
