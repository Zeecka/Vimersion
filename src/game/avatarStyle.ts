import { useEffect, useState } from 'react'
import { CHARACTER_SVG } from './characters'
import { COSMETIC_BY_ID } from './cosmetics'
import type { HeroCustom } from './store'

/**
 * Runtime recoloring of the bundled character SVGs.
 *
 * Every DiceBear character carries the same two-stop `backgroundLinear`
 * gradient (see scripts/gen-characters.mjs); replacing those stops with the
 * player's chosen hero colors personalizes the art without shipping raw SVG
 * text in the JS bundle — the asset is fetched (same-origin, cached) once.
 */

/** Effective hero colors for a character: player picks win, else its palette. */
export function heroColorsFor(avatarId: string, hero: HeroCustom): { primary: string; secondary: string } | null {
  const palette = COSMETIC_BY_ID[avatarId]?.palette ?? null
  const primary = hero.primary ?? palette?.primary ?? null
  const secondary = hero.secondary ?? palette?.secondary ?? primary
  return primary ? { primary, secondary: secondary ?? primary } : null
}

const rawCache = new Map<string, Promise<string>>()
const tintedCache = new Map<string, string>()

function fetchRaw(id: string): Promise<string> {
  let p = rawCache.get(id)
  if (!p) {
    p = fetch(CHARACTER_SVG[id]).then((r) => {
      if (!r.ok) throw new Error(`avatar svg ${id}: ${r.status}`)
      return r.text()
    })
    rawCache.set(id, p)
    p.catch(() => rawCache.delete(id)) // allow retry after a transient failure
  }
  return p
}

function recolor(svg: string, primary: string, secondary: string): string {
  return svg.replace(/(<linearGradient id="backgroundLinear"[\s\S]*?<\/linearGradient>)/, (grad) => {
    let first = true
    return grad.replace(/stop-color="[^"]*"/g, () => {
      const c = first ? primary : secondary
      first = false
      return `stop-color="${c}"`
    })
  })
}

/**
 * Resolves the <img> src for a character: the static asset URL when no custom
 * colors apply, otherwise a recolored data-URI (async; static URL until ready).
 */
export function useAvatarSrc(id: string, colors: { primary: string; secondary: string } | null): string | undefined {
  const base = CHARACTER_SVG[id]
  const custom = colors && base ? `${id}|${colors.primary}|${colors.secondary}` : null
  const [tinted, setTinted] = useState<string | null>(() => (custom ? (tintedCache.get(custom) ?? null) : null))

  useEffect(() => {
    if (!custom) {
      setTinted(null)
      return
    }
    const hit = tintedCache.get(custom)
    if (hit) {
      setTinted(hit)
      return
    }
    // Depend on the string key only — the colors object is rebuilt per render.
    const [cid, primary, secondary] = custom.split('|')
    let cancelled = false
    fetchRaw(cid)
      .then((raw) => {
        const uri = `data:image/svg+xml,${encodeURIComponent(recolor(raw, primary, secondary))}`
        tintedCache.set(custom, uri)
        if (!cancelled) setTinted(uri)
      })
      .catch(() => {
        if (!cancelled) setTinted(null) // fall back to the untinted asset
      })
    return () => {
      cancelled = true
    }
  }, [custom])

  return custom && tinted ? tinted : base
}
