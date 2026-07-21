import { useMemo } from 'react'
import * as THREE from 'three'
import { getGradientMap } from './toon'
import type { Landmarks } from '../game/characters'

/**
 * The display pedestal shown under the hero in the interactive Shop preview — a
 * low toon disc with an emissive accent rim (which blooms). Sized in world units
 * via `k = 0.5 / scale` so it's consistent across models. (The old procedural
 * accessories + aura were removed — the characters carry their own detail.)
 */
export function HeroExtras({ accent, landmarks, scale }: { accent: string; landmarks: Landmarks; scale: number }) {
  const grad = useMemo(() => getGradientMap(), [])
  const k = 0.5 / scale
  return (
    <group position={[0, landmarks.feet, 0]}>
      <mesh position={[0, -0.05 * k, 0]}>
        <cylinderGeometry args={[1.05 * k, 1.2 * k, 0.08 * k, 56]} />
        <meshToonMaterial color="#161b28" gradientMap={grad} />
      </mesh>
      <mesh position={[0, -0.008 * k, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.06 * k, 0.022 * k, 10, 72]} />
        <meshBasicMaterial color={accent} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
