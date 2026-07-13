import type { ComponentType } from 'react'
import { Level1Scene } from './scenes/Level1Scene'

export interface LevelSceneProps {
  accent: string
}

/**
 * sceneIndex (CHALLENGES order) → 3D scene component, rendered by Stage3D
 * while playing that level. Must stay in lock-step with HAS_3D_SCENE in
 * sceneRegistry.meta.ts (the sync-bundle mirror CampaignMode reads).
 */
export const SCENES_3D: Readonly<Record<number, ComponentType<LevelSceneProps>>> = {
  0: Level1Scene,
}
