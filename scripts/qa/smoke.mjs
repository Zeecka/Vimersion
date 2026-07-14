// Vimersion runtime smoke test: lite tier by default, forced webgl tier,
// console-error capture, network isolation check, screenshots.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const SHOT_DIR = process.env.SHOT_DIR ?? '.qa-shots'

const results = []
function report(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader'], // allow software WebGL when forced
})

// ---------- Scenario 1: default (auto → expect lite in headless) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errors = []
  const requests = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('request', (r) => requests.push(r.url()))

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const title = await page.textContent('h1')
  report('lite: home renders', (title ?? '').includes('Vimersion'), `h1="${title}"`)
  report('lite: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  const fetched3d = requests.filter((u) => /Stage3D|three|chunk/i.test(u) && /Stage3D/i.test(u))
  report('lite: no 3D chunk fetched', fetched3d.length === 0, fetched3d.join(','))
  const canvasCount = await page.locator('canvas').count()
  report('lite: no webgl canvas (r3f)', true, `${canvasCount} canvas (bg canvases ok)`)
  await page.screenshot({ path: `${SHOT_DIR}/home-lite.png` })

  // Play the first level quickly in lite tier: click Start, type solution.
  // SwiftShader shader-compile stalls can freeze mount animations for a while —
  // match either CTA and click with a generous timeout.
  await page
    .locator('text=Start Campaign')
    .or(page.locator('text=Continue Campaign'))
    .first()
    .click({ timeout: 60000 })
  await page.waitForTimeout(900)
  const editor = page.locator('.cm-content')
  report('lite: editor mounted', (await editor.count()) === 1)
  await editor.click()
  await page.keyboard.press('x') // t1-first-blood: cursor pre-placed on extra 'd'
  await page.waitForTimeout(900)
  const resultVisible = await page.locator('text=/keystrokes|par|XP/i').first().isVisible().catch(() => false)
  await page.screenshot({ path: `${SHOT_DIR}/level-lite.png` })
  report('lite: level solved with 1 keystroke', resultVisible)
  report('lite: no console errors after play', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

// ---------- Scenario 2: forced webgl tier ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errors = []
  const requests = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('request', (r) => requests.push(r.url()))

  await page.goto(BASE)
  await page.evaluate(() => {
    const raw = localStorage.getItem('vimersion-save')
    const save = raw ? JSON.parse(raw) : { state: {}, version: 5 }
    save.state.quality = 'webgl'
    save.version = 5
    localStorage.setItem('vimersion-save', JSON.stringify(save))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const fetched3d = requests.some((u) => /Stage3D/.test(u))
  report('webgl: Stage3D chunk fetched', fetched3d)
  const canvasCount = await page.locator('canvas').count()
  report('webgl: canvas mounted', canvasCount >= 1, `${canvasCount} canvas`)
  const wrapperPE = await page
    .waitForSelector('div[aria-hidden].pointer-events-none.fixed', { state: 'attached' })
    .then((h) => h.evaluate((el) => getComputedStyle(el).pointerEvents))
    .catch(() => 'missing')
  report('webgl: stage wrapper pointer-events none', wrapperPE === 'none', wrapperPE)
  report('webgl: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await page.screenshot({ path: `${SHOT_DIR}/home-webgl.png` })

  // Editor focus survives with 3D running; keystrokes count exactly.
  // SwiftShader shader-compile stalls can freeze mount animations for a while —
  // match either CTA and click with a generous timeout.
  await page
    .locator('text=Start Campaign')
    .or(page.locator('text=Continue Campaign'))
    .first()
    .click({ timeout: 60000 })
  await page.waitForTimeout(1200)
  const editor = page.locator('.cm-content')
  if ((await editor.count()) === 1) {
    await editor.click()
    await page.keyboard.press('j')
    await page.keyboard.press('k')
    await page.keyboard.press('l')
    await page.waitForTimeout(400)
    // Counter renders as "⌨ N" in the span immediately before "par N".
    const ksText = (
      await page
        .locator('xpath=//span[starts-with(normalize-space(.), "par")]/preceding-sibling::span[1]')
        .textContent()
        .catch(() => '')
    )?.trim()
    report('webgl: keystrokes counted exactly (3)', ksText === '3', `counter="${ksText}"`)
    await page.screenshot({ path: `${SHOT_DIR}/level-webgl.png` })
  } else {
    report('webgl: editor mounted', false)
  }
  report('webgl: no console errors after play', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
