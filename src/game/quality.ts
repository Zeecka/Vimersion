/**
 * Graphics quality tiers.
 *
 * 'webgl' — the 3D stage (react-three-fiber underlay, 3D hero) is enabled.
 * 'lite'  — the classic procedural SVG/CSS visuals (Background/LevelScene) only.
 *
 * The persisted user setting is 'auto' | 'webgl' | 'lite'; 'auto' resolves via
 * detectQuality() once per session. Detection is deliberately conservative:
 * this is a keyboard game whose editor latency is sacred, so anything that
 * hints at a weak device gets the (fully featured) lite experience.
 */
export type QualitySetting = 'auto' | 'webgl' | 'lite'
export type QualityTier = 'webgl' | 'lite'

let detected: QualityTier | null = null

export function detectQuality(): QualityTier {
  if (detected) return detected
  detected = detect()
  return detected
}

function detect(): QualityTier {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'lite'
    // Low-memory devices (Chrome-only hint; undefined elsewhere).
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (dm !== undefined && dm < 4) return 'lite'
    // Coarse pointer ≈ phone/tablet — a keyboard game defaults them to lite.
    if (window.matchMedia('(pointer: coarse)').matches) return 'lite'
    // Require a real GPU: software rasterizers refuse with this flag set.
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return 'lite'
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return 'webgl'
  } catch {
    return 'lite'
  }
}

/** Resolve the persisted setting to the tier used this session. */
export function effectiveQuality(setting: QualitySetting): QualityTier {
  return setting === 'auto' ? detectQuality() : setting
}
