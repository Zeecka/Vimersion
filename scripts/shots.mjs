// Capture the README / docs screenshots against a running `npm run preview`.
//
//   npm run build && npm run preview &   # serves the production build on :4173
//   node scripts/shots.mjs               # writes PNGs into docs/media/
//
// Screens are driven through the real UI (no fixtures): a generous "showcase"
// save is seeded into localStorage and the optional-account API is stubbed so
// the Sign-in control is exercised without standing up the backend.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const OUT = process.env.SHOT_DIR ?? 'docs/media'
const VP = { width: 1440, height: 900 }

await mkdir(OUT, { recursive: true })

const T1 = ['t1-first-blood', 't1-navigate', 't1-insert', 't1-append', 't1-delete-line', 't1-undo', 't1-open-line', 't1-capstone']
const T2 = ['t2-word-leap', 't2-end-word', 't2-back-word', 't2-line-ends', 't2-find-char', 't2-change-word', 't2-file-ends', 't2-capstone']
const T3_DONE = ['t3-cut-word', 't3-shear', 't3-ciw']
const solved = (ids) => Object.fromEntries(ids.map((id) => [id, { keystrokes: 4, par: 5, stars: 3, xp: 75 }]))

// A progressed-but-fresh profile: worlds 1–2 cleared, world 3 opened, a streak
// running, coins to spend in the Shop, the default (recognisable) gold Hero.
const SAVE = {
  version: 10,
  state: {
    xp: 1480,
    coins: 260,
    completed: solved([...T1, 'boss-gatekeeper', ...T2, ...T3_DONE]),
    mastery: Object.fromEntries(
      ['x', 'i', 'a', 'o', 'dd', 'u', 'h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', 'gg', 'G', 'ciw', 'cw', 'f'].map((k) => [k, 6]),
    ),
    streak: { count: 7, lastPlayed: '2026-7-14' },
    soundOn: true,
    arcadeBest: 320,
    owned: ['nightglass', 'crt', 'synthwave', 'aurora', 'phosphor'],
    equipped: { theme: 'nightglass', background: 'crt' },
    hero: { body: null, trim: null, visor: null, accessory: 'none', visorStyle: 'bar', aura: { color: null, style: 'sparkles', intensity: 0.6 } },
    quality: 'webgl',
  },
}

// Stub the optional backend as "reachable, not signed in" → the Sign-in control
// renders (status 'anon') without a real server.
async function mockAccount(ctx) {
  await ctx.route('**/api/config', (r) => r.fulfill({ json: { providers: ['google', 'github'] } }))
  await ctx.route('**/api/me', (r) => r.fulfill({ json: { user: null, progress: null, updatedAt: null } }))
}

// Optional filter: SHOTS=home,shop runs just those (default: all).
const ONLY = (process.env.SHOTS ?? '').split(',').map((s) => s.trim()).filter(Boolean)

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })

async function seeded() {
  const ctx = await browser.newContext({ viewport: VP })
  await mockAccount(ctx)
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  await page.goto(BASE)
  await page.evaluate((s) => localStorage.setItem('vimersion-save', JSON.stringify(s)), SAVE)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2400) // let the 3D chunk compile + paint a frame
  return { ctx, page }
}

// Park the pointer somewhere neutral so no hover ring bleeds into the frame.
const rest = (page) => page.mouse.move(20, 880)

async function shot(name, drive) {
  if (ONLY.length && !ONLY.includes(name)) return
  const { ctx, page } = await seeded()
  try {
    await drive(page)
    await rest(page)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${OUT}/${name}.png` })
    console.log(`✓ ${name}.png`)
  } catch (e) {
    console.log(`✗ ${name}.png — ${e.message}`)
  } finally {
    await ctx.close()
  }
}

const openMap = async (page) => {
  await page.click('header button[title="World map"]')
  await page.waitForTimeout(1800) // map slide + 3D can stall under SwiftShader
}
const openLevel = async (page, title) => {
  await openMap(page)
  await page.locator(`text=${title}`).first().click({ timeout: 60000 })
  await page.waitForSelector('.cm-content')
  await page.waitForTimeout(2600) // lazy 3D + model settle
}

// 1 · Home — top bar, gradient logo, stats, Command Belt, live 3D world
await shot('home', async () => {})

// 2 · Level — real Vim editor + Hero panel over the play-screen 3D scene
await shot('level', (page) => openLevel(page, 'Inside Job'))

// 3 · World map — star-rated progression, worlds unlocking
await shot('worldmap', openMap)

// 4 · Results — the VimGolf keystroke/par scorecard
await shot('result', async (page) => {
  await openLevel(page, 'Inside Job')
  await page.keyboard.type('ciwcount')
  await page.waitForTimeout(700)
})

// 5 · Customize — the Hero studio with a live 3D preview
await shot('customize', async (page) => {
  await page.click('header button[title="Customize your character"]')
  await page.waitForTimeout(1400)
  await page.getByRole('button', { name: 'Top Hat' }).click()
  await page.getByRole('button', { name: 'Bolt' }).click()
  await page.waitForTimeout(1600)
})

// 6 · Shop — spend coins on scene backgrounds
await shot('shop', async (page) => {
  await page.click('header button[title="Shop"]')
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: 'Backgrounds' }).click()
  await page.waitForTimeout(700)
})

// 7 · Boss — the keystroke-budget integrity bar
await shot('boss', (page) => openLevel(page, 'The Gatekeeper'))

// 8 · Motion Rush — the hjkl speed-drill arcade
await shot('arcade', async (page) => {
  await page.getByRole('button', { name: /Motion Rush/ }).click()
  await page.waitForTimeout(1400)
})

// 9 · Sign in — optional accounts + verified scores
await shot('signin', async (page) => {
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForTimeout(700)
})

await browser.close()
console.log('done')
