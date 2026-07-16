// Focus regression: the editor must never go silently deaf during a level.
//
// The bug this pins: clicking dead space on the play screen (the page
// background, the level brief, the hero panel) blurs the editor to <body>, and
// from there every Vim keystroke is swallowed — the level looks frozen with no
// visible cause. CampaignMode's focus watchdog hands focus back whenever it
// lands on nothing. These checks prove keys keep landing after such clicks,
// AND that the watchdog does NOT over-reach (open modals keep focus, Tab still
// escapes the editor to the toolbar).
import { chromium } from 'playwright'
import { prepPage } from './harness.mjs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'

const results = []
const report = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })

// The in-play keystroke counter (the span just before "par N"). Its Emoji is an
// <img alt="">, so textContent is exactly the number — 0 until a key lands.
const counter = async (page) =>
  (
    await page
      .locator('xpath=//span[starts-with(normalize-space(.), "par")]/preceding-sibling::span[1]')
      .textContent()
      .catch(() => '')
  )?.trim()

// A short signature of document.activeElement, e.g. "div[role=dialog].panel".
const activeTag = (page) =>
  page.evaluate(() => {
    const a = document.activeElement
    if (!a) return 'none'
    const role = a.getAttribute && a.getAttribute('role')
    const cls = a.className ? '.' + String(a.className).split(' ')[0] : ''
    return `${a.tagName.toLowerCase()}${role ? `[role=${role}]` : ''}${cls}`
  })

// Fresh context → World 1 Level 2 (Home Row Hero), reached by seeding level 1 as
// done and opening it from the world map. (Seeding beats playing level 1 live:
// no dependence on mount-animation timing for the opening keystroke to land.)
// Lite tier keeps it snappy — this test is about focus, not 3D. The editor
// auto-focuses on mount, so the counter reads 0 with keys already landing.
const SEED = {
  state: { completed: { 't1-first-blood': { keystrokes: 1, par: 1, stars: 3, xp: 75 } }, xp: 75, quality: 'lite' },
  version: 5,
}
async function toLevel2() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  await prepPage(page)
  await page.goto(BASE)
  await page.evaluate((s) => localStorage.setItem('vimersion-save', JSON.stringify(s)), SEED)
  await page.reload()
  await page.click('header button[title="World map"]')
  await page.waitForTimeout(600)
  await page.locator('text=Home Row Hero').first().click({ timeout: 60000 })
  await page.waitForSelector('.cm-content')
  await page.waitForTimeout(600)
  return { ctx, page }
}

// After each dead-space interaction, one 'l' must register (counter 0 → 1).
// Restart remounts the editor, resetting the counter to 0 first — same 0 → 1.
const deadSpace = {
  'click page background': (page) => page.mouse.click(60, 700),
  'click the level brief': (page) => page.locator('h2').first().click(),
  'click "Need a hint?"': (page) => page.locator('button', { hasText: /Need a hint/ }).click(),
  'open + close Commands cheatsheet': async (page) => {
    await page.locator('button', { hasText: /Commands/ }).first().click()
    await page.waitForTimeout(700)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(700)
  },
  'click Restart': (page) => page.locator('button', { hasText: /Restart/ }).click(),
}

for (const [name, act] of Object.entries(deadSpace)) {
  const { ctx, page } = await toLevel2()
  try {
    await act(page)
    await page.waitForTimeout(300)
    await page.keyboard.press('l')
    await page.waitForTimeout(300)
    const c = await counter(page)
    report(`keys land after: ${name}`, c === '1', `counter="${c}"`)
  } catch (e) {
    report(`keys land after: ${name}`, false, String(e).split('\n')[0])
  }
  await ctx.close()
}

// Over-reach guards: the watchdog must leave real focus targets alone.
{
  const { ctx, page } = await toLevel2()
  try {
    await page.locator('button', { hasText: /Commands/ }).first().click()
    await page.waitForTimeout(800)
    const open = await activeTag(page)
    report('open modal keeps focus (not yanked to editor)', /role=dialog/.test(open), open)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(700)
    const closed = await activeTag(page)
    report('editor refocused after modal close', closed.includes('cm-content'), closed)

    await page.keyboard.press('Tab')
    await page.waitForTimeout(300)
    const tabbed = await activeTag(page)
    report('Tab still escapes editor to toolbar', tabbed.startsWith('button'), tabbed)
  } catch (e) {
    report('over-reach guards', false, String(e).split('\n')[0])
  }
  await ctx.close()
}

// End to end: a level stays solvable after focus was lost to dead space.
{
  const { ctx, page } = await toLevel2()
  try {
    await page.mouse.click(60, 700) // lose focus to the background…
    await page.waitForTimeout(300)
    await page.locator('button', { hasText: /Restart/ }).click() // …reset cursor (clicking the editor would move it)
    await page.waitForTimeout(700)
    for (const k of ['j', 'l', 'l', 'l', 'l']) {
      await page.keyboard.press(k)
      await page.waitForTimeout(150)
    }
    await page.waitForTimeout(700)
    report('level 2 still solvable after dead-space click', await page.locator('text=PERFECT!').isVisible().catch(() => false))
  } catch (e) {
    report('level 2 still solvable after dead-space click', false, String(e).split('\n')[0])
  }
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
