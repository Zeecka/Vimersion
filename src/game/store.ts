import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Challenge, ChallengeResult, Stars } from './types'
import type { QualitySetting } from './quality'
import { levelFromXp, starsFor, xpForChallenge } from './xp'
import { COSMETIC_BY_ID, DEFAULTS, LEGACY_DEFAULT_BACKGROUNDS, LEGACY_DEFAULT_THEMES } from './cosmetics'
import { INITIAL_HERO, LEGACY_AVATAR_IDS, normalizeHero, type HeroAura, type HeroCustom } from './heroParts'

/** Reps of a command before it counts as "mastered" (fills the command belt). */
export const MASTERY_THRESHOLD = 3

export interface Equipped {
  theme: string
  background: string
}

export type { HeroCustom }

export interface CompleteOutcome {
  stars: Stars
  xpGained: number
  coinsGained: number
  leveledUp: boolean
  newLevel: number
  newlyMastered: string[]
  isPerfect: boolean
}

interface Persisted {
  xp: number
  coins: number
  completed: Record<string, ChallengeResult>
  mastery: Record<string, number>
  streak: { count: number; lastPlayed: string | null }
  soundOn: boolean
  arcadeBest: number
  owned: string[]
  equipped: Equipped
  hero: HeroCustom
  /** Graphics quality: 'auto' resolves per-device via detectQuality(). */
  quality: QualitySetting
}

interface GameStore extends Persisted {
  completeChallenge: (ch: Challenge, keystrokes: number) => CompleteOutcome
  recordArcade: (score: number, commands: string[]) => { isNewBest: boolean; coinsGained: number }
  buyItem: (id: string) => boolean
  equipItem: (id: string) => void
  setHero: (partial: Partial<Omit<HeroCustom, 'aura'>> & { aura?: Partial<HeroAura> }) => void
  bumpStreak: () => void
  toggleSound: () => void
  setQuality: (q: QualitySetting) => void
  resetProgress: () => void
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

const initial: Persisted = {
  xp: 0,
  coins: 0,
  completed: {},
  mastery: {},
  streak: { count: 0, lastPlayed: null },
  soundOn: true,
  arcadeBest: 0,
  owned: [DEFAULTS.theme, DEFAULTS.background],
  equipped: { ...DEFAULTS },
  hero: INITIAL_HERO,
  quality: 'auto',
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial,

      completeChallenge: (ch, keystrokes) => {
        const s = get()
        const stars = starsFor(keystrokes, ch.par)
        const prev = s.completed[ch.id]
        const prevStars: number = prev?.stars ?? 0
        const xpGained = xpForChallenge(stars, prevStars)

        const beforeLevel = levelFromXp(s.xp)
        const newXp = s.xp + xpGained
        const afterLevel = levelFromXp(newXp)
        const leveledUp = afterLevel > beforeLevel

        // Coins: reward first solves and improvements, plus a level-up bonus.
        let coinsGained = 0
        if (prevStars === 0) coinsGained = 5 + stars * 3
        else if (stars > prevStars) coinsGained = (stars - prevStars) * 3
        if (leveledUp) coinsGained += 25

        const mastery = { ...s.mastery }
        const newlyMastered: string[] = []
        for (const id of ch.taughtCommands) {
          const before = mastery[id] ?? 0
          mastery[id] = before + 1
          if (before < MASTERY_THRESHOLD && mastery[id] >= MASTERY_THRESHOLD) newlyMastered.push(id)
        }

        const keepStars = Math.max(stars, prevStars) as Stars
        const bestKeystrokes = prev ? Math.min(prev.keystrokes, keystrokes) : keystrokes
        const result: ChallengeResult = {
          keystrokes: bestKeystrokes,
          par: ch.par,
          stars: keepStars,
          xp: (prev?.xp ?? 0) + xpGained,
        }

        set({ xp: newXp, coins: s.coins + coinsGained, completed: { ...s.completed, [ch.id]: result }, mastery })
        get().bumpStreak()

        return { stars, xpGained, coinsGained, leveledUp, newLevel: afterLevel, newlyMastered, isPerfect: keystrokes <= ch.par }
      },

      recordArcade: (score, commands) => {
        const s = get()
        const mastery = { ...s.mastery }
        for (const id of commands) mastery[id] = (mastery[id] ?? 0) + 1
        const isNewBest = score > s.arcadeBest
        const coinsGained = Math.floor(score / 5)
        set({ mastery, arcadeBest: Math.max(score, s.arcadeBest), coins: s.coins + coinsGained })
        get().bumpStreak()
        return { isNewBest, coinsGained }
      },

      buyItem: (id) => {
        const item = COSMETIC_BY_ID[id]
        const s = get()
        if (!item || s.owned.includes(id) || s.coins < item.price) return false
        set({ coins: s.coins - item.price, owned: [...s.owned, id] })
        return true
      },

      equipItem: (id) => {
        const item = COSMETIC_BY_ID[id]
        const s = get()
        if (!item || !s.owned.includes(id)) return
        set({ equipped: { ...s.equipped, [item.kind]: id } })
      },

      setHero: (partial) =>
        set((s) => ({ hero: { ...s.hero, ...partial, aura: { ...s.hero.aura, ...(partial.aura ?? {}) } } })),

      bumpStreak: () => {
        const s = get()
        const today = todayKey()
        const last = s.streak.lastPlayed
        if (last === today) return
        let count = 1
        if (last && daysBetween(last, today) === 1) count = s.streak.count + 1
        set({ streak: { count, lastPlayed: today } })
      },

      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      setQuality: (q) => set({ quality: q }),

      resetProgress: () => set({ ...initial, owned: [...initial.owned], equipped: { ...initial.equipped } }),
    }),
    {
      name: 'vimersion-save',
      version: 10,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, any>
        const pe = (p.equipped ?? {}) as Record<string, unknown>
        const merged = {
          ...initial,
          ...p,
          owned: Array.from(new Set([...((p.owned as string[]) ?? []), ...initial.owned])),
          // v10: `equipped.avatar` was removed — keep only theme + background.
          equipped: {
            theme: typeof pe.theme === 'string' ? pe.theme : initial.equipped.theme,
            background: typeof pe.background === 'string' ? pe.background : initial.equipped.background,
          },
          // Hero customization: coerce the old {primary,secondary,effect} (pre-v10)
          // or the new shape to the canonical HeroCustom.
          hero: normalizeHero(p.hero),
        } as Persisted
        // v4: default became the side-scrolling "Pixel Kingdom". Move anyone still on
        // an older default onto it (their old background stays owned, so they can
        // re-equip it for free from the Shop if they prefer).
        if (version < 4 && LEGACY_DEFAULT_BACKGROUNDS.includes(merged.equipped.background)) {
          merged.equipped.background = DEFAULTS.background
        }
        // v5: added `quality` ('auto' | 'webgl' | 'lite') — the `...initial` spread
        // above already backfills it to 'auto' for older saves. The default theme
        // also became 'nightglass'; move anyone still on an old default theme onto
        // it (old themes are free in the Shop, so nothing is lost).
        if (version < 5 && LEGACY_DEFAULT_THEMES.includes(merged.equipped.theme)) {
          merged.equipped.theme = DEFAULTS.theme
        }
        // v7: the "Pixel Kingdom" (platform) background was removed.
        // v10: the fixed-avatar roster + block cursor were removed in favor of the
        // single customizable Hero. Drop 'platform' and all old avatar ids from
        // `owned`, and repair any now-unknown equipped background.
        merged.owned = merged.owned.filter((id) => id !== 'platform' && !LEGACY_AVATAR_IDS.includes(id))
        if (!COSMETIC_BY_ID[merged.equipped.background]) {
          merged.equipped.background = DEFAULTS.background
        }
        // v9: default background reverted to 'crt' (CRT Scanlines). Move anyone
        // still on the previous default ('synthwave', the v8 default) onto it —
        // same pattern as past default changes. 'synthwave' stays free in the
        // Shop to re-equip.
        if (version < 9 && merged.equipped.background === 'synthwave') {
          merged.equipped.background = DEFAULTS.background
        }
        return merged
      },
      partialize: (s): Persisted => ({
        xp: s.xp,
        coins: s.coins,
        completed: s.completed,
        mastery: s.mastery,
        streak: s.streak,
        soundOn: s.soundOn,
        arcadeBest: s.arcadeBest,
        owned: s.owned,
        equipped: s.equipped,
        hero: s.hero,
        quality: s.quality,
      }),
    },
  ),
)
