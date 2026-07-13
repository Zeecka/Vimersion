// Generates colorful character SVGs with DiceBear at build time, bundled as static
// assets so the app stays offline (no runtime DiceBear dependency / network).
import { createAvatar } from '@dicebear/core'
import * as C from '@dicebear/collection'
import { writeFileSync, mkdirSync } from 'node:fs'

const roster = [
  { id: 'ninja', style: 'adventurer', seed: 'ShadowNinjaVim', bg: ['7c3aed', '8b5cf6'] },
  { id: 'robot', style: 'bottts', seed: 'MacroBot7', bg: ['0ea5e9', '2563eb'] },
  { id: 'cat', style: 'funEmoji', seed: 'CopyCatYY', bg: ['f59e0b', 'f97316'] },
  { id: 'alien', style: 'bottts', seed: 'BufferAlien77', bg: ['10b981', '059669'] },
  { id: 'ghost', style: 'funEmoji', seed: 'EscGhostBoo', bg: ['22d3ee', '3b82f6'] },
  { id: 'fox', style: 'pixelArt', seed: 'QuickFoxDot', bg: ['fb923c', 'ea580c'] },
  { id: 'wizard', style: 'adventurer', seed: 'RegexWizardSub', bg: ['a855f7', '6366f1'] },
  { id: 'dragon', style: 'bottts', seed: 'MotionDragonHex', bg: ['16a34a', '65a30d'] },
  { id: 'knight', style: 'adventurer', seed: 'NeonKnightHJKL', bg: ['e11d48', 'f43f5e'] },
  { id: 'glitch', style: 'bottts', seed: 'GlitchByte0x', bg: ['db2777', '9333ea'] },
  { id: 'pixelpal', style: 'pixelArt', seed: 'PixelPalRetro', bg: ['06b6d4', '0891b2'] },
  { id: 'sprite', style: 'thumbs', seed: 'SpriteRunner', bg: ['eab308', 'f59e0b'] },
]

const dir = new URL('../src/assets/characters/', import.meta.url)
mkdirSync(dir, { recursive: true })

for (const r of roster) {
  const style = C[r.style]
  if (!style) {
    console.error('MISSING STYLE:', r.style, '— available:', Object.keys(C).join(', '))
    process.exit(1)
  }
  const svg = createAvatar(style, {
    seed: r.seed,
    size: 120,
    radius: 22,
    backgroundType: ['gradientLinear'],
    backgroundColor: r.bg,
  }).toString()
  writeFileSync(new URL(`../src/assets/characters/${r.id}.svg`, import.meta.url), svg)
  console.log('ok', r.id.padEnd(10), r.style.padEnd(12), svg.length, 'bytes')
}
console.log('done:', roster.length, 'characters')
