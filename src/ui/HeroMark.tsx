import type { HeroLook, AccessoryId, VisorStyle } from '../game/heroParts'

/**
 * Minimalistic 2D version of the 3D Hero robot — used wherever the full 3D hero
 * is too heavy or unavailable (top bar, home portrait, lite tier, Arcade piece,
 * Shop thumbnail). Reflects the same customization as the 3D model: three color
 * zones (body / trim / visor), a visor style, and an accessory. Eyes use a fixed
 * highlight so they read against any visor color.
 */
const EYE = '#dfeaff'

export function HeroMark({
  look,
  accessory = 'none',
  visorStyle = 'bar',
  size = 24,
  className = '',
}: {
  look: HeroLook
  accessory?: AccessoryId
  visorStyle?: VisorStyle
  size?: number
  className?: string
}) {
  const { body, trim, visor } = look
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
    >
      {/* cape sits behind the whole figure */}
      {accessory === 'cape' && <path d="M20 42 L44 42 L49 61 L15 61 Z" fill={trim} opacity={0.85} />}

      {/* ears */}
      <rect x="10.5" y="20" width="5" height="11" rx="2.5" fill={trim} />
      <rect x="48.5" y="20" width="5" height="11" rx="2.5" fill={trim} />
      {/* head */}
      <rect x="15" y="12" width="34" height="26" rx="9" fill={body} />
      <Visor style={visorStyle} visor={visor} trim={trim} />
      {/* neck */}
      <rect x="27" y="37" width="10" height="4" rx="1" fill={trim} />
      {/* arms */}
      <rect x="11.5" y="43" width="5" height="13" rx="2.5" fill={trim} />
      <rect x="47" y="43" width="5" height="13" rx="2.5" fill={trim} />
      {/* torso */}
      <rect x="18" y="41" width="28" height="17" rx="6" fill={body} />
      <rect x="29" y="46" width="6" height="6" rx="2" fill={visor} />

      <AccessoryMark id={accessory} trim={trim} body={body} />
    </svg>
  )
}

function Visor({ style, visor, trim }: { style: VisorStyle; visor: string; trim: string }) {
  switch (style) {
    case 'goggles':
      return (
        <>
          <rect x="30" y="23.5" width="4" height="2" fill={trim} />
          <circle cx="26" cy="24.5" r="6" fill={visor} />
          <circle cx="38" cy="24.5" r="6" fill={visor} />
          <circle cx="26" cy="24.5" r="2.4" fill={EYE} />
          <circle cx="38" cy="24.5" r="2.4" fill={EYE} />
        </>
      )
    case 'single':
      return (
        <>
          <rect x="20" y="18" width="24" height="13" rx="6" fill={visor} />
          <circle cx="32" cy="24.5" r="3.6" fill={EYE} />
        </>
      )
    case 'grille':
      return (
        <>
          <rect x="20" y="18" width="24" height="13" rx="6" fill={visor} />
          {[24, 28, 32, 36, 40].map((x) => (
            <rect key={x} x={x - 0.8} y="20" width="1.6" height="9" rx="0.8" fill={EYE} opacity={0.45} />
          ))}
        </>
      )
    case 'bar':
    default:
      return (
        <>
          <rect x="20" y="18" width="24" height="13" rx="6" fill={visor} />
          <circle cx="27" cy="24.5" r="2.7" fill={EYE} />
          <circle cx="37" cy="24.5" r="2.7" fill={EYE} />
        </>
      )
  }
}

function AccessoryMark({ id, trim, body }: { id: AccessoryId; trim: string; body: string }) {
  switch (id) {
    case 'antenna':
      return (
        <>
          <line x1="32" y1="6.5" x2="32" y2="12" stroke={trim} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="32" cy="5" r="2.8" fill={trim} />
        </>
      )
    case 'halo':
      return <ellipse cx="32" cy="9" rx="11" ry="3.4" fill="none" stroke={trim} strokeWidth="2.4" />
    case 'tophat':
      return (
        <>
          <rect x="17" y="10.5" width="30" height="3.6" rx="1.6" fill={trim} />
          <rect x="23" y="1" width="18" height="11" rx="2" fill={trim} />
          <rect x="23" y="8" width="18" height="2.6" fill={body} />
        </>
      )
    case 'headphones':
      return (
        <>
          <path d="M15 25 Q32 5 49 25" fill="none" stroke={trim} strokeWidth="3" strokeLinecap="round" />
          <rect x="10.5" y="21" width="6" height="10" rx="3" fill={trim} />
          <rect x="47.5" y="21" width="6" height="10" rx="3" fill={trim} />
        </>
      )
    case 'cape':
    case 'none':
    default:
      return null
  }
}
