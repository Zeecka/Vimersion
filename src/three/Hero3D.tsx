import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getGradientMap } from './toon'
import { useHeroRig } from './useHeroRig'
import type { HeroReaction } from './stageState'

/**
 * The 3D hero portrait — a small dedicated canvas inside HeroPanel.
 * (A drei <View> into the main underlay canvas won't work here: that canvas
 * paints BELOW the opaque panel surfaces.) Non-interactive by contract:
 * wrapper is pointer-events-none + aria-hidden, so editor focus is safe.
 *
 * Model: "RobotExpressive" by Tomás Laulhé (CC0), from the three.js examples,
 * meshopt-compressed to public/models/hero.glb (~180KB).
 */
const HERO_URL = 'models/hero.glb'

function HeroModel({ reaction }: { reaction: HeroReaction }) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(HERO_URL)
  const { actions, mixer } = useAnimations(animations, group)

  // Re-shade every mesh with the shared toon ramp so the hero matches the
  // cel-shaded world (keeps the original palette via material.color).
  useMemo(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const convert = (m: THREE.Material): THREE.Material => {
        const src = m as THREE.MeshStandardMaterial
        return new THREE.MeshToonMaterial({
          color: src.color?.clone() ?? new THREE.Color('#cfd6e4'),
          map: src.map ?? null,
          transparent: src.transparent,
          opacity: src.opacity,
          gradientMap: getGradientMap(),
        })
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material)
    })
  }, [scene])

  useHeroRig(actions as Record<string, THREE.AnimationAction | null>, mixer, reaction)

  return <primitive ref={group} object={scene} position={[0, -1.28, 0]} scale={0.5} />
}

export default function Hero3D({ reaction }: { reaction: HeroReaction }) {
  const wrapper = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [hidden, setHidden] = useState(document.hidden)

  // Pause rendering when the portrait is off-screen or the tab is hidden.
  useEffect(() => {
    const el = wrapper.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    io.observe(el)
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <div ref={wrapper} aria-hidden className="pointer-events-none h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible && !hidden ? 'always' : 'never'}
        camera={{ position: [0, 0.25, 4.0], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
        }}
      >
        <hemisphereLight args={['#8a9bd4', '#141a2a', 1.1]} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <HeroModel reaction={reaction} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(HERO_URL)
