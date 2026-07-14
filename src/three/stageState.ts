import { create } from 'zustand'

/**
 * Bridge between the game UI and the 3D stage.
 *
 * NON-persisted, and deliberately free of any `three` imports so it lives in
 * the small sync bundle: App/CampaignMode write to it before the lazy 3D chunk
 * has even loaded; everything inside the canvases reads from it. This avoids
 * prop-drilling through the transform-animating <motion.main>.
 */
export type HeroReaction = 'idle' | 'typing' | 'win' | 'levelup' | 'fail'
export type StageScreen = 'home' | 'map' | 'play' | 'arcade' | 'shop' | 'profile'

interface StageState {
  screen: StageScreen
  /** Play screen's scene index (CHALLENGES order), null outside levels. */
  sceneIndex: number | null
  /** Mirrors the equipped theme accent / background cosmetic. */
  accent: string
  bgId: string
  heroReaction: HeroReaction
  /** Stage3D rendered its first frame — the lite background can hand off. */
  ready: boolean
  /** WebGL context died and did not recover — stay lite for this session. */
  contextLost: boolean
}

export const useStage = create<StageState>()(() => ({
  screen: 'home',
  sceneIndex: null,
  accent: '#7c6bff',
  bgId: 'platform',
  heroReaction: 'idle',
  ready: false,
  contextLost: false,
}))

/** Imperative writer for non-React callers and effects. */
export function setStage(partial: Partial<StageState>) {
  useStage.setState(partial)
}
