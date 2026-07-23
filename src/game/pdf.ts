/**
 * A tiny, dependency-free PDF writer — just enough to render the Vim cheatsheet
 * as a clean, printable, downloadable document, fully offline (the app ships zero
 * PDF libraries and makes no network calls). It uses only the PDF standard
 * "base-14" fonts (Helvetica / Courier families), so nothing needs embedding.
 *
 * Scope is deliberately narrow: positioned text, filled rectangles, WinAnsi text.
 * If the cheatsheet ever needs images or Unicode beyond Latin-1, reach for a real
 * library instead of growing this. Mirrors TmuxLegends's game/pdf.ts; the only
 * real difference is the data seam — Vim's cheatsheet is two levels deep
 * (world → category → command) rather than a flat list of binding rows.
 */
import { cheatsheetSections, type CheatSection } from './cheatsheet'
import { COMMANDS } from './commands'

// A4 in points, generous margins for a comfortable two-column read.
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 40
const COL_GAP = 26
const COL_W = (PAGE_W - MARGIN * 2 - COL_GAP) / 2
const COL_X = [MARGIN, MARGIN + COL_W + COL_GAP]
const BOTTOM = MARGIN + 14 // leave room for the footer

type RGB = [number, number, number]
const INK: RGB = [0.11, 0.12, 0.15]
const GRAY: RGB = [0.42, 0.45, 0.5]
const VIOLET: RGB = [0.486, 0.42, 1.0] // #7c6bff — primary accent
const VIOLET_DK: RGB = [0.294, 0.247, 0.839] // #4b3fd6 — heading text (print-contrast)
const VIOLET_TINT: RGB = [0.925, 0.922, 0.984] // #ecebfb — heading bar fill
const HAIRLINE: RGB = [0.85, 0.87, 0.89]

const F = { reg: 'F1', bold: 'F2', obl: 'F3', mono: 'F4', monoBold: 'F5' } as const

/** Parse a `#rrggbb` accent into an RGB triple; fall back to the primary violet
 *  for anything we can't read (the app only ships hex accents today). */
function hexRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return VIOLET
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** Map the few non-ASCII glyphs the content might contain onto safe ASCII, and
 *  drop anything else — our fonts use WinAnsi and the xref math assumes 1 byte
 *  per character. */
function sanitize(s: string): string {
  return s
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/[↑↓]/g, '|')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/·/g, '-')
    .replace(/•/g, '*')
    .replace(/[^\x20-\x7e]/g, '')
}

/** Escape the three characters that are special inside a PDF string literal. */
function esc(s: string): string {
  return sanitize(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

// Courier is a fixed 600/1000 em; Helvetica varies, so use a safe average so we
// never overflow a column (wrapping a touch early is fine for a reference card).
const monoW = (s: string, size: number) => sanitize(s).length * size * 0.6
const heltW = (s: string, size: number) => sanitize(s).length * size * 0.52

/** Greedy word wrap using the width estimate above. */
function wrap(text: string, maxW: number, size: number): string[] {
  const words = sanitize(text).split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (heltW(next, size) > maxW && cur) {
      lines.push(cur)
      cur = w
    } else {
      cur = next
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

/** One page's content stream, built op-by-op. */
class Page {
  ops: string[] = []
  private color: RGB | null = null

  private setColor(c: RGB) {
    if (this.color && c[0] === this.color[0] && c[1] === this.color[1] && c[2] === this.color[2]) return
    this.ops.push(`${c[0]} ${c[1]} ${c[2]} rg`)
    this.color = c
  }

  rect(x: number, y: number, w: number, h: number, c: RGB) {
    this.setColor(c)
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)
  }

  text(x: number, y: number, s: string, font: string, size: number, c: RGB) {
    this.setColor(c)
    this.ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(s)}) Tj ET`)
  }

  stream(): string {
    return this.ops.join('\n')
  }
}

/** Lay the cheatsheet out across pages/columns and return the finished pages. */
function layout(sections: CheatSection[]): Page[] {
  const pages: Page[] = []
  let page = new Page()
  pages.push(page)
  let col = 0
  let y = 0

  const pageTop = PAGE_H - MARGIN

  const drawHeader = () => {
    page.rect(0, PAGE_H - 34, PAGE_W, 34, VIOLET)
    page.text(MARGIN, PAGE_H - 23, 'Vim cheatsheet', F.bold, 15, [1, 1, 1])
    const tag = `${COMMANDS.length} commands`
    page.text(PAGE_W - MARGIN - heltW(tag, 9), PAGE_H - 22, tag, F.reg, 9, [1, 1, 1])
  }
  const drawFooter = () => {
    page.rect(MARGIN, BOTTOM + 4, PAGE_W - MARGIN * 2, 0.6, HAIRLINE)
    page.text(MARGIN, BOTTOM - 5, 'VimLegends  -  learn Vim by playing', F.obl, 8, GRAY)
  }

  const newPage = () => {
    page = new Page()
    pages.push(page)
    drawHeader()
    drawFooter()
    col = 0
    y = pageTop - 24
  }
  const nextColumnOrPage = () => {
    if (col === 0) {
      col = 1
      y = pageTop - 24
    } else {
      newPage()
    }
  }
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) nextColumnOrPage()
  }

  // First page furniture.
  drawHeader()
  drawFooter()
  y = pageTop - 24
  const x = () => COL_X[col]

  for (const sec of sections) {
    // Keep the world heading with at least its blurb + first group on the column.
    const blurbLines = sec.subtitle ? wrap(sec.subtitle, COL_W - 6, 8) : []
    ensure(20 + blurbLines.length * 10 + 26)

    // World heading bar, with the world's own accent as a top rule.
    page.rect(x(), y - 13, COL_W, 17, VIOLET_TINT)
    page.rect(x(), y + 2, COL_W, 2, hexRgb(sec.accent))
    page.text(x() + 6, y - 9, `${sec.tier}. ${sec.name}`, F.bold, 10.5, VIOLET_DK)
    y -= 21
    for (const bl of blurbLines) {
      page.text(x(), y, bl, F.obl, 8, GRAY)
      y -= 10
    }
    y -= 3

    for (const g of sec.groups) {
      // Keep a category sub-heading with at least its first command.
      ensure(14 + 22)
      page.text(x(), y, g.label.toUpperCase(), F.bold, 7.5, GRAY)
      page.rect(x(), y - 3, COL_W, 0.5, HAIRLINE)
      y -= 12

      for (const c of g.commands) {
        const keyLines = monoW(c.keys, 8.5) > COL_W ? wrap(c.keys, COL_W, 8.5) : [c.keys]
        const descLines = wrap(c.label, COL_W - 10, 8)
        const rowH = keyLines.length * 10.5 + descLines.length * 9.5 + 6
        ensure(rowH)

        for (const kl of keyLines) {
          page.text(x(), y, kl, F.mono, 8.5, INK)
          y -= 10.5
        }
        for (const dl of descLines) {
          page.text(x() + 10, y, dl, F.reg, 8, GRAY)
          y -= 9.5
        }
        y -= 6
      }
      y -= 4
    }
    y -= 6
  }

  return pages
}

/** Assemble the object graph into raw PDF bytes (all ASCII, 1 byte per char). */
function assemble(pages: Page[]): string {
  const objects: string[] = [] // objects[i] is object number i+1

  const fonts: Record<string, string> = {
    [F.reg]: 'Helvetica',
    [F.bold]: 'Helvetica-Bold',
    [F.obl]: 'Helvetica-Oblique',
    [F.mono]: 'Courier',
    [F.monoBold]: 'Courier-Bold',
  }

  // Reserve numbers: 1 = Catalog, 2 = Pages, then fonts, then per-page (content + page).
  const catalogNo = 1
  const pagesNo = 2
  const fontNos: Record<string, number> = {}
  let n = 3
  for (const key of Object.keys(fonts)) fontNos[key] = n++
  const pageInfos = pages.map(() => {
    const contentNo = n++
    const pageNo = n++
    return { contentNo, pageNo }
  })

  const fontRes = Object.keys(fonts)
    .map((k) => `/${k} ${fontNos[k]} 0 R`)
    .join(' ')
  const kids = pageInfos.map((p) => `${p.pageNo} 0 R`).join(' ')

  objects[catalogNo - 1] = `<< /Type /Catalog /Pages ${pagesNo} 0 R >>`
  objects[pagesNo - 1] =
    `<< /Type /Pages /Count ${pages.length} /Kids [ ${kids} ] ` +
    `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
    `/Resources << /Font << ${fontRes} >> >> >>`
  for (const [key, name] of Object.entries(fonts)) {
    objects[fontNos[key] - 1] =
      `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`
  }
  pages.forEach((pg, i) => {
    const stream = pg.stream()
    const info = pageInfos[i]
    objects[info.contentNo - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    objects[info.pageNo - 1] = `<< /Type /Page /Parent ${pagesNo} 0 R /Contents ${info.contentNo} 0 R >>`
  })

  // Serialize with a byte-accurate cross-reference table.
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets[i] = pdf.length
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNo} 0 R >>\n`
  pdf += `startxref\n${xrefStart}\n%%EOF`
  return pdf
}

/** Build the cheatsheet as a PDF Blob (offline, no dependencies). */
export function buildCheatsheetPdf(sections: CheatSection[] = cheatsheetSections()): Blob {
  const bytes = assemble(layout(sections))
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i) & 0xff
  return new Blob([arr], { type: 'application/pdf' })
}

/** Build and trigger a browser download of the cheatsheet PDF. */
export function downloadCheatsheetPdf(filename = 'vimlegends-cheatsheet.pdf') {
  const url = URL.createObjectURL(buildCheatsheetPdf())
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the click has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
