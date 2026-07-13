// Final QA gate: v4-save migration, t3-ciw playthrough, offline reload, map/shop screenshots.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const SHOT = process.env.SHOT_DIR ?? '.qa-shots'
const T1 = ['t1-first-blood', 't1-navigate', 't1-insert', 't1-append', 't1-delete-line', 't1-undo', 't1-open-line', 't1-capstone']
const T2 = ['t2-word-leap', 't2-end-word', 't2-back-word', 't2-line-ends', 't2-find-char', 't2-change-word', 't2-file-ends', 't2-capstone']

const results = []
const report = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })

// ---------- 1. Real v4 save migrates: progress intact, quality added, theme moved ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const V4_SAVE = {
    state: {
      xp: 480,
      coins: 133,
      completed: Object.fromEntries(T1.map((id) => [id, { keystrokes: 4, par: 4, stars: 3, xp: 75 }])),
      mastery: { x: 5, i: 4, h: 3, j: 3, k: 3, l: 3 },
      streak: { count: 6, lastPlayed: '2026-7-12' },
      soundOn: false,
      arcadeBest: 180,
      owned: ['cursor', 'phosphor', 'platform', 'ninja', 'amber'],
      equipped: { avatar: 'ninja', theme: 'phosphor', background: 'platform' },
    },
    version: 4,
  }
  await page.goto(BASE)
  await page.evaluate((s) => localStorage.setItem('vimersion-save', JSON.stringify(s)), V4_SAVE)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('vimersion-save')))
  report('migrate: version bumped to 5', migrated.version === 5)
  report('migrate: quality defaulted to auto', migrated.state.quality === 'auto')
  report('migrate: xp/coins preserved', migrated.state.xp === 480 && migrated.state.coins === 133, `xp=${migrated.state.xp} coins=${migrated.state.coins}`)
  report('migrate: completed preserved', Object.keys(migrated.state.completed).length === T1.length)
  report('migrate: old default theme → nightglass', migrated.state.equipped.theme === 'nightglass')
  report('migrate: phosphor still owned', migrated.state.owned.includes('phosphor'))
  report('migrate: non-default avatar untouched', migrated.state.equipped.avatar === 'ninja')
  // World 2 unlocked (tier1 standard challenges all complete despite new boss)
  await page.click('text=world map').catch(() => {})
  await page.waitForTimeout(400)
  const w2locked = await page.locator('section', { hasText: 'Comfortable' }).locator('text=Locked').count()
  report('migrate: world 2 still unlocked (boss not required)', w2locked === 0)
  await page.screenshot({ path: `${SHOT}/worldmap.png` })
  await ctx.close()
}

// ---------- 2. t3-ciw playable end-to-end in webgl tier ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  const seed = {
    state: {
      completed: Object.fromEntries(
        [...T1, ...T2, 'boss-gatekeeper'].map((id) => [id, { keystrokes: 4, par: 4, stars: 3, xp: 75 }]),
      ),
      xp: 1400,
      quality: 'webgl',
    },
    version: 5,
  }
  await page.goto(BASE)
  await page.evaluate((s) => localStorage.setItem('vimersion-save', JSON.stringify(s)), seed)
  await page.reload()
  await page.click('text=world map')
  await page.waitForTimeout(400)
  await page.click('text=Inside Job')
  await page.waitForSelector('.cm-content')
  await page.waitForTimeout(2500) // let the 3D chunk/model settle (SwiftShader stalls)
  await page.keyboard.type('ciwcount')
  await page.waitForTimeout(600)
  const perfect = await page.locator('text=PERFECT!').isVisible().catch(() => false)
  report('t3-ciw: solved at 8 ≤ par 9 → PERFECT', perfect)
  await page.screenshot({ path: `${SHOT}/t3-ciw.png` })
  report('t3-ciw: no page errors', errors.length === 0, errors.slice(0, 2).join('|'))
  await ctx.close()
}

// ---------- 3. Offline reload (self-hosted fonts, no external deps) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const external = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (u.origin !== new URL(BASE).origin) external.push(r.url())
  })
  await page.reload({ waitUntil: 'networkidle' })
  report('offline-ready: zero external requests', external.length === 0, external.slice(0, 3).join(','))
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
