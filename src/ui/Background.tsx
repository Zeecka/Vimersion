import { useEffect, useRef } from 'react'

/** Full-screen animated background layer, selected by the equipped cosmetic. */
export function Background({ bg, accent }: { bg: string; accent: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {bg === 'crt' && <CrtBg />}
      {bg === 'aurora' && <AuroraBg accent={accent} />}
      {bg === 'synthwave' && <SynthwaveBg accent={accent} />}
      {bg === 'starfield' && <StarfieldBg accent={accent} />}
      {bg === 'matrix' && <MatrixBg accent={accent} />}
    </div>
  )
}

function CrtBg() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--color-term) 9%, transparent), transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0) 4px)',
        }}
      />
    </>
  )
}

function AuroraBg({ accent }: { accent: string }) {
  const blob = (color: string, style: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: '55vw',
    height: '55vw',
    borderRadius: '9999px',
    filter: 'blur(90px)',
    opacity: 0.28,
    background: `radial-gradient(circle, ${color}, transparent 70%)`,
    animation: 'vm-aurora-drift 18s ease-in-out infinite',
    ...style,
  })
  return (
    <>
      <div style={blob(accent, { top: '-15%', left: '-10%' })} />
      <div style={blob('#59c2ff', { top: '10%', right: '-15%', animationDelay: '-6s' })} />
      <div style={blob('#b78cff', { bottom: '-20%', left: '20%', animationDelay: '-12s' })} />
    </>
  )
}

function SynthwaveBg({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0a0e14 0%, #1a1030 45%, #3a1547 100%)' }}
      />
      {/* sun */}
      <div
        className="absolute left-1/2 top-[22%] h-40 w-40 -translate-x-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accent}, #ff6ac1 60%, transparent 72%)`,
          opacity: 0.5,
          filter: 'blur(2px)',
        }}
      />
      {/* receding grid */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] [perspective:280px]">
        <div
          className="absolute inset-0 origin-bottom [transform:rotateX(70deg)]"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.35,
            animation: 'vm-grid-scroll 1.6s linear infinite',
          }}
        />
      </div>
    </>
  )
}

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
    if (dropsRef.current.length !== cols) {
      dropsRef.current = Array.from({ length: cols }, () => Math.floor((Math.random() * h) / FS))
    }
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
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 240 }, () => ({
        x: (Math.random() - 0.5) * w,
        y: (Math.random() - 0.5) * h,
        z: Math.random() * w,
      }))
    }
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
      const size = (1 - s.z / w) * 2.4
      ctx.fillStyle = i % 7 === 0 ? accentRef.current : 'rgba(199,208,217,0.9)'
      ctx.fillRect(sx, sy, size, size)
    }
  })
  return <canvas ref={ref} className="absolute inset-0" />
}
