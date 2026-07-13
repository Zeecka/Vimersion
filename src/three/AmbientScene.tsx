import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { toonMaterial, PALETTE } from './toon'
import type { StageScreen } from './stageState'

/**
 * Generic toon backdrop: floating low-poly islands drifting in a night sky.
 * Used behind every screen that has no dedicated 3D scene. Deliberately cheap:
 * a handful of primitives, no shadow maps, one slow group rotation.
 */

interface IslandSpec {
  pos: [number, number, number]
  scale: number
  top: 'tree' | 'crystal' | 'lantern'
}

// Framing: islands hug the left/right edges and the deep background so the
// center of the viewport — where UI panels and the editor sit — stays calm sky.
const ISLANDS: IslandSpec[] = [
  { pos: [-6.2, 0.2, -3], scale: 1.25, top: 'tree' },
  { pos: [6.4, -0.6, -2.5], scale: 1.4, top: 'crystal' },
  { pos: [5.6, 2.6, -7], scale: 0.8, top: 'tree' },
  { pos: [-4.6, 3.0, -8], scale: 0.7, top: 'lantern' },
  { pos: [0.4, -4.2, -9], scale: 1.0, top: 'tree' },
  { pos: [-8.5, -2.2, -6], scale: 0.9, top: 'crystal' },
]

function Island({ spec, accent }: { spec: IslandSpec; accent: string }) {
  const mats = useMemo(
    () => ({
      grass: toonMaterial(PALETTE.foliage),
      earth: toonMaterial(PALETTE.rock),
      trunk: toonMaterial(PALETTE.trunk),
      leaves: toonMaterial(PALETTE.foliageDark),
      // Emissive >1 so the selective Bloom pass picks these up.
      crystal: toonMaterial(accent, { emissive: accent, emissiveIntensity: 1.6 }),
      lantern: toonMaterial(PALETTE.lantern, { emissive: PALETTE.lantern, emissiveIntensity: 1.8 }),
    }),
    [accent],
  )

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.7}>
      <group position={spec.pos} scale={spec.scale}>
        {/* island: grass disc + inverted earth cone */}
        <mesh material={mats.grass} position={[0, 0, 0]}>
          <cylinderGeometry args={[1.15, 1.0, 0.35, 7]} />
        </mesh>
        <mesh material={mats.earth} position={[0, -0.85, 0]}>
          <coneGeometry args={[1.0, 1.4, 7]} />
        </mesh>

        {spec.top === 'tree' && (
          <group position={[0.25, 0.18, 0]}>
            <mesh material={mats.trunk} position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
            </mesh>
            <mesh material={mats.leaves} position={[0, 1.0, 0]}>
              <coneGeometry args={[0.55, 1.1, 7]} />
            </mesh>
            <mesh material={mats.leaves} position={[0, 1.45, 0]}>
              <coneGeometry args={[0.38, 0.8, 7]} />
            </mesh>
          </group>
        )}
        {spec.top === 'crystal' && (
          <mesh material={mats.crystal} position={[0, 0.65, 0]} rotation={[0.15, 0.4, 0.1]}>
            <octahedronGeometry args={[0.5]} />
          </mesh>
        )}
        {spec.top === 'lantern' && (
          <mesh material={mats.lantern} position={[0, 0.45, 0]}>
            <sphereGeometry args={[0.22, 10, 8]} />
          </mesh>
        )}
      </group>
    </Float>
  )
}

export function AmbientScene({ accent, screen }: { accent: string; screen: StageScreen }) {
  const group = useRef<THREE.Group>(null)

  // Slow drift; delta clamped so a background-tab resume doesn't jump.
  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05)
    if (group.current) group.current.rotation.y += d * 0.02
  })

  // Home gets the full vista; other screens pull the camera subject lower so
  // the UI panels sit over calm sky rather than busy geometry.
  const y = screen === 'home' ? 0 : -1.1

  return (
    <group position={[0, y, 0]}>
      <group ref={group}>
        {ISLANDS.map((spec, i) => (
          <Island key={i} spec={spec} accent={accent} />
        ))}
      </group>
      <Stars radius={60} depth={30} count={1200} factor={3} saturation={0} fade speed={0.6} />
    </group>
  )
}
