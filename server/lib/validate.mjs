/**
 * Snapshot validation and score derivation. Pure functions, no I/O.
 *
 * `validateSnapshot(input)` takes parsed JSON and returns a SANITIZED copy
 * (unknown keys stripped, safe defaults filled in) or throws a
 * `ValidationError` with a human-readable message.
 */

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function fail(message) {
  throw new ValidationError(message)
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function checkInt(v, min, max, label) {
  if (typeof v !== 'number' || !Number.isInteger(v)) fail(`${label}: expected an integer`)
  if (v < min || v > max) fail(`${label}: out of range (${min}..${max})`)
  return v
}

function checkString(v, maxLen, label) {
  if (typeof v !== 'string') fail(`${label}: expected a string`)
  if (v.length > maxLen) fail(`${label}: too long (max ${maxLen} chars)`)
  return v
}

function checkCompleted(v) {
  if (!isPlainObject(v)) fail('completed: expected an object')
  const keys = Object.keys(v)
  if (keys.length > 1000) fail('completed: too many entries (max 1000)')
  const entries = []
  for (const key of keys) {
    if (key.length < 1 || key.length > 64) fail('completed: challenge id must be 1..64 chars')
    const e = v[key]
    if (!isPlainObject(e)) fail(`completed["${key}"]: expected an object`)
    entries.push([
      key,
      {
        keystrokes: checkInt(e.keystrokes, 1, 100_000, `completed["${key}"].keystrokes`),
        par: checkInt(e.par, 1, 1000, `completed["${key}"].par`),
        stars: checkInt(e.stars, 1, 3, `completed["${key}"].stars`),
        xp: checkInt(e.xp, 0, 10_000, `completed["${key}"].xp`),
      },
    ])
  }
  // fromEntries defines own data properties, so a "__proto__" key cannot
  // pollute the prototype the way `out[key] = ...` assignment could.
  return Object.fromEntries(entries)
}

function checkMastery(v) {
  if (!isPlainObject(v)) fail('mastery: expected an object')
  const keys = Object.keys(v)
  if (keys.length > 500) fail('mastery: too many entries (max 500)')
  const entries = []
  for (const key of keys) {
    if (key.length < 1 || key.length > 32) fail('mastery: command id must be 1..32 chars')
    entries.push([key, checkInt(v[key], 0, 1_000_000, `mastery["${key}"]`)])
  }
  return Object.fromEntries(entries)
}

function checkStreak(v) {
  if (!isPlainObject(v)) fail('streak: expected an object')
  const lastPlayed = v.lastPlayed === null || v.lastPlayed === undefined
    ? null
    : checkString(v.lastPlayed, 16, 'streak.lastPlayed')
  return { count: checkInt(v.count, 0, 36_500, 'streak.count'), lastPlayed }
}

function checkOwned(v) {
  if (!Array.isArray(v)) fail('owned: expected an array')
  if (v.length > 200) fail('owned: too many items (max 200)')
  return v.map((item, i) => checkString(item, 64, `owned[${i}]`))
}

function checkEquipped(v) {
  if (!isPlainObject(v)) fail('equipped: expected an object')
  // v10 dropped `avatar` (the single Hero replaced the avatar roster); any legacy
  // `avatar` key is simply ignored.
  return {
    theme: checkString(v.theme, 64, 'equipped.theme'),
    background: checkString(v.background, 64, 'equipped.background'),
  }
}

function checkHeroColor(v, label) {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string' || !HEX_COLOR.test(v)) fail(`${label}: expected null or "#rrggbb"`)
  return v
}

function checkAura(v) {
  if (v === null || v === undefined) return { color: null, style: 'sparkles', intensity: 0.6 }
  if (!isPlainObject(v)) fail('hero.aura: expected an object')
  const intensity = v.intensity === undefined ? 0.6 : v.intensity
  if (typeof intensity !== 'number' || Number.isNaN(intensity) || intensity < 0 || intensity > 1) {
    fail('hero.aura.intensity: expected a number in 0..1')
  }
  return {
    color: checkHeroColor(v.color, 'hero.aura.color'),
    style: v.style === undefined ? 'sparkles' : checkString(v.style, 24, 'hero.aura.style'),
    intensity,
  }
}

/** Hero customization: three color zones + accessory/visor/finish + aura + character. */
function checkHero(v) {
  if (!isPlainObject(v)) fail('hero: expected an object')
  return {
    body: checkHeroColor(v.body, 'hero.body'),
    trim: checkHeroColor(v.trim, 'hero.trim'),
    visor: checkHeroColor(v.visor, 'hero.visor'),
    accessory: v.accessory === undefined ? 'none' : checkString(v.accessory, 24, 'hero.accessory'),
    visorStyle: v.visorStyle === undefined ? 'bar' : checkString(v.visorStyle, 24, 'hero.visorStyle'),
    finish: v.finish === undefined ? 'matte' : checkString(v.finish, 16, 'hero.finish'),
    aura: checkAura(v.aura),
    // v13: the selected base model. Must be whitelisted here or account sync
    // silently reverts a signed-in player to the default robot on a merge.
    character: v.character === undefined ? 'robot' : checkString(v.character, 24, 'hero.character'),
  }
}

/**
 * Each challenge awards at most ~75 xp plus improvement margin, so a
 * snapshot's xp cannot plausibly exceed 120 xp per solved challenge (plus a
 * little slack for events/bonuses).
 */
const MAX_XP_PER_SOLVE = 120
const XP_SLACK = 500

export function validateSnapshot(input) {
  if (!isPlainObject(input)) fail('snapshot: expected a JSON object')

  const out = {
    xp: checkInt(input.xp, 0, 200_000, 'xp'),
    coins: checkInt(input.coins, 0, 1_000_000, 'coins'),
    completed: checkCompleted(input.completed),
    mastery: input.mastery === undefined ? {} : checkMastery(input.mastery),
    streak: input.streak === undefined ? { count: 0, lastPlayed: null } : checkStreak(input.streak),
    arcadeBest: input.arcadeBest === undefined ? 0 : checkInt(input.arcadeBest, 0, 100_000, 'arcadeBest'),
    owned: input.owned === undefined ? [] : checkOwned(input.owned),
    equipped:
      input.equipped === undefined
        ? { theme: '', background: '' }
        : checkEquipped(input.equipped),
  }
  if (input.hero !== undefined) out.hero = checkHero(input.hero)

  const solved = Object.keys(out.completed).length
  if (out.xp > MAX_XP_PER_SOLVE * solved + XP_SLACK) {
    fail(`xp: ${out.xp} is implausibly high for ${solved} completed challenge(s)`)
  }

  return out
}

/** Cumulative XP required to *reach* a given level — mirrors src/game/xp.ts. */
export function totalXpForLevel(level) {
  return Math.round(37.5 * (level - 1) * level)
}

export function levelFromXp(xp) {
  let level = 1
  while (totalXpForLevel(level + 1) <= xp) level++
  return level
}

const MASTERY_THRESHOLD = 3

/** Public score fields derived from a snapshot that already passed validation. */
export function deriveScore(snapshot) {
  return {
    level: levelFromXp(snapshot.xp),
    xp: snapshot.xp,
    solved: Object.keys(snapshot.completed).length,
    mastered: Object.values(snapshot.mastery).filter((n) => n >= MASTERY_THRESHOLD).length,
    coins: snapshot.coins,
    arcadeBest: snapshot.arcadeBest,
    streak: snapshot.streak.count,
  }
}
