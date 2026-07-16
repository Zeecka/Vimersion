# Browser QA suites (Playwright)

End-to-end checks against a real Chromium, complementing the vitest unit/par tests.
They expect the production build served at `http://localhost:4173`:

```bash
npm run build && npm run preview   # terminal 1
npm run qa                         # terminal 2 — runs all three suites
```

- **`smoke.mjs`** — both quality tiers: lite renders with ZERO 3D bytes fetched; webgl
  mounts the Stage3D canvas as a non-interactive underlay; editor focus and exact
  keystroke counting survive with 3D running.
- **`focus.mjs`** — the editor never goes silently deaf: after clicking dead space (page
  background, level brief, hint/restart/cheatsheet), Vim keys still land — and the
  watchdog doesn't over-reach (open modals keep focus, Tab still escapes to the toolbar).
- **`boss.mjs`** — The Gatekeeper: stage ratchet, undo can't regress a stage, budget
  exhaustion → fail overlay, free retry resets, win at par.
- **`qa.mjs`** — v4→v10 save migration (progress/coins/theme preserved), t3-ciw
  playthrough at ≤ par, offline-readiness (zero external requests).

Screenshots land in `.qa-shots/` (gitignored). `BASE_URL` / `SHOT_DIR` env vars override.

No backend needed: `harness.mjs`'s `prepPage(page)` stubs `/api` as a no-accounts
deployment (so the proxy's 502 never trips the console-error checks) and pre-sets the
first-run primer's "seen" flag (so its overlay never intercepts the Start/map clicks).
Every suite that navigates the app calls it right after `newPage()`.

Gotchas (learned the hard way — see also tests/driver.ts):
- **Never `.click()` the editor** — it moves the vim cursor; the editor auto-focuses on
  mount, just `keyboard.type()`.
- Headless WebGL needs `--enable-unsafe-swiftshader` and `quality: 'webgl'` forced via
  the seeded save (auto-detect correctly picks lite under SwiftShader).
- Allow ~2.5s settle after opening a level in the webgl tier (shader-compile stalls).
