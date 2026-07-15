import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getGradientMap } from './toon'
import { useHeroRig } from './useHeroRig'
import { useStage, type HeroReaction } from './stageState'
import { heroLookFrom, type HeroCustom } from '../game/heroParts'
import { HeroExtras } from './HeroExtras'

/**
 * The 3D hero portrait — a small dedicated canvas (HeroPanel + Shop studio).
 * Non-interactive by contract: wrapper is pointer-events-none + aria-hidden.
 *
 * Model: "RobotExpressive" by Tomás Laulhé (CC0), meshopt-compressed to
 * public/models/hero.glb (~180KB). Its `Main`/`Grey`/`Black` materials take the
 * player's body/trim/visor colors — the Hero the player styles in the Shop.
 */
const HERO_URL = 'models/hero.glb'

function HeroModel({ reaction, hero, accent }: { reaction: HeroReaction; hero: HeroCustom; accent: string }) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(HERO_URL)
  const { actions, mixer } = useAnimations(animations, group)
  const look = heroLookFrom(hero)

  // Re-shade every mesh with the shared toon ramp so the hero matches the
  // cel-shaded world, tinting the three named zones with the player's colors.
  useMemo(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const convert = (m: THREE.Material): THREE.Material => {
        const src = m as THREE.MeshStandardMaterial
        let color = src.color?.clone() ?? new THREE.Color('#cfd6e4')
        if (src.name === 'Main') color = new THREE.Color(look.body)
        if (src.name === 'Grey') color = new THREE.Color(look.trim).lerp(new THREE.Color('#cfd6e4'), 0.35)
        if (src.name === 'Black') color = new THREE.Color(look.visor)
        const out = new THREE.MeshToonMaterial({
          color,
          map: src.map ?? null,
          transparent: src.transparent,
          opacity: src.opacity,
          gradientMap: getGradientMap(),
        })
        out.name = src.name
        return out
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material)
    })
    // Key on the color VALUES — the look object is rebuilt by every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, look.body, look.trim, look.visor])

  useHeroRig(actions as Record<string, THREE.AnimationAction | null>, mixer, reaction)

  // The model spans roughly y∈[0,1.85] in its own units; the group's scale/offset
  // below places its feet near the bottom of the portrait. HeroExtras positions
  // accessories/aura in these same model-local units.
  return (
    <group ref={group} position={[0, -1.28, 0]} scale={0.5}>
      <primitive object={scene} />
      <HeroExtras accessory={hero.accessory} aura={hero.aura} trim={look.trim} accent={accent} />
    </group>
  )
}

export default function Hero3D({ reaction, hero }: { reaction: HeroReaction; hero: HeroCustom }) {
  const wrapper = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [hidden, setHidden] = useState(document.hidden)
  const accent = useStage((s) => s.accent)

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
        <HeroModel reaction={reaction} hero={hero} accent={accent} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(HERO_URL)
