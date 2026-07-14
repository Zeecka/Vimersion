/**
 * End-to-end HTTP tests: boots the real server (in-memory SQLite) on an
 * ephemeral port and exercises the API surface. OAuth network calls are not
 * made — only the redirect/CSRF plumbing is tested.
 */

import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { request as httpRequest } from 'node:http'
import { createHmac, randomBytes } from 'node:crypto'

import { createApp, loadConfig } from './index.mjs'

const SECRET = 'test-secret'
const hashToken = (token) => createHmac('sha256', SECRET).update(token).digest('hex')

let app
let base

before(async () => {
  app = createApp(
    loadConfig({
      DB_PATH: ':memory:',
      SESSION_SECRET: SECRET,
      PUBLIC_ORIGIN: 'http://localhost:8971',
      GITHUB_CLIENT_ID: 'fake-id',
      GITHUB_CLIENT_SECRET: 'fake-secret',
      // google left unconfigured on purpose
    }),
  )
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${app.server.address().port}`
})

after(() => app.close())

const get = (path, headers = {}) => fetch(`${base}${path}`, { headers, redirect: 'manual' })
const send = (method, path, body, headers = {}) =>
  fetch(`${base}${path}`, { method, body, headers, redirect: 'manual' })

/** Create a signed-in user directly in the DB; returns its session Cookie header. */
function signIn(providerId = '1234', name = 'Test Player') {
  const user = app.db.upsertUser({
    provider: 'github',
    providerId,
    name,
    avatarUrl: 'https://example.com/a.png',
  })
  const token = randomBytes(32).toString('base64url')
  app.db.createSession(hashToken(token), user.id, Date.now() + 60_000)
  return { user, cookie: `vim_session=${token}` }
}

const snapshot = {
  xp: 285,
  coins: 120,
  completed: {
    'motions-1': { keystrokes: 12, par: 10, stars: 2, xp: 60 },
    'motions-2': { keystrokes: 8, par: 8, stars: 3, xp: 75 },
    'delete-1': { keystrokes: 30, par: 12, stars: 1, xp: 45 },
  },
  mastery: { h: 5, j: 3, k: 2 },
  streak: { count: 4, lastPlayed: '2026-7-14' },
  arcadeBest: 900,
  owned: ['cat'],
  equipped: { avatar: 'cat', theme: 'nightglass', background: 'dunes' },
}

test('GET /api/health responds ok', async () => {
  const res = await get('/api/health')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true })
})

test('GET /api/config lists only configured providers', async () => {
  const res = await get('/api/config')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { providers: ['github'] })
})

test('GET /api/me without a session is 200 {user:null} (normal anonymous state)', async () => {
  const res = await get('/api/me')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { user: null, progress: null, updatedAt: null })
})

test('GET /api/score/:publicId for an unknown id is 404', async () => {
  const res = await get('/api/score/nope123456')
  assert.equal(res.status, 404)
})

test('unknown /api routes return JSON 404', async () => {
  const res = await get('/api/whatever')
  assert.equal(res.status, 404)
  assert.deepEqual(await res.json(), { error: 'not found' })
})

test('auth start redirects to GitHub with a state cookie', async () => {
  const res = await get('/api/auth/github/start')
  assert.equal(res.status, 302)
  const location = new URL(res.headers.get('location'))
  assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize')
  assert.equal(location.searchParams.get('client_id'), 'fake-id')
  assert.equal(location.searchParams.get('redirect_uri'), 'http://localhost:8971/api/auth/github/callback')
  const state = location.searchParams.get('state')
  assert.match(state, /^[0-9a-f]{32}$/)
  const setCookie = res.headers.get('set-cookie')
  assert.match(setCookie, /^vim_oauth_state=github%3A[0-9a-f]{32}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=600$/)
})

test('auth start for an unconfigured provider is 404', async () => {
  const res = await get('/api/auth/google/start')
  assert.equal(res.status, 404)
})

test('auth callback with a mismatched state redirects to /?auth_error=1', async () => {
  const res = await get('/api/auth/github/callback?code=abc&state=evil', {
    cookie: 'vim_oauth_state=github%3Alegit',
  })
  assert.equal(res.status, 302)
  assert.equal(res.headers.get('location'), '/?auth_error=1')
  assert.match(res.headers.get('set-cookie'), /vim_oauth_state=; .*Max-Age=0/)
})

test('PUT /api/progress requires a session', async () => {
  const res = await send('PUT', '/api/progress', JSON.stringify(snapshot))
  assert.equal(res.status, 401)
})

test('progress round-trip: PUT, rate limit, /api/me, public score, logout', async () => {
  const { user, cookie } = signIn()

  // Invalid body -> 400 (and does not consume the rate-limit slot)
  const bad = await send('PUT', '/api/progress', JSON.stringify({ ...snapshot, xp: 99_999 }), { cookie })
  assert.equal(bad.status, 400)
  assert.match((await bad.json()).error, /implausibly high/)

  const notJson = await send('PUT', '/api/progress', 'not json', { cookie })
  assert.equal(notJson.status, 400)

  // Valid PUT -> stored, sanitized, scored
  const put = await send('PUT', '/api/progress', JSON.stringify({ ...snapshot, soundOn: true }), { cookie })
  assert.equal(put.status, 200)
  const saved = await put.json()
  assert.equal(saved.ok, true)
  assert.equal(saved.publicId, user.public_id)
  assert.match(saved.publicId, /^[0-9a-z]{10}$/)
  assert.equal(saved.score.level, 3)
  assert.equal(saved.score.solved, 3)
  assert.equal(saved.score.mastered, 2)
  assert.equal(saved.score.streak, 4)
  assert.equal(saved.score.name, 'Test Player')

  // Immediate second PUT -> 429
  const again = await send('PUT', '/api/progress', JSON.stringify(snapshot), { cookie })
  assert.equal(again.status, 429)

  // /api/me returns the sanitized snapshot (unknown keys stripped)
  const me = await get('/api/me', { cookie })
  assert.equal(me.status, 200)
  const meBody = await me.json()
  assert.equal(meBody.user.publicId, user.public_id)
  assert.equal(meBody.user.provider, 'github')
  assert.equal(meBody.progress.xp, 285)
  assert.ok(!('soundOn' in meBody.progress))
  assert.equal(typeof meBody.updatedAt, 'number')

  // Public score page needs no auth
  const score = await get(`/api/score/${user.public_id}`)
  assert.equal(score.status, 200)
  const scoreBody = await score.json()
  assert.deepEqual(scoreBody, {
    name: 'Test Player',
    avatarUrl: 'https://example.com/a.png',
    level: 3,
    xp: 285,
    solved: 3,
    mastered: 2,
    coins: 120,
    arcadeBest: 900,
    streak: 4,
    updatedAt: meBody.updatedAt,
  })

  // Logout kills the session: /api/me flips back to the anonymous shape
  const out = await send('POST', '/api/logout', null, { cookie })
  assert.equal(out.status, 200)
  assert.match(out.headers.get('set-cookie'), /vim_session=; .*Max-Age=0/)
  const anon = await get('/api/me', { cookie })
  assert.equal(anon.status, 200)
  assert.equal((await anon.json()).user, null)
})

test('PUT /api/progress over 256 KB is rejected with 413', async () => {
  const { cookie } = signIn('5678', 'Big Sender')
  const big = JSON.stringify({ ...snapshot, pad: 'x'.repeat(300 * 1024) })
  // Raw http.request: the server may respond before the upload finishes,
  // which fetch() can surface as a socket error instead of a response.
  const status = await new Promise((resolve, reject) => {
    const req = httpRequest(
      `${base}/api/progress`,
      { method: 'PUT', headers: { cookie, 'content-length': Buffer.byteLength(big) } },
      (res) => {
        res.resume()
        resolve(res.statusCode)
      },
    )
    req.on('error', reject)
    req.end(big)
  })
  assert.equal(status, 413)
})
