// Shared setup for the Playwright QA suites. Makes each page hermetic against
// two things the suites don't intend to exercise, so they run green against a
// bare `npm run preview` with no backend:
//
//  1. The accounts backend. `vite preview` proxies /api to a localhost server
//     that isn't running in QA, so /api/config 502s — and Chromium logs every
//     failed resource load as a console error, tripping the "no console errors"
//     checks. We fulfil /api ourselves as a no-accounts deployment (an empty
//     provider list → the app cleanly enters offline mode), which is a real,
//     supported configuration (static hosting with no /api at all).
//
//  2. The first-run "How to play" primer. It auto-opens for a brand-new player
//     and its full-screen overlay intercepts the Start-Campaign / world-map
//     clicks. We pre-set its "seen" flag so it stays closed. The primer's own
//     behaviour (and the focus hand-off around it) is covered by focus.mjs.
export async function prepPage(page) {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ providers: [] }) }),
  )
  await page.addInitScript(() => {
    try {
      localStorage.setItem('vimlegends-seen-intro', '1')
    } catch {
      /* storage disabled — the primer will just show; individual suites cope */
    }
  })
}
