import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { toonMaterial, PALETTE } from '../toon'

/**
 * Level 1 — "First Blood": a low-poly volcanic night. The volcano anchors the
 * RIGHT margin (the open strip beside the editor); the editor glass sits over
 * calm dark ground so code contrast stays high. Lava surfaces use
 * emissiveIntensity > 1 so only they bloom.
 */

const ROCKS: Array<{ pos: [number, number, number]; scale: number }> = [
  { pos: [2.4, -2.1, -1.5], scale: 0.5 },
  { pos: [-6.8, -2.3, -3], scale: 0.8 },
  { pos: [-1.6, -2.2, 0.5], scale: 0.4 },
  { pos: [-9.2, -2.0, -6], scale: 1.1 },
]

export function Level1Scene({ accent }: { accent: string }) {
  const lavaLight = useRef<THREE.PointLight>(null)

  const mats = useMemo(
    () => ({
      ground: toonMaterial(PALETTE.groundDeep),
      cone: toonMaterial('#2b2333'),
      rim: toonMaterial('#3a2d40'),
      lava: toonMaterial('#ff7a3c', { emissive: '#ff5a1f', emissiveIntensity: 2.2 }),
      rock: toonMaterial(PALETTE.rock),
      crystal: toonMaterial(accent, { emissive: accent, emissiveIntensity: 1.5 }),
    }),
    [accent],
  )

  // Lava flicker — slow sine mix, no allocations.
  useFrame(({ clock }) => {
    if (lavaLight.current) {
      const t = clock.elapsedTime
      lavaLight.current.intensity = 6 + Math.sin(t * 2.1) * 1.2 + Math.sin(t * 5.7) * 0.5
    }
  })

  return (
    <group>
      {/* ground */}
      <mesh material={mats.ground} position={[0, -2.6, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[30, 24]} />
      </mesh>

      {/* the volcano — right margin, beside the editor */}
      <group position={[7.4, -2.6, -6.5]}>
        <mesh material={mats.cone}>
          <coneGeometry args={[3.6, 4.6, 9]} />
        </mesh>
        {/* crater rim + lava pool */}
        <mesh material={mats.rim} position={[0, 2.15, 0]}>
          <cylinderGeometry args={[1.15, 1.45, 0.5, 9]} />
        </mesh>
        <mesh material={mats.lava} position={[0, 2.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.05, 9]} />
        </mesh>
        <pointLight ref={lavaLight} position={[0, 3.2, 0]} color="#ff6a2a" intensity={6} distance={14} decay={2} />
        {/* rising embers */}
        <Sparkles count={40} scale={[3.5, 5, 3.5]} position={[0, 4, 0]} size={3.5} speed={0.5} color="#ffa04d" opacity={0.8} />
      </group>

      {/* scattered rocks on the plain */}
      {ROCKS.map((r, i) => (
        <mesh key={i} material={mats.rock} position={r.pos} scale={r.scale} rotation={[0.3 * i, 0.8 * i, 0]}>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}

      {/* one accent crystal floating far left — ties the theme color in */}
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh material={mats.crystal} position={[-8.2, 0.4, -7]} rotation={[0.2, 0.5, 0.15]}>
          <octahedronGeometry args={[0.7]} />
        </mesh>
      </Float>
    </group>
  )
}
