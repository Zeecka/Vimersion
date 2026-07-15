import { describe, expect, it } from 'vitest'
import { cheatsheetMarkdown, cheatsheetHtml, cheatsheetSections } from '../src/game/cheatsheet'
import { COMMANDS } from '../src/game/commands'
import { WORLDS } from '../src/content/tiers'

describe('cheatsheet generation', () => {
  it('sections cover every catalog command exactly once', () => {
    const secs = cheatsheetSections()
    const ids = secs.flatMap((s) => s.groups.flatMap((g) => g.commands.map((c) => c.id)))
    expect(new Set(ids).size).toBe(ids.length) // no dupes
    expect(new Set(ids)).toEqual(new Set(COMMANDS.map((c) => c.id))) // full coverage
  })

  it('sections are ordered by tier and carry world metadata', () => {
    const secs = cheatsheetSections()
    const tiers = secs.map((s) => s.tier)
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
    for (const s of secs) {
      const w = WORLDS.find((x) => x.tier === s.tier)!
      expect(s.name).toBe(w.name)
      expect(s.accent).toBe(w.accent)
    }
  })

  it('markdown lists every command key + label', () => {
    const md = cheatsheetMarkdown()
    expect(md).toMatch(/^# Vimersion/)
    for (const c of COMMANDS) {
      expect(md, `missing keys ${c.keys}`).toContain(`\`${c.keys}\``)
      expect(md, `missing label ${c.label}`).toContain(c.label)
    }
  })

  it('html is a self-contained doc naming every world and command', () => {
    const html = cheatsheetHtml()
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<style>')
    expect(html).not.toContain('http://localhost') // no external asset refs
    for (const w of WORLDS.filter((x) => COMMANDS.some((c) => c.tier === x.tier))) {
      expect(html, `missing world ${w.name}`).toContain(w.name)
    }
    for (const c of COMMANDS) expect(html, `missing label ${c.label}`).toContain(c.label)
  })

  it('html escapes angle brackets in command keys (e.g. Ctrl-v)', () => {
    // Keys are HTML-escaped so a literal "<C-a>"-style key can't break markup.
    const html = cheatsheetHtml()
    expect(html).not.toMatch(/<kbd>[^<]*<[^/k]/) // no raw "<" inside a kbd value
  })
})
