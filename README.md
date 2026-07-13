# :Vimersion

**Learn Vim by playing.** A free, open-source browser game that teaches the Vim editor and
its motions/commands through real, gamified practice — real editor, real keystrokes, real
muscle memory.

Unlike maze-style games, every challenge runs inside a **real CodeMirror editor with genuine
Vim keybindings**, so the skills transfer directly to actual Vim/Neovim.

## Features (MVP — Tier 1 "Survive")

- **Campaign** — bite-sized, mastery-gated challenges inside a real Vim editor. Teaches
  modes (`i`/`a`/`o`/`Esc`), motion (`hjkl`), and first edits (`x`, `dd`, `u`). Every level
  has its **own illustrated scene** behind the editor (volcano, ocean, neon city, sky
  temple, …) — all procedural SVG, dimmed so code stays legible.
- **VimGolf-style scoring** — every keystroke counts; beat *par* for 3 stars.
- **XP, levels & a streak** — White-Hat gamification (progress & accomplishment), no dark
  patterns.
- **Command Belt** — your growing collection of mastered commands.
- **Motion Rush** — an arcade Whack-a-Mole that drills `hjkl` navigation speed with combos.
- **Progress saved locally** — no account, no backend, works offline.
- **Retro-terminal aesthetic** — VT323 + JetBrains Mono, phosphor-green CRT theme, chiptune
  SFX synthesized in-browser (no audio assets).

## Tech stack

React + TypeScript + Vite · CodeMirror 6 + `@replit/codemirror-vim` · Zustand (+ localStorage)
· Tailwind CSS v4 · Framer Motion · Web Audio (synth SFX).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the built app
```

Static build — deploy `dist/` to Netlify, Vercel, or GitHub Pages. No special hosting headers
required (we use CodeMirror's Vim keymap, not WASM Vim, so no cross-origin isolation needed).

## Roadmap

- **Now:** Tier 1 campaign + Motion Rush arcade.
- **Next:** Tiers 2–4 (words/jumps → operators & text objects → macros/marks/dot), a
  spaced-repetition review scheduler, more arcade drills, achievements.
- **Later:** Golf mode + leaderboard, onboarding, accessibility (remappable keys), optional
  accounts/backend.

## Project layout

```
src/
  editor/      VimEditor (CM6 + vim + instrumentation), theme/extensions
  game/        types, command catalog, XP curve, Zustand store, Web-Audio SFX
  content/     challenges as declarative data (tier1.ts), world metadata
  modes/       CampaignMode, ArcadeMode
  ui/          Hud, XPBar, WorldMap, ResultScreen, CommandBelt, atoms
```

## Customization

Earn **coins** by playing, then spend them in the **Shop** on:
- **Characters** — your avatar across the app and as the arcade cursor.
- **Themes** — recolor the whole game (UI + editor cursor) live.
- **Backgrounds** — a side-scrolling **Pixel Kingdom** (multi-layer parallax, the default),
  plus CRT, Aurora, Synthwave, Nebula, Cyber City, Starfield, and Digital Rain (all animated).

## Credits

- **Characters** are generated with [DiceBear](https://www.dicebear.com/) (styles: bottts,
  pixel-art, adventurer, fun-emoji, thumbs) at build time via `scripts/gen-characters.mjs`
  and bundled as static SVGs (offline, no runtime dependency).
- **UI glyphs** use [Twemoji](https://github.com/jdecked/twemoji) by Twitter/jdecked
  ([CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)), bundled locally so they render
  on every system.
- **Backgrounds** are original CSS/SVG/canvas parallax scenes.

Game concept & code are free & open source.

Built with real Vim keybindings.
