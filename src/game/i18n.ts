import { useCallback } from 'react'
import { create } from 'zustand'
import { en } from './locales/en'
import { fr } from './locales/fr'
import { es } from './locales/es'
import { ru } from './locales/ru'
import { zh } from './locales/zh'

/**
 * Tiny, dependency-free i18n layer.
 *
 * - Five languages; English is the source of truth and the fallback.
 * - The active language lives in its own localStorage key (NOT the game save) so
 *   the persisted store's version/migrate never has to move for a UI preference.
 * - `t(key, params?, fallback?)` looks the key up in the active language, then
 *   English, then the caller-supplied `fallback` (used for content strings whose
 *   English lives in the content files — so translations never drift from source),
 *   then the key itself. Missing translations degrade gracefully to English.
 */

export const LANGS = ['en', 'fr', 'es', 'ru', 'zh'] as const
export type Lang = (typeof LANGS)[number]

export const LANG_META: Record<Lang, { label: string; flag: string; english: string }> = {
  en: { label: 'English', flag: '🇬🇧', english: 'English' },
  fr: { label: 'Français', flag: '🇫🇷', english: 'French' },
  es: { label: 'Español', flag: '🇪🇸', english: 'Spanish' },
  ru: { label: 'Русский', flag: '🇷🇺', english: 'Russian' },
  zh: { label: '中文', flag: '🇨🇳', english: 'Chinese' },
}

// Kept distinct from the game save key ('vimersion-save') on purpose.
const STORAGE_KEY = 'vimersion-lang'

function isLang(x: unknown): x is Lang {
  return typeof x === 'string' && (LANGS as readonly string[]).includes(x)
}

/** Stored preference wins; otherwise the best match among the browser languages;
 *  otherwise English. Called once at store creation. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    /* private mode / no storage — fall through to browser detection */
  }
  try {
    const nav = navigator
    const cands = [nav.language, ...(nav.languages ?? [])].filter(Boolean)
    for (const c of cands) {
      const base = c.toLowerCase().split('-')[0]
      // zh-CN / zh-TW / zh-Hans … all map to our single Simplified bundle.
      if (base === 'zh') return 'zh'
      if (isLang(base)) return base
    }
  } catch {
    /* no navigator (SSR/tests) */
  }
  return 'en'
}

interface LangStore {
  lang: Lang
  /** True once the user has explicitly chosen (vs. an auto-detected default). */
  explicit: boolean
  setLang: (l: Lang) => void
}

function initialExplicit(): boolean {
  try {
    return isLang(localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
  }
}

export const useLangStore = create<LangStore>((set) => ({
  lang: detectLang(),
  explicit: initialExplicit(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
    try {
      document.documentElement.lang = lang
    } catch {
      /* ignore */
    }
    set({ lang, explicit: true })
  },
}))

export const useLang = () => useLangStore((s) => s.lang)
export const getLang = (): Lang => useLangStore.getState().lang
export const setLang = (l: Lang) => useLangStore.getState().setLang(l)

type Dict = Record<string, string>
const DICTS: Record<Lang, Dict> = { en, fr, es, ru, zh }

function interpolate(s: string, params?: Record<string, string | number>): string {
  if (!params) return s
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m))
}

/**
 * Translate `key` into `lang`. `fallback` is the English source used when neither
 * the active language nor the English dictionary carries the key — this is how
 * content strings (challenge titles, hints, …) stay authored once in the content
 * files while still being translatable.
 */
export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
  fallback?: string,
): string {
  const raw = DICTS[lang]?.[key] ?? DICTS.en[key] ?? fallback ?? key
  return interpolate(raw, params)
}

export type TFn = (key: string, params?: Record<string, string | number>, fallback?: string) => string

/** Hook returning a `t` bound to the active language; re-renders on language change. */
export function useT(): TFn {
  const lang = useLang()
  return useCallback<TFn>((key, params, fallback) => translate(lang, key, params, fallback), [lang])
}
