import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useStage, setStage } from './stageState'
import { AmbientScene } from './AmbientScene'
import { BACKDROPS } from './backdrops'
import { SCENES_3D } from './sceneRegistry'

/**
 * The persistent full-viewport WebGL underlay (webgl quality tier only).
 *
 * Contract (mirrors the lite <Background/> it replaces):
 * - Mounted as a SIBLING of the routed content, outside <motion.main> —
 *   `fixed` would break inside its animated transform stacking context.
 * - `pointer-events-none` + aria-hidden: can never steal clicks or focus.
 * - Never sits above z-0; the editor and HUD always paint over it.
 * - Fades in only after its first rendered frame (stageState.ready) — the
 *   lite Background stays mounted underneath until then, so no blank flash.
 */

/** Flips stageState.ready after the first real frame. */
function ReadySignal() {
  const sent = useRef(false)
  useFrame(() => {
    if (!sent.current) {
      sent.current = true
      setStage({ ready: true })
    }
  })
  return null
}

export default function Stage3D() {
  const accent = useStage((s) => s.accent)
  const screen = useStage((s) => s.screen)
  const sceneIndex = useStage((s) => s.sceneIndex)
  const bgId = useStage((s) => s.bgId)
  const ready = useStage((s) => s.ready)
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')
  // Perf ladder: 0 = full (dpr 1.75 + bloom), 1 = mid (1.25), 2 = low (1, no bloom).
  const [perfStep, setPerfStep] = useState(0)

  // A level with a dedicated 3D scene replaces the ambient backdrop.
  const LevelScene3D = screen === 'play' && sceneIndex !== null ? SCENES_3D[sceneIndex] : undefined
  // The equipped background cosmetic picks the WebGL backdrop shader; an
  // unknown id falls back to the floating-islands AmbientScene.
  const Backdrop = BACKDROPS[bgId]

  // Stop the render loop entirely while the tab is hidden.
  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      setStage({ ready: false })
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <Canvas
        dpr={[1.75, 1.25, 1][perfStep]}
        frameloop={frameloop}
        camera={{ position: [0, 2.0, 9], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // Flat stylized palette: exact hex values, no filmic tone curve.
          gl.toneMapping = THREE.NoToneMapping
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            // Don't let the browser try to restore mid-game — flip to the lite
            // tier for the rest of the session (App unmounts this canvas).
            e.preventDefault()
            setStage({ contextLost: true, ready: false })
          })
        }}
      >
        <ReadySignal />
        {/* Steps dpr 1.75 → 1.25 → 1 under sustained low fps (and back up);
            repeated flip-flopping locks in the lowest step. */}
        <PerformanceMonitor
          flipflops={4}
          onDecline={() => setPerfStep((s) => Math.min(2, s + 1))}
          onIncline={() => setPerfStep((s) => Math.max(0, s - 1))}
          onFallback={() => setPerfStep(2)}
        />
        <color attach="background" args={['#0b0d14']} />
        <fog attach="fog" args={['#0b0d14', 14, 34]} />
        {/* No shadow maps — toon look reads flat + cheap on iGPUs. */}
        <hemisphereLight args={['#8a9bd4', '#141a2a', 0.9]} />
        <directionalLight position={[4, 6, 3]} intensity={1.15} />
        <Suspense fallback={null}>
          {LevelScene3D ? (
            <LevelScene3D accent={accent} />
          ) : Backdrop ? (
            <Backdrop accent={accent} />
          ) : (
            <AmbientScene accent={accent} screen={screen} />
          )}
        </Suspense>
        {perfStep < 2 && (
          <EffectComposer multisampling={0}>
            {/* luminanceThreshold=1 → only emissiveIntensity>1 surfaces bloom. */}
            <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
