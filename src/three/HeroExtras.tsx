import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getGradientMap } from './toon'
import type { AccessoryId, HeroAura } from '../game/heroParts'

/**
 * Procedural extras layered onto the 3D Hero — an accessory (on the head) and a
 * custom aura (glow ring + orbiting sparks). Built from primitives in the hero's
 * MODEL-LOCAL units (the parent group applies the 0.5 scale / y-offset). Measured
 * landmarks (scripts): feet≈0, torso≈2.0, head-bone≈2.97, head-top≈3.3, total≈3.7.
 */

// Model-local reference points (measured from hero.glb; tune here if it changes).
const HEAD_TOP = 3.3
const HEAD_C = 2.97
const HEAD_R = 0.36

export function HeroExtras({
  accessory,
  aura,
  trim,
  accent,
}: {
  accessory: AccessoryId
  aura: HeroAura
  trim: string
  accent: string
}) {
  const grad = useMemo(() => getGradientMap(), [])
  const auraColor = aura.color ?? accent

  return (
    <group>
      <Accessory id={accessory} trim={trim} accent={accent} grad={grad} />
      <Aura color={auraColor} style={aura.style} intensity={aura.intensity} grad={grad} />
    </group>
  )
}

function Accessory({ id, trim, accent, grad }: { id: AccessoryId; trim: string; accent: string; grad: THREE.Texture }) {
  const toon = (c: string, emissive = false) => (
    <meshToonMaterial color={c} gradientMap={grad} emissive={emissive ? c : '#000'} emissiveIntensity={emissive ? 0.8 : 0} />
  )
  switch (id) {
    case 'antenna':
      return (
        <group position={[0, HEAD_TOP, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
            {toon(trim)}
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            {toon(accent, true)}
          </mesh>
        </group>
      )
    case 'halo':
      return (
        <mesh position={[0, HEAD_TOP + 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.045, 12, 32]} />
          <meshBasicMaterial color={accent} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )
    case 'tophat':
      return (
        <group position={[0, HEAD_TOP - 0.02, 0]}>
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.46, 0.46, 0.05, 24]} />
            {toon(trim)}
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.44, 24]} />
            {toon(trim)}
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.305, 0.305, 0.08, 24]} />
            {toon(accent, true)}
          </mesh>
        </group>
      )
    case 'headphones':
      return (
        <group position={[0, HEAD_C, 0]}>
          {/* band arcing over the top of the head */}
          <mesh position={[0, HEAD_TOP - HEAD_C, 0]}>
            <torusGeometry args={[HEAD_R + 0.04, 0.05, 10, 24, Math.PI]} />
            {toon(trim)}
          </mesh>
          <mesh position={[HEAD_R + 0.05, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
            {toon(accent, true)}
          </mesh>
          <mesh position={[-(HEAD_R + 0.05), 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
            {toon(accent, true)}
          </mesh>
        </group>
      )
    case 'cape':
      return (
        <mesh position={[0, 1.65, -0.34]} rotation={[0.14, 0, 0]}>
          <planeGeometry args={[0.95, 1.75]} />
          <meshToonMaterial color={accent} gradientMap={grad} side={THREE.DoubleSide} />
        </mesh>
      )
    case 'none':
    default:
      return null
  }
}

function Aura({ color, style, intensity, grad }: { color: string; style: string; intensity: number; grad: THREE.Texture }) {
  const orbit = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  useFrame((state, dt) => {
    if (orbit.current) orbit.current.rotation.y += dt * (style === 'orbit' ? 1.4 : 0.7)
    if (ring.current) {
      const s = 1 + 0.06 * Math.sin(state.clock.elapsedTime * 2)
      ring.current.scale.set(s, s, s)
    }
  })

  if (intensity <= 0.001) return null
  const opacity = 0.18 + 0.55 * intensity
  const sparks = Math.max(3, Math.round(3 + intensity * 8))
  const spread = style === 'fire' ? 1.15 : style === 'bolt' ? 0.9 : 1.0
  const glow = (
    <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
  )

  return (
    <group>
      {/* ground glow ring at the feet */}
      <mesh ref={ring} position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.07, 12, 40]} />
        {glow}
      </mesh>
      {/* 'rings' style adds a second ring around the torso */}
      {style === 'rings' && (
        <mesh position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.05, 12, 40]} />
          {glow}
        </mesh>
      )}
      {/* orbiting sparks around the whole figure */}
      <group ref={orbit}>
        {Array.from({ length: sparks }).map((_, i) => {
          const a = (i / sparks) * Math.PI * 2
          const r = 0.78 + (i % 2) * 0.16
          const y = 0.4 + ((i * 0.37) % 1) * 2.7 * spread
          return (
            <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
              <sphereGeometry args={[0.07 + 0.03 * intensity, 8, 8]} />
              <meshToonMaterial color={color} gradientMap={grad} emissive={color} emissiveIntensity={1.2} transparent opacity={opacity + 0.2} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
