import * as THREE from 'three'

/**
 * Shared toon-shading helpers. One 3-step gradient ramp (NearestFilter) gives
 * every MeshToonMaterial the same flat, cel-shaded look — no custom shaders.
 */
let gradientMap: THREE.DataTexture | null = null

export function getGradientMap(): THREE.DataTexture {
  if (!gradientMap) {
    // Three brightness bands: shadow / mid / lit.
    const data = new Uint8Array([96, 176, 255])
    gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RedFormat)
    gradientMap.minFilter = THREE.NearestFilter
    gradientMap.magFilter = THREE.NearestFilter
    gradientMap.needsUpdate = true
  }
  return gradientMap
}

export interface ToonOpts {
  emissive?: THREE.ColorRepresentation
  /** >1 makes the selective Bloom pass pick this surface up. */
  emissiveIntensity?: number
}

export function toonMaterial(color: THREE.ColorRepresentation, opts: ToonOpts = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  })
}

/** Nightglass world palette — matches the UI tokens in styles/index.css. */
export const PALETTE = {
  bg: '#0b0d14',
  ground: '#1c2436',
  groundDeep: '#141a2a',
  rock: '#2a3450',
  foliage: '#3fa26a',
  foliageDark: '#2c7a52',
  trunk: '#6b4a3a',
  crystal: '#4cc9f0',
  lantern: '#ffc24b',
  magenta: '#ff6ac1',
} as const
