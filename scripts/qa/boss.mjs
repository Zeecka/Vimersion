// Boss-flow test: stage ratchet, undo immunity, budget fail + free retry.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const T1 = ['t1-first-blood', 't1-navigate', 't1-insert', 't1-append', 't1-delete-line', 't1-undo', 't1-open-line', 't1-capstone']

const results = []
const report = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const SEED = {
  state: {
    completed: Object.fromEntries(T1.map((id) => [id, { keystrokes: 5, par: 5, stars: 3, xp: 75 }])),
    xp: 600,
    quality: 'lite',
  },
  version: 5,
}

async function openBoss(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE)
  await page.evaluate((seed) => localStorage.setItem('vimersion-save', JSON.stringify(seed)), SEED)
  await page.reload()
  await page.click('text=world map')
  await page.waitForTimeout(400)
  await page.click('text=The Gatekeeper')
  await page.waitForTimeout(800)
  return { ctx, page, errors }
}

const browser = await chromium.launch()

// ---------- Win path with mid-fight undo (ratchet check) ----------
{
  const { ctx, page, errors } = await openBoss(browser)
  const pip = (n) => page.getByText(`${n}/3`, { exact: true })
  report('boss: opens with stage 1/3', await pip(1).waitFor({ state: 'visible' }).then(() => true).catch(() => false))
  const bar = page.locator('text=Boss integrity')
  report('boss: HP bar visible', await bar.isVisible().catch(() => false))



  await page.keyboard.type('dddd') // stage 1: delete both SPAM lines
  await page.waitForTimeout(300)
  report('boss: stage 2 after dd dd', await pip(2).isVisible().catch(() => false))

  await page.keyboard.press('u') // undo restores a SPAM line…
  await page.waitForTimeout(250)
  report('boss: undo cannot regress stage (ratchet)', await pip(2).isVisible().catch(() => false))
  await page.keyboard.type('dd') // …delete it again (redo-free path)

  await page.keyboard.type('$ie') // fix aslep → asleep
  await page.keyboard.press('Escape')
  await page.keyboard.type('jx') // lockedd → locked
  await page.waitForTimeout(300)
  report('boss: stage 3 after typo fixes', await pip(3).isVisible().catch(() => false))

  await page.keyboard.type('oonward!')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  report('boss: BOSS DEFEATED shown', await page.locator('text=BOSS DEFEATED!').isVisible().catch(() => false))
  const panelText = (await page.locator('.panel', { hasText: 'BOSS DEFEATED!' }).textContent().catch(() => '')) ?? ''
  // Exact-text goals complete the moment the buffer matches (still in insert
  // mode — the final Esc never lands): 21 = par even with the undo detour.
  report('boss: solved at 21 keystrokes = par (3★)', /keystrokes\s*21/.test(panelText) && panelText.includes('★★★'), panelText.slice(0, 60))
  report('boss: no console errors (win path)', errors.length === 0, errors.slice(0, 2).join(' | '))
  await ctx.close()
}

// ---------- Fail path: budget exhaustion + free retry ----------
{
  const { ctx, page, errors } = await openBoss(browser)


  // 48 harmless motions blow the 47-keystroke budget without winning.
  for (let i = 0; i < 48; i++) await page.keyboard.press(i % 2 ? 'j' : 'k')
  await page.waitForTimeout(400)
  report('boss: REPELLED overlay on budget exhaustion', await page.locator('text=REPELLED!').isVisible().catch(() => false))
  await page.click('text=⟳ Retry')
  await page.waitForTimeout(600)
  const counter = (
    await page
      .locator('xpath=//span[starts-with(normalize-space(.), "par")]/preceding-sibling::span[1]')
      .textContent()
      .catch(() => '')
  )?.trim()
  report('boss: retry resets keystrokes to 0', counter === '0', `counter="${counter}"`)
  report('boss: overlay gone after retry', !(await page.locator('text=REPELLED!').isVisible().catch(() => true)))
  report('boss: no console errors (fail path)', errors.length === 0, errors.slice(0, 2).join(' | '))
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
