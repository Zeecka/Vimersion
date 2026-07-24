import { describe, expect, it } from 'vitest'
import { buildCheatsheetPdf } from '../src/game/pdf'

/**
 * The cheatsheet PDF is assembled by hand (game/pdf.ts), so the cross-reference
 * table's byte offsets are the thing most likely to break. These tests parse the
 * generated file back and prove every xref offset actually lands on its object -
 * i.e. the PDF is structurally valid, not just "starts with %PDF".
 *
 * Ported from TmuxLegends; here `buildCheatsheetPdf()` is called with no args so it
 * uses VimLegends's default `cheatsheetSections()` (its `pdf.ts` has no exported
 * CHEATSHEET constant).
 */
async function pdfString(): Promise<string> {
  const blob = buildCheatsheetPdf()
  const buf = new Uint8Array(await blob.arrayBuffer())
  let s = ''
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
  return s
}

describe('cheatsheet PDF', () => {
  it('has a valid header and trailer', async () => {
    const pdf = await pdfString()
    expect(pdf.startsWith('%PDF-1.')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(pdf).toContain('/Type /Catalog')
    expect(pdf).toContain('/Type /Pages')
  })

  it('every xref offset points at the right object', async () => {
    const pdf = await pdfString()

    // startxref -> byte offset of the xref table.
    const m = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(pdf)
    expect(m, 'startxref/EOF present').toBeTruthy()
    const xrefStart = Number(m![1])
    expect(pdf.slice(xrefStart, xrefStart + 4)).toBe('xref')

    // Parse the xref subsection header: "0 N".
    const header = /xref\s+0 (\d+)\s/.exec(pdf.slice(xrefStart))
    expect(header).toBeTruthy()
    const size = Number(header![1])
    expect(size).toBeGreaterThan(5)

    // Each 20-byte entry after the header: "NNNNNNNNNN GGGGG f/n ".
    const entriesStart = xrefStart + header![0].length
    const entryRe = /(\d{10}) \d{5} [nf] ?/g
    entryRe.lastIndex = entriesStart
    let obj = 0
    let e: RegExpExecArray | null
    while (obj < size && (e = entryRe.exec(pdf)) !== null) {
      const off = Number(e[1])
      if (obj > 0) {
        // Offset must land exactly on "<obj> 0 obj".
        expect(pdf.slice(off, off + `${obj} 0 obj`.length), `obj ${obj} offset`).toBe(`${obj} 0 obj`)
      }
      obj++
    }
    expect(obj).toBe(size)
  })

  it('/Length matches every content stream', async () => {
    const pdf = await pdfString()
    const re = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g
    let m: RegExpExecArray | null
    let count = 0
    while ((m = re.exec(pdf)) !== null) {
      expect(m[2].length, 'declared /Length equals actual stream bytes').toBe(Number(m[1]))
      count++
    }
    expect(count).toBeGreaterThan(0)
  })
})
