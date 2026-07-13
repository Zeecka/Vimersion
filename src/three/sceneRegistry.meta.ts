/**
 * Which scene indices (CHALLENGES order) have a dedicated 3D scene.
 *
 * Sync-bundle-safe: NO three imports here. CampaignMode consults this to
 * decide whether to hide the SVG <LevelScene> and go glass — the actual
 * component map lives in sceneRegistry.tsx inside the lazy 3D chunk.
 */
export const HAS_3D_SCENE: ReadonlySet<number> = new Set([0])
