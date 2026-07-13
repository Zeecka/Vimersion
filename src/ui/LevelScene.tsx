import { type CSSProperties } from 'react'

/**
 * A unique illustrated backdrop for each level, rendered behind the code editor.
 * Every scene is procedural SVG/CSS (offline, no image assets) and is deliberately
 * dark + scrimmed so the code on top stays perfectly legible.
 */

type Motif =
  | 'mountains'
  | 'city'
  | 'forest'
  | 'waves'
  | 'arches'
  | 'dunes'
  | 'crystals'
  | 'circuit'
  | 'cavern'
  | 'ruins'
  | 'orbs'
  | 'portal'

type Particle = 'stars' | 'motes' | 'snow' | 'none'

interface Celestial {
  color: string
  x: string
  y: string
  size: number
}

interface SceneSpec {
  id: string
  sky: string[]
  motif: Motif
  mc: string[] // motif colors
  accent: string // window / node / mote color
  celestial?: Celestial
  particles: Particle
}

function svgUrl(inner: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='220' preserveAspectRatio='none'>${inner}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// ---- Motif renderers (return the inner SVG markup for a 400x220 canvas) ----

function motifInner(motif: Motif, mc: string[], accent: string, seed: number): string {
  const a = mc[0]
  const b = mc[1] ?? mc[0]
  const c = mc[2] ?? b
  switch (motif) {
    case 'mountains':
      return (
        `<polygon fill='${a}' points='0,220 70,80 140,150 210,60 290,140 360,74 400,128 400,220'/>` +
        `<polygon fill='${b}' points='0,220 60,150 130,182 210,118 300,176 380,128 400,158 400,220'/>` +
        `<g fill='#ffffff' opacity='0.10'><polygon points='210,60 232,92 188,92'/><polygon points='70,80 88,108 52,108'/></g>`
      )
    case 'city': {
      const b1 = [
        [12, 118, 46], [66, 78, 38], [112, 138, 34], [154, 60, 30], [192, 100, 44],
        [244, 46, 32], [284, 116, 40], [332, 70, 54],
      ]
      const buildings = b1.map(([x, y, w]) => `<rect x='${x}' y='${y}' width='${w}' height='${220 - y}'/>`).join('')
      const win = b1
        .flatMap(([x, y, w]) => {
          const cells: string[] = []
          for (let wx = x + 6; wx < x + w - 4; wx += 10)
            for (let wy = y + 8; wy < 212; wy += 14) if ((wx + wy + seed) % 3 === 0) cells.push(`<rect x='${wx}' y='${wy}' width='4' height='6'/>`)
          return cells
        })
        .join('')
      return `<g fill='${a}'>${buildings}</g><g fill='${accent}' opacity='0.85'>${win}</g>`
    }
    case 'forest': {
      const back = [30, 90, 150, 210, 270, 330]
        .map((x) => `<polygon points='${x - 34},220 ${x},110 ${x + 34},220'/>`)
        .join('')
      const front = [0, 64, 130, 196, 262, 330, 400]
        .map((x) => `<polygon points='${x - 44},220 ${x},146 ${x + 44},220'/>`)
        .join('')
      return `<g fill='${a}'>${back}</g><g fill='${b}'>${front}</g>`
    }
    case 'waves':
      return (
        `<path fill='${a}' d='M0,150 Q50,132 100,150 T200,150 T300,150 T400,150 V220 H0 Z'/>` +
        `<path fill='${b}' d='M0,176 Q60,158 120,176 T240,176 T360,176 T400,176 V220 H0 Z'/>` +
        `<path fill='${c}' d='M0,198 Q50,186 100,198 T200,198 T300,198 T400,198 V220 H0 Z'/>`
      )
    case 'arches':
      return (
        `<polygon fill='${a}' points='40,120 200,66 360,120'/>` +
        `<rect x='40' y='118' width='320' height='16' fill='${a}'/>` +
        [66, 116, 166, 216, 266, 316].map((x) => `<rect x='${x}' y='134' width='20' height='72' fill='${b}'/>`).join('') +
        `<rect x='28' y='204' width='344' height='16' fill='${a}'/>`
      )
    case 'dunes':
      return (
        `<path fill='${a}' d='M0,168 C110,138 180,192 280,164 S400,148 400,176 L400,220 L0,220 Z'/>` +
        `<path fill='${b}' d='M0,196 C90,178 210,206 300,190 S400,186 400,202 L400,220 L0,220 Z'/>`
      )
    case 'crystals':
      return (
        `<g fill='${a}'>` +
        `<polygon points='36,220 62,120 92,220'/><polygon points='120,220 150,96 182,220'/>` +
        `<polygon points='210,220 250,132 288,220'/><polygon points='300,220 336,104 372,220'/></g>` +
        `<g fill='${b}' opacity='0.75'><polygon points='62,120 76,168 48,168'/><polygon points='150,96 166,150 134,150'/>` +
        `<polygon points='250,132 266,176 234,176'/><polygon points='336,104 352,158 320,158'/></g>`
      )
    case 'circuit': {
      const lines = [
        'M0,60 H120 V120 H240', 'M400,40 H300 V150 H180', 'M40,220 V150 H160 V90',
        'M360,220 V160 H260 V110 H340', 'M0,180 H90 V120', 'M200,220 V180 H400',
      ].map((d) => `<path d='${d}'/>`).join('')
      const nodes = [[120, 120], [240, 120], [300, 150], [180, 150], [160, 150], [90, 120], [260, 160], [340, 110], [200, 180]]
        .map(([x, y]) => `<circle cx='${x}' cy='${y}' r='3.5'/>`).join('')
      return `<g stroke='${a}' stroke-width='2' fill='none' opacity='0.7'>${lines}</g><g fill='${accent}'>${nodes}</g>`
    }
    case 'cavern':
      return (
        `<g fill='${a}'>` +
        `<polygon points='0,220 40,150 84,220'/><polygon points='70,220 112,116 154,220'/>` +
        `<polygon points='150,220 200,158 252,220'/><polygon points='240,220 292,108 344,220'/>` +
        `<polygon points='330,220 368,150 400,210 400,220'/>` +
        `<polygon points='0,0 40,84 84,0'/><polygon points='120,0 162,104 206,0'/><polygon points='262,0 300,72 340,0'/></g>`
      )
    case 'ruins': {
      const cols = [[30, 96], [78, 150], [128, 70], [176, 132], [230, 60], [280, 148], [330, 100], [372, 140]]
      const pillars = cols.map(([x, h]) => `<rect x='${x}' y='${220 - h}' width='26' height='${h}'/>`).join('')
      const tops = cols.filter((_, i) => i % 2 === 0).map(([x, h]) => `<rect x='${x - 4}' y='${220 - h - 8}' width='34' height='8'/>`).join('')
      return `<g fill='${a}'>${pillars}${tops}<rect x='0' y='210' width='400' height='10'/></g>`
    }
    case 'orbs':
      return (
        `<defs><filter id='b${seed}'><feGaussianBlur stdDeviation='20'/></filter></defs>` +
        `<g filter='url(#b${seed})'>` +
        `<ellipse cx='90' cy='120' rx='120' ry='90' fill='${a}' opacity='0.55'/>` +
        `<ellipse cx='300' cy='90' rx='130' ry='95' fill='${b}' opacity='0.5'/>` +
        `<ellipse cx='210' cy='200' rx='150' ry='90' fill='${c}' opacity='0.5'/></g>`
      )
    case 'portal':
      return (
        `<g fill='none' stroke='${a}' stroke-width='7' opacity='0.85'><circle cx='200' cy='112' r='72'/></g>` +
        `<circle cx='200' cy='112' r='52' fill='none' stroke='${accent}' stroke-width='4' opacity='0.9'/>` +
        `<circle cx='200' cy='112' r='47' fill='#05030a'/>` +
        `<g stroke='${accent}' stroke-width='2' opacity='0.4'>` +
        [30, 70, 110, 150].map((a2) => {
          const r = (a2 * Math.PI) / 180
          const x1 = 200 + Math.cos(r) * 80
          const y1 = 112 + Math.sin(r) * 80
          const x2 = 200 + Math.cos(r) * 130
          const y2 = 112 + Math.sin(r) * 130
          return `<line x1='${x1.toFixed(0)}' y1='${y1.toFixed(0)}' x2='${x2.toFixed(0)}' y2='${y2.toFixed(0)}'/>`
        }).join('') +
        `</g><rect x='0' y='202' width='400' height='18' fill='${a}'/>`
      )
  }
}

// ---- The 16 scenes (one per current level; extra levels cycle through them) ----

export const SCENES: SceneSpec[] = [
  { id: 'volcano', sky: ['#1a0e12', '#3a1410', '#631c12'], motif: 'cavern', mc: ['#160a0a'], accent: '#ff7a3c', celestial: { color: '#ff5a1f', x: '50%', y: '56%', size: 130 }, particles: 'motes' },
  { id: 'forest', sky: ['#0b1a12', '#12261a', '#1b3a26'], motif: 'forest', mc: ['#0e2417', '#08160e'], accent: '#8ef0b0', celestial: { color: '#cfe9d6', x: '72%', y: '20%', size: 76 }, particles: 'motes' },
  { id: 'cavern', sky: ['#0a0f18', '#0f1526', '#141b30'], motif: 'cavern', mc: ['#0a1020'], accent: '#59c2ff', particles: 'stars' },
  { id: 'city', sky: ['#141026', '#2a1d44', '#5f3550'], motif: 'city', mc: ['#0e0b1c'], accent: '#ffcf6b', celestial: { color: '#ffb454', x: '22%', y: '42%', size: 104 }, particles: 'stars' },
  { id: 'ruins', sky: ['#12100a', '#241f14', '#463a24'], motif: 'ruins', mc: ['#100d08'], accent: '#e0b060', celestial: { color: '#e0a85a', x: '70%', y: '38%', size: 92 }, particles: 'motes' },
  { id: 'peaks', sky: ['#07101c', '#0c2036', '#123a52'], motif: 'mountains', mc: ['#0a1a2a', '#06121e'], accent: '#59c2ff', particles: 'stars' },
  { id: 'ocean', sky: ['#04121c', '#082436', '#0e3a4e'], motif: 'waves', mc: ['#0a2b3d', '#06202e', '#04161f'], accent: '#bfe6ff', celestial: { color: '#bfe6ff', x: '66%', y: '18%', size: 70 }, particles: 'stars' },
  { id: 'temple', sky: ['#0d1226', '#1e2450', '#3a3f7a'], motif: 'arches', mc: ['#0a0f22', '#0d1330'], accent: '#ffd98a', celestial: { color: '#ffd98a', x: '50%', y: '28%', size: 120 }, particles: 'stars' },
  { id: 'desert', sky: ['#1a1220', '#3a2338', '#8a4a4e'], motif: 'dunes', mc: ['#2a1a2e', '#1a0f1e'], accent: '#ff9e64', celestial: { color: '#ff9e64', x: '30%', y: '40%', size: 116 }, particles: 'none' },
  { id: 'crystal', sky: ['#0a0a1a', '#141030', '#211a4a'], motif: 'crystals', mc: ['#6b46c1', '#3a2470'], accent: '#c4b5fd', particles: 'stars' },
  { id: 'circuit', sky: ['#050a0e', '#08131a', '#0a1c22'], motif: 'circuit', mc: ['#0e6b5c'], accent: '#3ddc84', particles: 'motes' },
  { id: 'nebula', sky: ['#0a0a1a', '#160f30', '#2a123a'], motif: 'orbs', mc: ['#7c3aed', '#db2777', '#0ea5e9'], accent: '#ffffff', particles: 'stars' },
  { id: 'neoncity', sky: ['#0a0620', '#1a0a38', '#3a0e4a'], motif: 'city', mc: ['#120a24'], accent: '#ff6ac1', celestial: { color: '#59c2ff', x: '74%', y: '18%', size: 82 }, particles: 'stars' },
  { id: 'jungle', sky: ['#08140e', '#0e2216', '#153a22'], motif: 'forest', mc: ['#0c2016', '#061208'], accent: '#a5f0b8', particles: 'motes' },
  { id: 'glacier', sky: ['#0a1620', '#123040', '#1e4a5e'], motif: 'mountains', mc: ['#1a3f50', '#0e2836'], accent: '#dff3ff', celestial: { color: '#dff3ff', x: '40%', y: '34%', size: 92 }, particles: 'snow' },
  { id: 'gate', sky: ['#0a0620', '#140a30', '#241046'], motif: 'portal', mc: ['#b78cff'], accent: '#59c2ff', particles: 'stars' },
]

function starStyle(color: string): CSSProperties {
  const spots = ['24px 30px', '70px 76px', '130px 44px', '176px 120px', '48px 150px', '104px 186px', '196px 70px', '150px 24px']
  return {
    backgroundImage: spots.map((p) => `radial-gradient(1.4px 1.4px at ${p}, ${color}, transparent)`).join(','),
    backgroundRepeat: 'repeat',
    backgroundSize: '210px 210px',
  }
}

const MOTES = [
  { left: '14%', delay: '0s', dur: '4.2s' },
  { left: '32%', delay: '1.4s', dur: '5.0s' },
  { left: '52%', delay: '0.7s', dur: '3.6s' },
  { left: '70%', delay: '2.1s', dur: '4.6s' },
  { left: '86%', delay: '1.0s', dur: '5.4s' },
]
const SNOW = [
  { left: '10%', delay: '0s', dur: '6s' },
  { left: '28%', delay: '1.6s', dur: '7.2s' },
  { left: '46%', delay: '0.8s', dur: '6.6s' },
  { left: '64%', delay: '2.4s', dur: '7.8s' },
  { left: '82%', delay: '1.2s', dur: '6.2s' },
  { left: '92%', delay: '3s', dur: '8s' },
]

export function LevelScene({ index }: { index: number }) {
  const len = SCENES.length
  const spec = SCENES[((index % len) + len) % len] ?? SCENES[0]
  const sky = spec.sky
  const skyBg = `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 52%, ${sky[2]} 100%)`

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* sky */}
      <div className="absolute inset-0" style={{ background: skyBg }} />

      {/* stars */}
      {spec.particles === 'stars' && (
        <div className="vm-particle absolute inset-x-0 top-0 h-[62%]" style={{ ...starStyle('#ffffff'), opacity: 0.5, animation: 'vm-flicker 5s ease-in-out infinite' }} />
      )}

      {/* celestial body */}
      {spec.celestial && (
        <div
          className="absolute rounded-full"
          style={{
            left: spec.celestial.x,
            top: spec.celestial.y,
            width: spec.celestial.size,
            height: spec.celestial.size,
            transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, ${spec.celestial.color}, transparent 68%)`,
            boxShadow: `0 0 70px ${spec.celestial.color}55`,
            opacity: 0.85,
          }}
        />
      )}

      {/* the scene's signature motif */}
      <div
        className="absolute inset-x-0 bottom-0 h-[80%]"
        style={{
          backgroundImage: svgUrl(motifInner(spec.motif, spec.mc, spec.accent, index + 1)),
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
          backgroundPosition: 'bottom',
          opacity: 0.9,
        }}
      />

      {/* rising motes (embers / fireflies) */}
      {spec.particles === 'motes' &&
        MOTES.map((m, i) => (
          <span
            key={i}
            className="vm-particle absolute bottom-6 h-1.5 w-1.5 rounded-full"
            style={{ left: m.left, background: spec.accent, boxShadow: `0 0 6px ${spec.accent}`, animation: `vm-float ${m.dur} ease-in-out ${m.delay} infinite` }}
          />
        ))}

      {/* falling snow */}
      {spec.particles === 'snow' &&
        SNOW.map((m, i) => (
          <span
            key={i}
            className="vm-particle absolute top-0 h-1.5 w-1.5 rounded-full"
            style={{ left: m.left, background: '#eaf6ff', opacity: 0.85, animation: `vm-fall ${m.dur} linear ${m.delay} infinite` }}
          />
        ))}

      {/* scanlines + dark scrim to protect code legibility */}
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.10) 3px, rgba(0,0,0,0) 4px)' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(8,11,17,0.56)' }} />
    </div>
  )
}
