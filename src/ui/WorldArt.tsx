import type { CSSProperties, ReactElement } from 'react'

/**
 * Per-world procedural abstract art, painted behind the play surface (the editor
 * / tmux surface) in place of the old flat inset-glow. Pure inline SVG — lite
 * tier, no 3D, no network — deterministic (no Math.random, so it never flickers
 * across renders) and tinted with the world's `accent`, so every level in a
 * world shares one abstract backdrop. Decorative only: pointer-events-none and
 * aria-hidden, and kept low-contrast so code stays comfortably legible on top.
 *
 * Each of the six worlds gets its own geometry: rings, waves, low-poly shards,
 * a search grid, orbital particles, and a radial mandala.
 */

const W = 1200
const H = 800
const CX = W / 2
const CY = H / 2

const TAU = Math.PI * 2

/** World 1 · Survive — concentric hexagon rings: calm, orderly, foundational. */
function HexRings({ c }: { c: string }) {
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (TAU / 6) * k - Math.PI / 2
      return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`
    }).join(' ')
  return (
    <g fill="none" stroke={c} strokeWidth={1.6}>
      {Array.from({ length: 9 }, (_, i) => (
        <polygon key={i} points={hex(60 + i * 60)} opacity={0.16 - i * 0.012} />
      ))}
    </g>
  )
}

/** World 2 · Comfortable — layered sine waves: flowing, word-by-word motion. */
function Waves({ c }: { c: string }) {
  const wave = (phase: number, amp: number, y: number) => {
    const pts = Array.from({ length: 49 }, (_, i) => {
      const x = (W / 48) * i
      return `${x.toFixed(1)},${(y + Math.sin(i / 4 + phase) * amp).toFixed(1)}`
    })
    return `M ${pts.join(' L ')}`
  }
  return (
    <g fill="none" stroke={c} strokeWidth={2}>
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={wave(i * 0.9, 26 + i * 4, 120 + i * 90)} opacity={0.14 - i * 0.01} />
      ))}
    </g>
  )
}

/** World 3 · Faster — low-poly triangular shards: sharp, quick, kinetic. */
function Shards({ c }: { c: string }) {
  // A deterministic pseudo-scatter via trig — no Math.random, stable per render.
  const pt = (i: number, k: number) => {
    const x = ((Math.sin(i * 12.9898 + k * 4.14) * 43758.5) % 1) * W
    const y = ((Math.sin(i * 78.233 + k * 2.71) * 12543.3) % 1) * H
    return `${Math.abs(x).toFixed(1)},${Math.abs(y).toFixed(1)}`
  }
  return (
    <g stroke={c} strokeWidth={1.4} fill={c}>
      {Array.from({ length: 22 }, (_, i) => (
        <polygon key={i} points={`${pt(i, 0)} ${pt(i, 1)} ${pt(i, 2)}`} fillOpacity={0.05} strokeOpacity={0.12} />
      ))}
    </g>
  )
}

/** World 4 · Seeker — a search grid with a scanning crosshair of circles. */
function SearchGrid({ c }: { c: string }) {
  const cols = 12
  const rows = 8
  return (
    <g stroke={c}>
      <g strokeWidth={1} opacity={0.08}>
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line key={`v${i}`} x1={(W / cols) * i} y1={0} x2={(W / cols) * i} y2={H} />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(H / rows) * i} x2={W} y2={(H / rows) * i} />
        ))}
      </g>
      <g fill="none" strokeWidth={2}>
        {Array.from({ length: 5 }, (_, i) => (
          <circle key={i} cx={CX} cy={CY} r={50 + i * 55} opacity={0.16 - i * 0.02} />
        ))}
      </g>
      <line x1={CX} y1={CY - 260} x2={CX} y2={CY + 260} strokeWidth={1.5} opacity={0.12} />
      <line x1={CX - 360} y1={CY} x2={CX + 360} y2={CY} strokeWidth={1.5} opacity={0.12} />
    </g>
  )
}

/** World 5 · Superpowers — orbital particle rings: energy, registers, macros. */
function Orbits({ c }: { c: string }) {
  const rings = [110, 180, 250, 330, 410]
  return (
    <g stroke={c} fill={c}>
      {rings.map((r, i) => (
        <g key={i}>
          <ellipse
            cx={CX}
            cy={CY}
            rx={r}
            ry={r * 0.42}
            fill="none"
            strokeWidth={1.4}
            opacity={0.14 - i * 0.015}
            transform={`rotate(${i * 36} ${CX} ${CY})`}
          />
          {Array.from({ length: 3 }, (_, k) => {
            const a = (TAU / 3) * k + i
            const x = CX + r * Math.cos(a)
            const y = CY + r * 0.42 * Math.sin(a)
            return <circle key={k} cx={x} cy={y} r={4} opacity={0.22 - i * 0.02} transform={`rotate(${i * 36} ${CX} ${CY})`} />
          })}
        </g>
      ))}
    </g>
  )
}

/** World 6 · Legend — a radial mandala / kaleidoscope: mastery, symmetry. */
function Mandala({ c }: { c: string }) {
  const spokes = 24
  return (
    <g stroke={c} fill="none" strokeWidth={1.3}>
      {Array.from({ length: spokes }, (_, i) => {
        const a = (TAU / spokes) * i
        const x = CX + 470 * Math.cos(a)
        const y = CY + 470 * Math.sin(a)
        return <line key={`s${i}`} x1={CX} y1={CY} x2={x} y2={y} opacity={0.06} />
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={`c${i}`} cx={CX} cy={CY} r={70 + i * 65} opacity={0.14 - i * 0.015} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (TAU / 12) * i
        const x = CX + 210 * Math.cos(a)
        const y = CY + 210 * Math.sin(a)
        return <circle key={`p${i}`} cx={x} cy={y} r={44} opacity={0.09} />
      })}
    </g>
  )
}

const ART: Record<number, (p: { c: string }) => ReactElement> = {
  1: HexRings,
  2: Waves,
  3: Shards,
  4: SearchGrid,
  5: Orbits,
  6: Mandala,
}

export function WorldArt({
  tier,
  accent,
  className,
  style,
}: {
  tier: number
  accent: string
  className?: string
  style?: CSSProperties
}) {
  const Pattern = ART[tier] ?? HexRings
  const gradId = `wa-grad-${tier}`
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`} style={style}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
            <stop offset="55%" stopColor={accent} stopOpacity={0.05} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* base accent wash — the soft top glow the flat version used to provide */}
        <rect x={0} y={0} width={W} height={H} fill={`url(#${gradId})`} />
        <Pattern c={accent} />
      </svg>
    </div>
  )
}
