import { useEffect, useRef, type CSSProperties } from 'react'
import { ParallaxScene, ParallaxLayer } from './Parallax'

/** Full-screen animated background layer, selected by the equipped cosmetic. */
export function Background({ bg, accent }: { bg: string; accent: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {bg === 'platform' && <PlatformerBg />}
      {bg === 'crt' && <CrtBg />}
      {bg === 'aurora' && <AuroraBg />}
      {bg === 'synthwave' && <SynthwaveBg />}
      {bg === 'nebula' && <NebulaBg />}
      {bg === 'cyber' && <CyberBg />}
      {bg === 'starfield' && <StarfieldBg accent={accent} />}
      {bg === 'matrix' && <MatrixBg accent={accent} />}
    </div>
  )
}

/** Tiled star field via layered radial-gradients (cheap, no canvas). */
function starLayer(color = '#ffffff', opacity = 0.9, tile = 200): CSSProperties {
  const spots = ['20px 30px', '60px 80px', '120px 40px', '170px 120px', '44px 160px', '100px 190px', '190px 70px', '140px 22px', '80px 130px', '12px 100px']
  return {
    backgroundImage: spots.map((p) => `radial-gradient(1.5px 1.5px at ${p}, ${color}, transparent)`).join(','),
    backgroundRepeat: 'repeat',
    backgroundSize: `${tile}px ${tile}px`,
    opacity,
  }
}

function blob(color: string, s: CSSProperties): CSSProperties {
  return {
    position: 'absolute',
    width: '52vw',
    height: '52vw',
    borderRadius: '9999px',
    filter: 'blur(90px)',
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
    animation: 'vm-aurora-drift 20s ease-in-out infinite',
    ...s,
  }
}

/**
 * Default free background: a parallax "terminal nebula". Theme-tinted so it recolors with
 * the equipped theme. Everyone sees parallax + depth on first load (no purchase needed).
 */
function CrtBg() {
  return (
    <ParallaxScene
      className="absolute inset-0"
      style={{ background: 'radial-gradient(ellipse at 50% -15%, color-mix(in srgb, var(--color-term) 16%, #0a0e14), #070a11 62%)' }}
    >
      {/* far, slow stars */}
      <ParallaxLayer depth={0.15} style={starLayer('color-mix(in srgb, var(--color-term) 55%, white)', 0.4, 260)} />
      {/* near, brighter stars */}
      <ParallaxLayer depth={0.42} style={starLayer('#ffffff', 0.55, 150)} />
      {/* drifting accent glow orbs */}
      <ParallaxLayer depth={0.7}>
        <div style={blob('color-mix(in srgb, var(--color-term) 80%, transparent)', { top: '-14%', left: '-8%' })} />
        <div style={blob('rgba(89,194,255,0.45)', { bottom: '-18%', right: '-10%', animationDelay: '-8s', width: '44vw', height: '44vw' })} />
      </ParallaxLayer>
      {/* subtle theme-tinted perspective grid floor */}
      <ParallaxLayer depth={0.9}>
        <div className="absolute inset-x-0 bottom-0 h-[36%] [perspective:320px]">
          <div
            className="absolute inset-0 origin-bottom [transform:rotateX(75deg)]"
            style={{
              backgroundImage:
                'linear-gradient(color-mix(in srgb, var(--color-term) 65%, transparent) 2px, transparent 2px), linear-gradient(90deg, color-mix(in srgb, var(--color-term) 65%, transparent) 2px, transparent 2px)',
              backgroundSize: '48px 48px',
              opacity: 0.16,
              animation: 'vm-grid-scroll 2.6s linear infinite',
            }}
          />
        </div>
      </ParallaxLayer>
      {/* fixed scanlines on top (not a parallax layer, so it stays put) */}
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0) 4px)' }} />
    </ParallaxScene>
  )
}

function AuroraBg() {
  return (
    <ParallaxScene className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #060a16 0%, #0a0e14 100%)' }}>
      <ParallaxLayer depth={0.15} style={starLayer('#cbd5e1', 0.5, 220)} />
      <ParallaxLayer depth={0.45}>
        <div style={blob('#3ddc84', { top: '-12%', left: '-8%' })} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.7}>
        <div style={blob('#59c2ff', { top: '8%', right: '-14%', animationDelay: '-6s' })} />
      </ParallaxLayer>
      <ParallaxLayer depth={1}>
        <div style={blob('#b78cff', { bottom: '-18%', left: '18%', animationDelay: '-12s' })} />
        <div style={blob('#ff6ac1', { bottom: '-24%', right: '10%', animationDelay: '-9s', width: '38vw', height: '38vw' })} />
      </ParallaxLayer>
    </ParallaxScene>
  )
}

function SynthwaveBg() {
  return (
    <ParallaxScene
      className="absolute inset-0"
      style={{ background: 'linear-gradient(180deg, #180b2e 0%, #2d1b4e 34%, #6b2d5c 60%, #c94b7b 80%, #ff9e64 100%)' }}
    >
      <ParallaxLayer depth={0.1} style={starLayer('#ffd9f0', 0.7, 190)} />
      {/* sun */}
      <ParallaxLayer depth={0.28}>
        <div
          className="absolute left-1/2 top-[26%] h-56 w-56 -translate-x-1/2 rounded-full"
          style={{ background: 'linear-gradient(180deg, #ffe66d, #ff6ac1 55%, #a83279 100%)', filter: 'blur(0.5px)', boxShadow: '0 0 90px rgba(255,120,180,0.55)' }}
        />
        <div
          className="absolute left-1/2 top-[26%] h-56 w-56 -translate-x-1/2 rounded-full"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 12px, #2d1b4e 12px 16px)', maskImage: 'linear-gradient(180deg, transparent 55%, #000 55%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 55%, #000 55%)' }}
        />
      </ParallaxLayer>
      {/* mountains */}
      <ParallaxLayer depth={0.5}>
        <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[38%] h-[26%] w-full">
          <polygon points="0,300 150,120 300,210 470,70 640,200 820,100 1010,230 1200,130 1200,300" fill="#3a1150" />
        </svg>
      </ParallaxLayer>
      {/* neon grid floor */}
      <ParallaxLayer depth={0.85}>
        <div className="absolute inset-x-0 bottom-0 h-[42%] [perspective:300px]">
          <div
            className="absolute inset-0 origin-bottom [transform:rotateX(74deg)]"
            style={{
              backgroundImage: 'linear-gradient(#ff6ac1 2px, transparent 2px), linear-gradient(90deg, #59c2ff 2px, transparent 2px)',
              backgroundSize: '46px 46px',
              opacity: 0.45,
              animation: 'vm-grid-scroll 1.5s linear infinite',
            }}
          />
        </div>
      </ParallaxLayer>
    </ParallaxScene>
  )
}

function NebulaBg() {
  return (
    <ParallaxScene className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 28% 18%, #1e1b4b 0%, #0a0e14 68%)' }}>
      <ParallaxLayer depth={0.18} style={starLayer('#c7d0d9', 0.55, 240)} />
      <ParallaxLayer depth={0.5}>
        <div style={blob('#7c3aed', { top: '-6%', left: '6%' })} />
        <div style={blob('#0ea5e9', { top: '24%', right: '-8%', animationDelay: '-7s' })} />
        <div style={blob('#db2777', { bottom: '-14%', left: '28%', animationDelay: '-13s', width: '44vw', height: '44vw' })} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.95} style={{ ...starLayer('#ffffff', 0.9, 150), animation: 'vm-flicker 4s ease-in-out infinite' }} />
    </ParallaxScene>
  )
}

function CyberBg() {
  const windows = (cols: number, color: string) =>
    Array.from({ length: cols }, (_, i) => (
      <rect key={i} x={8 + (i % 6) * 5} y={20 + (i % 4) * 14} width="3" height="3" fill={color} opacity={0.8} />
    ))
  return (
    <ParallaxScene className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0e14 0%, #101a2e 52%, #2a0e3a 100%)' }}>
      <ParallaxLayer depth={0.12} style={starLayer('#9fb3c8', 0.5, 210)} />
      {/* moon glow */}
      <ParallaxLayer depth={0.25}>
        <div className="absolute right-[18%] top-[14%] h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(89,194,255,0.5), transparent 65%)' }} />
      </ParallaxLayer>
      {/* far skyline */}
      <ParallaxLayer depth={0.45}>
        <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[30%] h-[36%] w-full opacity-70">
          <g fill="#241640">
            <rect x="10" y="70" width="34" height="130" />
            <rect x="60" y="40" width="28" height="160" />
            <rect x="110" y="90" width="40" height="110" />
            <rect x="170" y="55" width="26" height="145" />
            <rect x="215" y="80" width="36" height="120" />
            <rect x="270" y="35" width="30" height="165" />
            <rect x="320" y="75" width="38" height="125" />
          </g>
        </svg>
      </ParallaxLayer>
      {/* near skyline with neon windows */}
      <ParallaxLayer depth={0.85}>
        <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[46%] w-full">
          <g fill="#120a24">
            <rect x="0" y="60" width="60" height="140" />
            <rect x="72" y="30" width="46" height="170" />
            <rect x="130" y="80" width="58" height="120" />
            <rect x="200" y="45" width="44" height="155" />
            <rect x="258" y="70" width="60" height="130" />
            <rect x="330" y="40" width="52" height="160" />
          </g>
          <g>{windows(24, '#ff6ac1')}</g>
          <g transform="translate(200,0)">{windows(24, '#59c2ff')}</g>
        </svg>
      </ParallaxLayer>
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.10) 4px)' }} />
    </ParallaxScene>
  )
}

/* ---- Side-scrolling platformer (Pixel Kingdom) ---- */

/** Encode an inline SVG string as a CSS url() data URI (offline, no assets). */
function svgUrl(s: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(s)}")`
}

const TILE = {
  clouds: `<svg xmlns='http://www.w3.org/2000/svg' width='340' height='130'><g fill='#e9f2ff' opacity='0.92'><ellipse cx='78' cy='86' rx='50' ry='24'/><ellipse cx='118' cy='66' rx='40' ry='30'/><ellipse cx='160' cy='84' rx='48' ry='24'/><rect x='34' y='80' width='150' height='28' rx='14'/></g></svg>`,
  mountains: `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='210'><polygon fill='#2a1f4e' points='0,210 90,70 175,140 255,52 350,132 440,70 520,140 520,210'/><polygon fill='#372a63' opacity='0.7' points='0,210 70,150 150,185 240,120 330,180 420,128 520,182 520,210'/></svg>`,
  hills: `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='170'><g fill='#1f6b3f'><ellipse cx='105' cy='215' rx='135' ry='100'/><ellipse cx='300' cy='225' rx='150' ry='110'/></g><g fill='#2c8a54'><ellipse cx='176' cy='154' rx='26' ry='18'/><ellipse cx='205' cy='150' rx='36' ry='24'/><ellipse cx='238' cy='152' rx='30' ry='20'/></g></svg>`,
  props: `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='120'><g><rect x='44' y='40' width='46' height='46' rx='5' fill='#f0b429' stroke='#7a4a12' stroke-width='4'/><text x='67' y='74' font-family='monospace' font-size='34' font-weight='bold' text-anchor='middle' fill='#7a4a12'>?</text></g><g><ellipse cx='232' cy='48' rx='15' ry='18' fill='#ffd23f' stroke='#b8860b' stroke-width='3'/><rect x='229' y='40' width='6' height='16' fill='#b8860b'/></g></svg>`,
  ground: `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='60'><rect width='64' height='60' fill='#6b431f'/><rect width='64' height='16' fill='#2f8a4f'/><rect y='16' width='64' height='3' fill='#256b41'/><path d='M32 19 V60 M0 40 H64' stroke='#4a2e14' stroke-width='2'/><rect x='1' y='1' width='62' height='58' fill='none' stroke='#3a2512' stroke-width='2'/></svg>`,
}

/** One horizontally-scrolling parallax band. `shift` must equal the tile width. */
function ScrollBand({
  tile,
  sizeW,
  height,
  bottom,
  top,
  dur,
  extraAnim = '',
}: {
  tile: string
  sizeW: number
  height: number
  bottom?: number | string
  top?: number | string
  dur: number
  extraAnim?: string
}) {
  return (
    <div
      className="vm-scroll absolute inset-x-0"
      style={{
        top,
        bottom,
        height,
        backgroundImage: svgUrl(tile),
        backgroundRepeat: 'repeat-x',
        backgroundSize: `${sizeW}px ${height}px`,
        backgroundPositionY: 'bottom',
        animation: `vm-scroll-x ${dur}s linear infinite${extraAnim ? `, ${extraAnim}` : ''}`,
        ['--vm-shift' as string]: `-${sizeW}px`,
      }}
    />
  )
}

/**
 * Super-Mario-style side-scroller: several layers tiled across the screen, each
 * scrolling at its own speed (far = slow, near = fast) to fake depth. Pure CSS,
 * seamless loop, respects prefers-reduced-motion.
 */
function PlatformerBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* dusk sky */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0b1026 0%, #241a4e 42%, #5a2f6e 62%, #c05a7d 80%, #ff9e64 100%)' }} />
      {/* distant stars in the dark upper sky */}
      <div className="absolute inset-x-0 top-0 h-[46%]" style={starLayer('#ffffff', 0.5, 200)} />
      {/* sun near the horizon, behind everything */}
      <div
        className="absolute left-[18%] top-[40%] h-32 w-32 rounded-full"
        style={{ background: 'radial-gradient(circle, #ffe66d, #ff9e64 62%, rgba(255,158,100,0) 72%)', filter: 'blur(0.5px)', boxShadow: '0 0 80px rgba(255,190,120,0.5)' }}
      />
      {/* parallax bands: far → near, slow → fast */}
      <ScrollBand tile={TILE.clouds} sizeW={340} height={130} top="12%" dur={80} />
      <ScrollBand tile={TILE.mountains} sizeW={520} height={210} bottom={44} dur={58} />
      <ScrollBand tile={TILE.hills} sizeW={400} height={170} bottom={40} dur={40} />
      <ScrollBand tile={TILE.props} sizeW={320} height={120} bottom={150} dur={24} extraAnim="vm-bob-y 3.2s ease-in-out infinite" />
      <ScrollBand tile={TILE.ground} sizeW={64} height={60} bottom={0} dur={4} />
      {/* top-down scrim keeps overlaid UI text readable */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,10,22,0.55) 0%, rgba(8,10,22,0.16) 26%, rgba(8,10,22,0) 46%)' }} />
    </div>
  )
}

/**
 * A dim, themed "console" scene meant to sit *behind* the code editor. Deliberately
 * low-contrast with a dark scrim so the code stays perfectly legible while the panel
 * reads as a game screen rather than a plain text box.
 */
export function EditorScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--color-term) 10%, #0b1018), #080b11 70%)' }} />
      {/* faint dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(color-mix(in srgb, var(--color-term) 22%, transparent) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          opacity: 0.16,
        }}
      />
      {/* corner glow orbs */}
      <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-term) 45%, transparent), transparent 70%)', filter: 'blur(30px)', opacity: 0.5 }} />
      <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(89,194,255,0.4), transparent 70%)', filter: 'blur(34px)', opacity: 0.45 }} />
      {/* horizon grid at the bottom for depth */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 [perspective:260px]">
        <div
          className="absolute inset-0 origin-bottom [transform:rotateX(76deg)]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--color-term) 60%, transparent) 1.5px, transparent 1.5px), linear-gradient(90deg, color-mix(in srgb, var(--color-term) 60%, transparent) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
            opacity: 0.1,
            animation: 'vm-grid-scroll 3s linear infinite',
          }}
        />
      </div>
      {/* scanlines + dark scrim to protect legibility */}
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.10) 3px, rgba(0,0,0,0) 4px)' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(8,11,17,0.55)' }} />
    </div>
  )
}

/* ---- Canvas scenes ---- */

function useCanvasScene(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    let raf = 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      drawRef.current(ctx, w, h, t)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return ref
}

function MatrixBg({ accent }: { accent: string }) {
  const accentRef = useRef(accent)
  accentRef.current = accent
  const dropsRef = useRef<number[]>([])
  const lastRef = useRef(0)
  const CHARS = 'アイウエオカキクケコ01<>[]{}()=;:.λΣΦδ'
  const FS = 14
  const ref = useCanvasScene((ctx, w, h, t) => {
    if (t - lastRef.current < 55) return
    lastRef.current = t
    const cols = Math.ceil(w / FS)
    if (dropsRef.current.length !== cols) dropsRef.current = Array.from({ length: cols }, () => Math.floor((Math.random() * h) / FS))
    ctx.fillStyle = 'rgba(10,14,20,0.16)'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = accentRef.current
    ctx.font = `${FS}px 'JetBrains Mono', monospace`
    const drops = dropsRef.current
    for (let i = 0; i < cols; i++) {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)]
      const y = drops[i] * FS
      ctx.fillText(ch, i * FS, y)
      if (y > h && Math.random() > 0.975) drops[i] = 0
      drops[i]++
    }
  })
  return <canvas ref={ref} className="absolute inset-0" />
}

function StarfieldBg({ accent }: { accent: string }) {
  const accentRef = useRef(accent)
  accentRef.current = accent
  const starsRef = useRef<{ x: number; y: number; z: number }[]>([])
  const ref = useCanvasScene((ctx, w, h) => {
    const cx = w / 2
    const cy = h / 2
    if (starsRef.current.length === 0) starsRef.current = Array.from({ length: 260 }, () => ({ x: (Math.random() - 0.5) * w, y: (Math.random() - 0.5) * h, z: Math.random() * w }))
    ctx.fillStyle = 'rgba(10,14,20,0.35)'
    ctx.fillRect(0, 0, w, h)
    const stars = starsRef.current
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i]
      s.z -= 4
      if (s.z < 1) {
        s.x = (Math.random() - 0.5) * w
        s.y = (Math.random() - 0.5) * h
        s.z = w
      }
      const k = 128 / s.z
      const sx = cx + s.x * k
      const sy = cy + s.y * k
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue
      const size = (1 - s.z / w) * 2.6
      ctx.fillStyle = i % 6 === 0 ? accentRef.current : 'rgba(199,208,217,0.9)'
      ctx.fillRect(sx, sy, size, size)
    }
  })
  return <canvas ref={ref} className="absolute inset-0" />
}
