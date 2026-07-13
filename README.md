# :Vimersion

**Learn Vim by playing.** A free, open-source browser game that teaches the Vim editor and
its motions/commands through real, gamified practice — real editor, real keystrokes, real
muscle memory.

Unlike maze-style games, every challenge runs inside a **real CodeMirror editor with genuine
Vim keybindings**, so the skills transfer directly to actual Vim/Neovim.

## Features

- **Campaign** — bite-sized, mastery-gated challenges inside a real Vim editor, organized
  into six worlds: *Survive* (modes, motion, first edits), *Comfortable* (words, lines,
  jumps), *Faster* (operators, text objects, visual), *Seeker* (search, `:s`, marks),
  *Superpowers* (registers, macros, the dot) and *Legend* (`:g`, `:sort`, power idioms).
  Worlds 1–2 are fully built; the rest are landing tier by tier.
- **Boss levels** — multi-stage fights in a single buffer with a **keystroke budget** as the
  boss HP bar. Stages ratchet (undo can't rewind a cleared stage); failing costs nothing but
  a retry. World 1 ends at **The Gatekeeper**.
- **"Nightglass" 3D look** — a real-time WebGL world (react-three-fiber, cel-shaded low-poly,
  selective bloom) behind smoked-glass UI panels, with an **animated 3D hero** that idles,
  fights while you type, and celebrates your wins. Heavy assets are lazy-loaded: first paint
  and editor latency are untouched, and the whole 3D stack is skipped in the lite tier.
- **Quality tiers** — `Auto / 3D / Lite` (FX toggle in the HUD). Auto detection prefers lite
  on reduced-motion, low-memory, or software-GL devices; lite mode is the original
  procedural SVG/CSS art, fully featured. `prefers-reduced-motion` is respected everywhere.
- **VimGolf-style scoring** — every keystroke counts; beat *par* for 3 stars.
- **XP, levels & a streak** — White-Hat gamification (progress & accomplishment), no dark
  patterns.
- **Command Belt** — your growing collection of mastered commands.
- **Motion Rush** — an arcade Whack-a-Mole that drills `hjkl` navigation speed with combos.
- **Progress saved locally** — no account, no backend, **works fully offline** (fonts and
  models are self-hosted; saves migrate across versions automatically).

## Tech stack

React + TypeScript + Vite · CodeMirror 6 + `@replit/codemirror-vim` · three.js +
`@react-three/fiber` v8 + drei (lazy-loaded) · Zustand (+ localStorage) · Tailwind CSS v4 ·
Framer Motion · Web Audio (synth SFX) · Vitest.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the built app
npm run test       # vitest: content integrity + par validation with real vim keys
npm run typecheck
```

Static build — deploy `dist/` to Netlify, Vercel, or GitHub Pages. No special hosting headers
required (we use CodeMirror's Vim keymap, not WASM Vim, so no cross-origin isolation needed).

## Testing

- `tests/content.test.ts` — content integrity: unique ids, taught commands resolve, pars
  positive, cursors in bounds, boss budgets sane.
- `tests/par.test.ts` — the **par validator**: reference solutions are driven through a real
  `EditorView` + vim keymap (`Vim.handleKey`) and must solve each challenge at ≤ par. Also
  unit-tests the vim-state goal checkers (registers, marks, modes, macro recording) and the
  visual-block multi-selection fix. **Every new challenge must add its reference solution.**
- `scripts/qa/` — **browser QA suites** (Playwright, real Chromium): quality-tier isolation,
  boss flow, save migration, offline-readiness. `npm run build && npm run preview`, then
  `npm run qa` (36 checks). See `scripts/qa/README.md`.
- Bundle discipline: the sync `index` chunk stays 3D-free (~265 KB gz); the 3D graph lives in
  async chunks (~230 KB gz) fetched only in the webgl tier; `hero.glb` is ~180 KB.

## Asset pipeline (3D)

The hero model is stored raw in `assets-src/` and optimized into `public/models/`:

```bash
npx @gltf-transform/cli optimize assets-src/RobotExpressive.glb public/models/hero.glb \
  --compress meshopt --texture-compress webp
```

Meshopt-compressed glTF decodes via `three-stdlib` (no COOP/COEP headers, no Draco/KTX2
decoders needed at this budget). Environments are procedural three.js geometry with a shared
toon gradient ramp (`src/three/toon.ts`) — no downloads.

## Roadmap

- **Done:** Worlds 1–2, Motion Rush, Nightglass 3D vertical slice (3D stage + hero +
  Level-1 scene), boss mechanic + The Gatekeeper, vim-state verification layer, quality
  tiers + save migration.
- **Next (alternating content/visual/mechanics phases):** fill World 3 *Faster* and
  World 4 *Seeker* → 3D rollout to Map/Shop/Results + per-world environments → overworld
  map, achievements, daily quests, spaced-repetition review, economy re-tune → Worlds 5–6 +
  plugin "Concepts" cards.
- **Later:** golf mode + leaderboard, onboarding, remappable keys, optional accounts.

## Project layout

```
src/
  editor/      VimEditor (CM6 + vim + instrumentation, stage ratchet), theme/extensions
  game/        types, command catalog, XP curve, verify.ts (vim-state goal checkers),
               quality tiers, Zustand store (versioned saves), Web-Audio SFX
  content/     challenges as declarative data (tier1-3.ts, bosses.ts), world metadata
  modes/       CampaignMode (incl. boss flow), ArcadeMode
  three/       Stage3D underlay canvas, Hero3D, toon helpers, scene registry (lazy chunk)
  ui/          Hud, XPBar, WorldMap, ResultScreen, CommandBelt, HeroPanel, atoms
tests/         vitest: content integrity, par validator, vim-state checker units
assets-src/    raw 3D sources (not shipped) — see Asset pipeline
```

## Customization

Earn **coins** by playing, then spend them in the **Shop** on:
- **Characters** — your avatar across the app and as the arcade cursor.
- **Themes** — recolor the whole game (UI + editor cursor + 3D accents) live. *Nightglass*
  electric-violet is the default; the classic *Phosphor Green* is free to re-equip.
- **Backgrounds** — lite-tier scenes: side-scrolling **Pixel Kingdom**, CRT, Aurora,
  Synthwave, Nebula, Cyber City, Starfield, and Digital Rain (all animated).

## Credits

- **3D hero** is based on **"RobotExpressive"** by Tomás Laulhé (CC0, via the
  [three.js examples](https://github.com/mrdoob/three.js); modifications by Don McCurdy),
  meshopt-optimized and re-shaded with the game's toon ramp.
- **2D characters** are generated with [DiceBear](https://www.dicebear.com/) (styles: bottts,
  pixel-art, adventurer, fun-emoji, thumbs) at build time via `scripts/gen-characters.mjs`
  and bundled as static SVGs (offline, no runtime dependency).
- **UI glyphs** use [Twemoji](https://github.com/jdecked/twemoji) by Twitter/jdecked
  ([CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)), bundled locally so they render
  on every system.
- **Fonts**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) and
  [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (both OFL), self-hosted via Fontsource.
- **Lite backgrounds** are original CSS/SVG/canvas parallax scenes; 3D environments are
  original procedural three.js scenes.

Game concept & code are free & open source.

Built with real Vim keybindings.
