import { createContext, useContext, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type Register = (el: HTMLElement, depth: number) => () => void
const ParallaxCtx = createContext<Register | null>(null)

/**
 * A pointer-driven parallax container. Layers register themselves and are translated
 * (and slightly overscanned) proportional to their `depth`. All updates happen in a
 * single rAF loop writing transforms directly to the DOM — no React re-renders.
 * Respects prefers-reduced-motion (auto-drifts gently instead of following the pointer).
 */
export function ParallaxScene({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const layers = useRef<{ el: HTMLElement; depth: number }[]>([])
  const target = useRef({ x: 0, y: 0 })
  const cur = useRef({ x: 0, y: 0 })

  const register: Register = (el, depth) => {
    const entry = { el, depth }
    layers.current.push(entry)
    return () => {
      layers.current = layers.current.filter((e) => e !== entry)
    }
  }

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (!reduce) window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    let t = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      t += 0.006
      if (reduce) {
        // gentle autonomous drift
        target.current.x = Math.sin(t) * 0.4
        target.current.y = Math.cos(t * 0.8) * 0.3
      }
      cur.current.x += (target.current.x - cur.current.x) * 0.06
      cur.current.y += (target.current.y - cur.current.y) * 0.06
      for (const { el, depth } of layers.current) {
        const dx = (-cur.current.x * depth * 42).toFixed(2)
        const dy = (-cur.current.y * depth * 42).toFixed(2)
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.08)`
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div className={className} style={style}>
      <ParallaxCtx.Provider value={register}>{children}</ParallaxCtx.Provider>
    </div>
  )
}

/** A single parallax layer. `depth` 0 = static, ~1 = strong movement. */
export function ParallaxLayer({
  depth = 1,
  className = '',
  style,
  children,
}: {
  depth?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const register = useContext(ParallaxCtx)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (register && ref.current) return register(ref.current, depth)
  }, [register, depth])
  return (
    <div ref={ref} className={`absolute inset-0 ${className}`} style={{ willChange: 'transform', ...style }}>
      {children}
    </div>
  )
}
