import { useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { useFrame } from '@react-three/fiber'
import { ScreenQuad } from '@react-three/drei'
import * as THREE from 'three'

/**
 * WebGL backdrops for the equipped "background" cosmetic — one fullscreen
 * procedural-shader quad per id, rendered INSIDE the Stage3D <Canvas> as the
 * modern upgrade of the CSS fallbacks in src/ui/Background.tsx.
 *
 * Contract (wired in by Stage3D):
 * - `BACKDROPS[bgId]` → component taking `{ accent }` (theme accent hex).
 * - 'platform' is intentionally absent: the floating-islands AmbientScene
 *   stays as that background and Stage3D falls back to it.
 * - Each quad draws first (renderOrder −1000, no depth read/write) so any
 *   scene geometry rendered afterwards paints over it.
 *
 * Conventions:
 * - uTime advances by delta clamped to ≤0.05 (AmbientScene convention) so a
 *   background-tab resume doesn't jump.
 * - Renderer is NoToneMapping + sRGB output: every fragment shader ends with
 *   three's `#include <colorspace_fragment>`, so all literal colors below are
 *   emitted in *linear* space (see `lin()`).
 * - iGPU budget: no textures, value-noise fbm ≤ 4 octaves, tiny fixed loops.
 * - UI panels + the editor sit on top: shaders stay dark, keep the center
 *   calm and apply `grade()` (vignette + top-down scrim) for HUD legibility.
 */

export interface BackdropProps {
  /** Current theme accent, hex like '#7c6bff'. */
  accent: string
}

/** Hex (sRGB) → linear-space GLSL vec3 literal, matching the working color
 *  space three uploads uniforms in. Keeps palettes identical to the CSS tier. */
function lin(hex: string): string {
  const c = new THREE.Color(hex) // string setter applies sRGB→linear
  const f = (n: number) => n.toFixed(5)
  return `vec3(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`
}

/* ------------------------------------------------------------------------ */
/* GLSL                                                                      */
/* ------------------------------------------------------------------------ */

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`

/** Shared uniforms + helper library prepended to every fragment shader. */
const COMMON = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform vec3 uAccent;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
float fbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + 19.19;
    a *= 0.5;
  }
  return v;
}
/* Sparse twinkling star specks; caller pre-scales p so one cell ~ one slot. */
float starsAt(vec2 p, float density, float t) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float h = hash12(cell);
  float on = step(1.0 - density, h);
  vec2 sp = vec2(hash12(cell + 7.13), hash12(cell + 3.71)) * 0.7 + 0.15;
  float d = length(f - sp);
  float tw = 0.55 + 0.45 * sin(t * (1.0 + 4.0 * h) + h * 41.0);
  return on * tw * (1.0 - smoothstep(0.0, 0.10, d));
}
/* 1 when a <= x < b, else 0. */
float inRange(float x, float a, float b) {
  return step(a, x) * (1.0 - step(b, x));
}
/* Readability grade: gentle vignette + top-down scrim so HUD text stays crisp. */
vec3 grade(vec3 col, vec2 uv) {
  vec2 q = uv - 0.5;
  float vig = 1.0 - 0.38 * smoothstep(0.18, 0.95, dot(q, q) * 2.0);
  float top = 1.0 - 0.30 * smoothstep(0.55, 1.0, uv.y);
  return col * vig * top;
}
`

const frag = (body: string) => COMMON + body

/* -- crt: near-black indigo terminal, accent glow, grid floor, scanlines -- */
const CRT_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  vec3 col = ${lin('#070a11')};

  // accent-tinted glow bleeding down from the top (CSS: radial at 50% -15%)
  float glow = exp(-2.4 * length((uv - vec2(0.5, 1.18)) * vec2(0.8 * uAspect, 1.35)));
  col += uAccent * glow * 0.22;

  // faint star specks, two depths
  col += vec3(0.85, 0.90, 1.0) * starsAt(p * 22.0, 0.05, uTime) * 0.16;
  col += uAccent * starsAt(p * 12.0 + 31.7, 0.04, uTime * 0.8) * 0.14;

  // slow-scrolling perspective grid floor
  float hz = 0.30;
  float depth = max(hz - uv.y, 1e-4);
  vec2 gp = vec2(p.x * (0.9 / depth), 0.16 / depth + uTime * 0.55);
  vec2 gf = abs(fract(gp) - 0.5);
  vec2 aa = max(fwidth(gp) * 1.2, vec2(1e-4));
  float gridLine = max(1.0 - smoothstep(0.0, aa.x, gf.x), 1.0 - smoothstep(0.0, aa.y, gf.y));
  float gmask = step(uv.y, hz) * smoothstep(0.0, 0.10, depth);
  col += uAccent * gridLine * gmask * 0.13;

  // scanlines + very subtle flicker
  col *= 0.95 + 0.05 * sin(uv.y * 640.0);
  col *= 0.985 + 0.015 * hash11(floor(uTime * 8.0));

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* -- aurora: drifting fbm ribbons over a star-flecked night sky ----------- */
const AURORA_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime;
  vec3 col = mix(${lin('#0a0e14')}, ${lin('#060a16')}, uv.y);

  col += vec3(0.80, 0.85, 0.95) * starsAt(p * 24.0, 0.04, t) * 0.35;

  // shared curtain texture: vertical rays drifting sideways
  float rays = 0.55 + 0.45 * vnoise(vec2(uv.x * 26.0 - t * 0.12, uv.y * 3.0));

  { // green ribbon
    float w = fbm4(vec2(uv.x * 1.4 + t * 0.020, 3.1 + t * 0.012));
    float env = 0.25 + 0.75 * vnoise(vec2(uv.x * 1.8 + 5.2, t * 0.025));
    float d = (uv.y - (0.72 + (w - 0.5) * 0.85)) * 7.0;
    col += ${lin('#3ddc84')} * exp(-d * d) * rays * env * 0.30;
  }
  { // cyan ribbon
    float w = fbm4(vec2(uv.x * 1.7 - t * 0.016 + 11.7, 8.4 + t * 0.010));
    float env = 0.25 + 0.75 * vnoise(vec2(uv.x * 2.2 + 19.4, 4.0 - t * 0.020));
    float d = (uv.y - (0.58 + (w - 0.5) * 0.75)) * 8.0;
    col += ${lin('#59c2ff')} * exp(-d * d) * rays * env * 0.24;
  }
  { // violet ribbon
    float w = fbm4(vec2(uv.x * 1.2 + t * 0.013 + 23.3, 15.9 - t * 0.008));
    float env = 0.25 + 0.75 * vnoise(vec2(uv.x * 1.5 + 33.7, 9.0 + t * 0.022));
    float d = (uv.y - (0.44 + (w - 0.5) * 0.70)) * 6.5;
    col += ${lin('#b78cff')} * exp(-d * d) * rays * env * 0.18;
  }

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* -- synthwave: dusk gradient, striped sun, ridged mountains, neon grid --- */
const SYNTHWAVE_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime;
  float hz = 0.34; // grid horizon

  // dusk gradient (CSS: #180b2e → #2d1b4e → #6b2d5c → #c94b7b → #ff9e64)
  vec3 sky = mix(${lin('#ff9e64')}, ${lin('#c94b7b')}, smoothstep(hz - 0.02, hz + 0.10, uv.y));
  sky = mix(sky, ${lin('#6b2d5c')}, smoothstep(hz + 0.06, hz + 0.28, uv.y));
  sky = mix(sky, ${lin('#2d1b4e')}, smoothstep(hz + 0.22, hz + 0.52, uv.y));
  sky = mix(sky, ${lin('#180b2e')}, smoothstep(hz + 0.45, 1.0, uv.y));
  vec3 col = sky;

  // striped retro sun above the horizon
  vec2 sc = vec2(p.x, uv.y - (hz + 0.185));
  float sd = length(sc);
  float R = 0.155;
  vec3 sunCol = mix(${lin('#ffe66d')}, ${lin('#ff6ac1')}, 1.0 - smoothstep(-0.06, 0.10, sc.y));
  sunCol = mix(sunCol, ${lin('#a83279')}, 1.0 - smoothstep(-0.15, -0.05, sc.y));
  float stripeBand = inRange(sc.y, -1.0, -0.005) * (1.0 - step(0.42, fract((sc.y + t * 0.015) * 30.0)));
  float disc = (1.0 - smoothstep(R - 0.006, R, sd)) * (1.0 - stripeBand);
  col += ${lin('#ff6ac1')} * exp(-sd * 6.0) * 0.28; // halo
  col = mix(col, sunCol, disc * step(hz, uv.y));

  // ridged-noise mountain silhouette
  float ridge = 1.0 - abs(2.0 * fbm4(vec2(uv.x * 3.0, 4.7)) - 1.0);
  float mh = hz + 0.015 + 0.11 * ridge;
  float mnt = step(uv.y, mh) * step(hz, uv.y);
  vec3 mcol = ${lin('#3a1150')} * (0.70 + 0.30 * smoothstep(hz, mh, uv.y));
  col = mix(col, mcol, mnt);

  // scrolling neon perspective grid with glow
  float depth = max(hz - uv.y, 1e-4);
  vec2 gp = vec2(p.x * (1.1 / depth), 0.18 / depth + t * 0.9);
  vec2 gf = abs(fract(gp) - 0.5);
  vec2 aa = max(fwidth(gp) * 1.3, vec2(1e-4));
  float fade = smoothstep(0.0, 0.06, depth);
  vec3 floorCol = ${lin('#180b2e')} + ${lin('#ff9e64')} * exp(-depth * 9.0) * 0.38;
  floorCol += ${lin('#59c2ff')} * ((1.0 - smoothstep(0.0, aa.x, gf.x)) * 0.55 + exp(-gf.x * 7.0) * 0.10) * fade;
  floorCol += ${lin('#ff6ac1')} * ((1.0 - smoothstep(0.0, aa.y, gf.y)) * 0.60 + exp(-gf.y * 7.0) * 0.11) * fade;
  col = mix(col, floorCol, step(uv.y, hz));

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* -- starfield: warp streaks streaming outward from center ---------------- */
const STARFIELD_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  vec2 q = (uv - 0.5) * vec2(uAspect, 1.0);
  q.x += 1e-5; // atan(0,0) guard at the exact center
  float r = length(q);
  float ang = atan(q.y, q.x) * 0.15915494 + 0.5; // → 0..1
  float t = uTime;
  vec3 col = ${lin('#05070d')};

  // dim static far stars
  col += vec3(0.70, 0.75, 0.85) * starsAt(q * 28.0, 0.03, t * 0.6) * 0.22;

  // three layers of outward-streaming star streaks
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float n = 64.0 + 36.0 * fi;          // angular sectors this layer
    float s = ang * n;
    float id = floor(s) + fi * 917.0;
    float fa = fract(s) - 0.5;
    float h = hash11(id * 0.618 + fi * 0.113);
    float sOn = step(0.62, fract(h * 5.31)); // only ~40% of sectors carry a star
    float ph = fract(h * 9.7 + t * (0.05 + 0.06 * h + 0.02 * fi));
    float sr = mix(0.03, 1.25, ph * ph); // eased radius → accelerating warp
    float d = r - sr;
    float len = 0.04 + 0.16 * ph;        // longer streak when faster
    float tail = smoothstep(-len, -0.004, d) * (1.0 - smoothstep(0.0, 0.008, d));
    float thin = exp(-fa * fa * 150.0);
    float tw = 0.75 + 0.25 * sin(h * 40.0 + t * 3.0);
    float b = sOn * tail * thin * tw * (0.4 + 0.6 * ph) * (0.40 - 0.10 * fi);
    // every ~6th star takes the theme accent
    vec3 scol = mix(vec3(0.55, 0.60, 0.72), uAccent, step(0.8333, fract(h * 12.9898)));
    acc += scol * b;
  }
  // keep the very center (under the editor) calm
  col += acc * smoothstep(0.10, 0.45, r);

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* -- nebula: deep-space fbm color clouds + twinkling stars ----------------- */
const NEBULA_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime;
  vec3 col = ${lin('#0a0e14')};

  // indigo cast toward the upper left (CSS: radial at 28% 18%)
  vec2 cIndigo = (vec2(0.28, 0.82) - 0.5) * vec2(uAspect, 1.0);
  col = mix(col, ${lin('#1e1b4b')}, 0.65 * exp(-1.6 * length(p - cIndigo)));

  // two drifting fbm fields drive three color clouds
  float n1 = fbm4(p * 1.5 + vec2(t * 0.012, -t * 0.007));
  float n2 = fbm4(p * 2.2 - vec2(t * 0.009, t * 0.011) + 7.31);
  col += ${lin('#7c3aed')} * smoothstep(0.48, 0.90, n1) * 0.30;
  col += ${lin('#db2777')} * smoothstep(0.55, 0.95, n2) * 0.22;
  col += ${lin('#0ea5e9')} * smoothstep(0.50, 0.90, 0.5 * (n1 + 1.0 - n2)) * 0.20;

  // calm far stars + brighter twinkling near stars
  col += vec3(0.75, 0.80, 0.88) * starsAt(p * 26.0, 0.035, t * 0.5) * 0.30;
  col += vec3(1.0) * starsAt(p * 13.0 + 47.1, 0.03, t * 1.2) * 0.35;

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* -- cyber: parallax skyline silhouettes, lit windows, moon glow ----------- */
const CYBER_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime;

  // night sky (CSS: #0a0e14 → #101a2e → #2a0e3a top→bottom)
  vec3 col = mix(${lin('#101a2e')}, ${lin('#0a0e14')}, smoothstep(0.48, 1.0, uv.y));
  col = mix(${lin('#2a0e3a')}, col, smoothstep(0.0, 0.48, uv.y));

  col += vec3(0.62, 0.70, 0.78) * starsAt(p * 24.0, 0.035, t) * 0.30;

  // cool moon glow upper right
  vec2 moon = (vec2(0.79, 0.83) - 0.5) * vec2(uAspect, 1.0);
  float md = length(p - moon);
  col += ${lin('#59c2ff')} * (exp(-md * md * 26.0) * 0.38 + (1.0 - smoothstep(0.045, 0.055, md)) * 0.5);

  { // far skyline (slowest drift, tallest towers)
    float x = (uv.x + t * 0.0015) * 16.0;
    float h = 0.30 + 0.14 * pow(hash12(vec2(floor(x), 11.0)), 1.4);
    col = mix(col, ${lin('#241640')}, step(uv.y, h));
  }
  { // mid skyline with sparse lit windows
    float x = (uv.x + t * 0.004) * 11.0;
    float id = floor(x);
    float h = 0.26 + 0.13 * pow(hash12(vec2(id, 23.0)), 1.4);
    float m = step(uv.y, h);
    col = mix(col, ${lin('#1a1030')}, m);
    float wx = floor(fract(x) * 4.0);
    float wy = floor(uv.y * 64.0);
    vec2 wf = vec2(fract(fract(x) * 4.0), fract(uv.y * 64.0));
    float on = step(0.90, hash12(vec2(id * 13.7 + wx, wy + 37.0)));
    on *= step(0.05, hash12(vec2(id + wx * 3.1, wy) + floor(t * 0.7))); // rare blink
    float lit = inRange(wf.x, 0.25, 0.70) * inRange(wf.y, 0.30, 0.70);
    vec3 wcol = mix(${lin('#ff6ac1')}, ${lin('#59c2ff')}, step(0.5, hash12(vec2(wx + id * 7.0, wy * 3.0))));
    col += wcol * lit * on * m * step(uv.y, h - 0.015) * 0.55;
  }
  { // near skyline, darkest, denser windows
    float x = (uv.x + t * 0.008) * 7.0;
    float id = floor(x);
    float h = 0.20 + 0.16 * pow(hash12(vec2(id, 41.0)), 1.4);
    float m = step(uv.y, h);
    col = mix(col, ${lin('#120a24')}, m);
    float wx = floor(fract(x) * 5.0);
    float wy = floor(uv.y * 80.0);
    vec2 wf = vec2(fract(fract(x) * 5.0), fract(uv.y * 80.0));
    float on = step(0.88, hash12(vec2(id * 17.3 + wx, wy + 91.0)));
    on *= step(0.05, hash12(vec2(id + wx * 5.7, wy) + floor(t * 0.5)));
    float lit = inRange(wf.x, 0.25, 0.70) * inRange(wf.y, 0.30, 0.70);
    vec3 wcol = mix(${lin('#ff6ac1')}, ${lin('#59c2ff')}, step(0.5, hash12(vec2(wx * 9.0 + id, wy))));
    col += wcol * lit * on * m * step(uv.y, h - 0.015) * 0.65;
  }

  // faint scanlines
  col *= 0.96 + 0.04 * sin(uv.y * 520.0);

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* -- matrix: digital rain of procedural 3×5-bit glyphs --------------------- */
const MATRIX_FRAG = frag(/* glsl */ `
void main() {
  vec2 uv = vUv;
  float t = uTime;
  vec3 col = ${lin('#04070a')};

  // columns in aspect-corrected space so glyph cells stay square-ish
  float colW = 0.028;
  float x = uv.x * uAspect / colW;
  float ci = floor(x);
  float cx = fract(x);
  float hc = hash11(ci * 0.7311 + 0.137);

  // per-column fall speed, phase and tail length; some columns rest dim
  float speed = 0.10 + 0.22 * hc;
  float tailLen = 0.30 + 0.45 * hash11(ci * 1.933 + 7.7);
  float headY = 1.0 + tailLen - fract(hc * 13.7 + t * speed) * (1.35 + tailLen);
  float alive = 0.22 + 0.78 * step(0.30, fract(hc * 3.7));

  // glyph rows — brightness quantized per row so a whole glyph lights evenly
  float rowH = colW * 1.35;
  float ri = floor(uv.y / rowH);
  float cy = fract(uv.y / rowH);
  float dist = (ri + 0.5) * rowH - headY; // >0 above head = inside the tail
  float fall = exp(-max(dist, 0.0) * (3.0 / tailLen)) * step(0.0, dist);
  float head = inRange(dist, 0.0, rowH * 1.6);

  // procedural glyph: hashed 3×5 bit pattern, re-rolled a few times a second
  vec2 g = vec2(floor((cx - 0.12) / 0.76 * 3.0), floor((cy - 0.10) / 0.80 * 5.0));
  float inGlyph = inRange(cx, 0.12, 0.88) * inRange(cy, 0.10, 0.90);
  float tick = floor(t * (2.0 + 4.0 * fract(hc * 5.17)) + hc * 31.0);
  float bit = step(0.42, hash12(vec2(ci * 3.163 + g.x, ri * 7.731 + g.y * 3.0 + tick)));
  float glyph = bit * inGlyph;

  vec3 rain = uAccent * (fall * 0.48);
  rain = mix(rain, mix(uAccent, vec3(1.0), 0.6), head); // bright falling head
  col += rain * glyph * alive;
  col += uAccent * 0.012; // whisper of ambient tint so black isn't dead flat

  col = grade(col, uv);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`)

/* ------------------------------------------------------------------------ */
/* React components                                                          */
/* ------------------------------------------------------------------------ */

const FRAGMENTS: Record<string, string> = {
  crt: CRT_FRAG,
  aurora: AURORA_FRAG,
  synthwave: SYNTHWAVE_FRAG,
  starfield: STARFIELD_FRAG,
  nebula: NEBULA_FRAG,
  cyber: CYBER_FRAG,
  matrix: MATRIX_FRAG,
}

function makeBackdrop(id: string, fragmentShader: string): ComponentType<BackdropProps> {
  function Backdrop({ accent }: BackdropProps) {
    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          name: `backdrop-${id}`,
          vertexShader: VERTEX_SHADER,
          fragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uAspect: { value: 16 / 9 }, // sane pre-resize default, kept current in useFrame
            uAccent: { value: new THREE.Color(accent) }, // initial tint; accent deliberately not a dep
          },
          depthWrite: false,
          depthTest: false,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps -- accent updates in place below
      [fragmentShader],
    )
    useEffect(() => () => material.dispose(), [material])

    // Retint in place on theme change — never recreate the material.
    useEffect(() => {
      ;(material.uniforms.uAccent.value as THREE.Color).set(accent)
    }, [accent, material])

    useFrame((state, delta) => {
      // Clamped delta (AmbientScene convention): background-tab resume can't jump.
      material.uniforms.uTime.value += Math.min(delta, 0.05)
      material.uniforms.uAspect.value = state.size.width / Math.max(state.size.height, 1)
    })

    // Drawn first (renderOrder −1000), never touches depth → scene geometry
    // rendered later always paints over the backdrop.
    return <ScreenQuad renderOrder={-1000} material={material} />
  }
  Backdrop.displayName = `Backdrop(${id})`
  return Backdrop
}

/** Backdrop registry keyed by background-cosmetic id ('platform' handled by AmbientScene). */
export const BACKDROPS: Readonly<Record<string, ComponentType<BackdropProps>>> = Object.freeze(
  Object.fromEntries(Object.entries(FRAGMENTS).map(([id, f]) => [id, makeBackdrop(id, f)])),
)

/** Raw GLSL, exported so shader compilation can be verified headlessly. */
export const __SHADER_SOURCES: Record<string, { vertex: string; fragment: string }> = Object.fromEntries(
  Object.entries(FRAGMENTS).map(([id, fragment]) => [id, { vertex: VERTEX_SHADER, fragment }]),
)
