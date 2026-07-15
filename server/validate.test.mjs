import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ValidationError,
  deriveScore,
  levelFromXp,
  totalXpForLevel,
  validateSnapshot,
} from './lib/validate.mjs'

/** A realistic, fully valid snapshot (mirrors the game's persisted store). */
function goodSnapshot() {
  return {
    xp: 285,
    coins: 120,
    completed: {
      'motions-1': { keystrokes: 12, par: 10, stars: 2, xp: 60 },
      'motions-2': { keystrokes: 8, par: 8, stars: 3, xp: 75 },
      'delete-1': { keystrokes: 30, par: 12, stars: 1, xp: 45 },
    },
    mastery: { h: 5, j: 3, k: 2, dd: 12 },
    streak: { count: 4, lastPlayed: '2026-7-14' },
    arcadeBest: 900,
    owned: ['nightglass', 'dunes'],
    equipped: { theme: 'nightglass', background: 'dunes' },
  }
}

const rejects = (mutate, name) =>
  test(name, () => {
    const snap = goodSnapshot()
    mutate(snap)
    assert.throws(() => validateSnapshot(snap), ValidationError)
  })

// ---- Happy path -------------------------------------------------------------

test('valid snapshot passes and round-trips its fields', () => {
  const out = validateSnapshot(goodSnapshot())
  assert.deepEqual(out, goodSnapshot())
})

test('unknown top-level keys are stripped (e.g. soundOn/quality from the store)', () => {
  const out = validateSnapshot({ ...goodSnapshot(), soundOn: true, quality: 'auto', hax: 1 })
  assert.deepEqual(Object.keys(out).sort(), [
    'arcadeBest', 'coins', 'completed', 'equipped', 'mastery', 'owned', 'streak', 'xp',
  ])
})

test('unknown keys inside completed entries are stripped', () => {
  const snap = goodSnapshot()
  snap.completed['motions-1'].secretBonus = 999
  const out = validateSnapshot(snap)
  assert.deepEqual(Object.keys(out.completed['motions-1']).sort(), ['keystrokes', 'par', 'stars', 'xp'])
})

test('optional sections default when absent', () => {
  const out = validateSnapshot({ xp: 75, coins: 0, completed: { a: { keystrokes: 5, par: 5, stars: 3, xp: 75 } } })
  assert.deepEqual(out.mastery, {})
  assert.deepEqual(out.streak, { count: 0, lastPlayed: null })
  assert.equal(out.arcadeBest, 0)
  assert.deepEqual(out.owned, [])
  assert.deepEqual(out.equipped, { theme: '', background: '' })
  assert.ok(!('hero' in out))
})

test('hero is validated and kept when present', () => {
  const hero = {
    body: '#AbCdEf',
    trim: null,
    visor: null,
    accessory: 'antenna',
    visorStyle: 'goggles',
    aura: { color: '#112233', style: 'fire', intensity: 0.8 },
  }
  const out = validateSnapshot({ ...goodSnapshot(), hero })
  assert.deepEqual(out.hero, hero)
})

test('hero defaults fill in for a minimal/absent-field hero', () => {
  const out = validateSnapshot({ ...goodSnapshot(), hero: { body: '#7c6bff' } })
  assert.deepEqual(out.hero, {
    body: '#7c6bff',
    trim: null,
    visor: null,
    accessory: 'none',
    visorStyle: 'bar',
    aura: { color: null, style: 'sparkles', intensity: 0.6 },
  })
})

// ---- Shape rejections ---------------------------------------------------------

test('non-object inputs are rejected', () => {
  for (const bad of [null, [], 'hi', 42, true]) {
    assert.throws(() => validateSnapshot(bad), ValidationError)
  }
})

rejects((s) => delete s.xp, 'missing xp is rejected')
rejects((s) => delete s.coins, 'missing coins is rejected')
rejects((s) => delete s.completed, 'missing completed is rejected')

rejects((s) => (s.xp = 12.5), 'fractional xp is rejected')
rejects((s) => (s.xp = '285'), 'string xp is rejected')
rejects((s) => (s.xp = -1), 'negative xp is rejected')
rejects((s) => (s.coins = 1_000_001), 'coins above cap are rejected')
rejects((s) => (s.arcadeBest = 100_001), 'arcadeBest above cap is rejected')

rejects((s) => (s.completed = []), 'array completed is rejected')
rejects((s) => (s.completed['motions-1'].stars = 0), 'stars 0 is rejected')
rejects((s) => (s.completed['motions-1'].stars = 4), 'stars 4 is rejected')
rejects((s) => (s.completed['motions-1'].keystrokes = 0), 'keystrokes 0 is rejected')
rejects((s) => (s.completed['motions-1'].par = 1001), 'par above cap is rejected')
rejects((s) => (s.completed['motions-1'].xp = 10_001), 'entry xp above cap is rejected')
rejects((s) => (s.completed['x'.repeat(65)] = { keystrokes: 1, par: 1, stars: 1, xp: 0 }), 'long challenge id is rejected')

test('completed with more than 1000 entries is rejected', () => {
  const snap = goodSnapshot()
  snap.xp = 0
  snap.completed = {}
  for (let i = 0; i <= 1000; i++) snap.completed[`ch-${i}`] = { keystrokes: 1, par: 1, stars: 1, xp: 0 }
  assert.throws(() => validateSnapshot(snap), /too many entries/)
})

rejects((s) => (s.mastery.h = 2.5), 'fractional mastery count is rejected')
rejects((s) => (s.mastery['x'.repeat(33)] = 1), 'long mastery key is rejected')

test('mastery with more than 500 entries is rejected', () => {
  const snap = goodSnapshot()
  snap.mastery = {}
  for (let i = 0; i <= 500; i++) snap.mastery[`cmd-${i}`] = 1
  assert.throws(() => validateSnapshot(snap), /too many entries/)
})

rejects((s) => (s.streak.count = 36_501), 'streak count above cap is rejected')
rejects((s) => (s.streak.lastPlayed = 'x'.repeat(17)), 'long streak.lastPlayed is rejected')
rejects((s) => (s.owned = 'cat'), 'non-array owned is rejected')
rejects((s) => (s.owned = Array.from({ length: 201 }, (_, i) => `i${i}`)), 'owned above cap is rejected')
rejects((s) => (s.owned = [42]), 'non-string owned item is rejected')
rejects((s) => (s.equipped = { theme: 7, background: 'dunes' }), 'non-string equipped value is rejected')
rejects((s) => (s.equipped = { theme: 'nightglass' }), 'equipped missing keys is rejected')
rejects((s) => (s.hero = { body: 'red' }), 'non-hex hero color is rejected')
rejects((s) => (s.hero = { body: '#12345' }), 'short hex hero color is rejected')
rejects((s) => (s.hero = { accessory: 'x'.repeat(25) }), 'long hero accessory is rejected')
rejects((s) => (s.hero = { aura: { intensity: 2 } }), 'aura intensity out of range is rejected')
rejects((s) => (s.hero = { aura: 'nope' }), 'non-object aura is rejected')

// ---- Plausibility cross-check ------------------------------------------------

test('xp wildly above what the solve count could produce is rejected', () => {
  const snap = goodSnapshot() // 3 completed => cap is 120*3 + 500 = 860
  snap.xp = 861
  assert.throws(() => validateSnapshot(snap), /implausibly high/)
  snap.xp = 860
  assert.equal(validateSnapshot(snap).xp, 860)
})

test('xp up to 500 is allowed with zero solves (slack)', () => {
  const out = validateSnapshot({ xp: 500, coins: 0, completed: {} })
  assert.equal(out.xp, 500)
})

// ---- Prototype-pollution safety -----------------------------------------------

test('a "__proto__" key cannot pollute Object.prototype', () => {
  const snap = JSON.parse(
    '{"xp":0,"coins":0,"completed":{"__proto__":{"keystrokes":1,"par":1,"stars":1,"xp":0}},"mastery":{"__proto__":9}}',
  )
  const out = validateSnapshot(snap)
  assert.equal({}.keystrokes, undefined)
  assert.equal({}.polluted, undefined)
  assert.equal(Object.keys(out.completed).length, 1)
  assert.equal(out.completed['__proto__'].par, 1)
})

// ---- Level formula & derived score --------------------------------------------

test('totalXpForLevel matches the game formula', () => {
  assert.equal(totalXpForLevel(1), 0)
  assert.equal(totalXpForLevel(2), 75) // round(37.5 * 1 * 2)
  assert.equal(totalXpForLevel(3), 225) // round(37.5 * 2 * 3)
  assert.equal(totalXpForLevel(10), 3375)
})

test('levelFromXp picks the largest level whose total <= xp', () => {
  assert.equal(levelFromXp(0), 1)
  assert.equal(levelFromXp(74), 1)
  assert.equal(levelFromXp(75), 2)
  assert.equal(levelFromXp(224), 2)
  assert.equal(levelFromXp(225), 3)
})

test('deriveScore computes level, solved, mastered and streak', () => {
  const score = deriveScore(validateSnapshot(goodSnapshot()))
  assert.deepEqual(score, {
    level: 3, // 285 xp: reach L3 at 225, L4 at 450
    xp: 285,
    solved: 3,
    mastered: 3, // h:5, j:3, dd:12 are >= 3; k:2 is not
    coins: 120,
    arcadeBest: 900,
    streak: 4,
  })
})
