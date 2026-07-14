import type { Extension } from '@codemirror/state'
import type { Challenge } from '../game/types'

/**
 * Language extensions for challenges that need a syntax tree.
 * `it`/`at` tag text objects resolve via Lezer OpenTag/CloseTag nodes —
 * without a language extension they are silent no-ops, so any challenge
 * teaching them MUST set `lang: 'html'`.
 *
 * Loaded lazily: @codemirror/lang-html (+ its css/js deps) is ~70KB gz, far
 * too heavy to ship eagerly for a handful of tag levels. The chunk is fetched
 * once, on first entry into a lang-tagged level.
 */
export async function loadLang(lang: NonNullable<Challenge['lang']>): Promise<Extension> {
  switch (lang) {
    case 'html': {
      const { html } = await import('@codemirror/lang-html')
      return html()
    }
  }
}
