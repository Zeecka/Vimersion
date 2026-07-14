/**
 * Vimersion API server — optional player accounts (Google/GitHub OAuth) and
 * tamper-resistant score sharing. Zero npm dependencies: node:http,
 * node:sqlite, node:crypto and global fetch only.
 *
 * The game is fully playable without this server; everything here is additive.
 */

import { createServer } from 'node:http'
import { createHmac, randomBytes } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import { openDb } from './lib/db.mjs'
import { cookie, parseCookies, readBody, redirect, sendJson } from './lib/http.mjs'
import { PROVIDER_NAMES, buildAuthorizeUrl, exchangeCode, fetchProfile } from './lib/oauth.mjs'
import { ValidationError, deriveScore, levelFromXp, validateSnapshot } from './lib/validate.mjs'

const SESSION_COOKIE = 'vim_session'
const STATE_COOKIE = 'vim_oauth_state'
const SESSION_TTL_S = 90 * 24 * 60 * 60 // 90 days
const STATE_TTL_S = 10 * 60 // 10 minutes
const MAX_SNAPSHOT_BYTES = 256 * 1024
const PUT_MIN_INTERVAL_MS = 2000

export function loadConfig(env = process.env) {
  const publicOrigin = (env.PUBLIC_ORIGIN || 'http://localhost:8971').replace(/\/+$/, '')

  const providers = {}
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }
  }

  let sessionSecret = env.SESSION_SECRET
  if (!sessionSecret) {
    sessionSecret = randomBytes(32).toString('hex')
    console.warn(
      '[vimersion-server] SESSION_SECRET is not set — using a random one-off secret. ' +
        'Sessions will NOT survive a restart. Set SESSION_SECRET in production.',
    )
  }

  return {
    port: Number(env.PORT) || 3001,
    dbPath: env.DB_PATH || './vimersion.db',
    publicOrigin,
    secureCookies: publicOrigin.startsWith('https:'),
    sessionSecret,
    providers,
  }
}

export function createApp(config) {
  const db = openDb(config.dbPath)
  const lastAcceptedPut = new Map() // user id -> ms timestamp of last accepted PUT

  const hashToken = (token) =>
    createHmac('sha256', config.sessionSecret).update(token).digest('hex')

  const redirectUriFor = (provider) => `${config.publicOrigin}/api/auth/${provider}/callback`

  const sessionCookie = (value, maxAge) =>
    cookie(SESSION_COOKIE, value, { maxAge, secure: config.secureCookies })
  const stateCookie = (value, maxAge) =>
    cookie(STATE_COOKIE, value, { maxAge, secure: config.secureCookies })

  function currentUser(req) {
    const token = parseCookies(req)[SESSION_COOKIE]
    if (!token) return null
    return db.getUserBySession(hashToken(token))
  }

  // ---- Handlers ------------------------------------------------------------

  function authStart(res, provider) {
    const state = randomBytes(16).toString('hex')
    const authorizeUrl = buildAuthorizeUrl(provider, {
      clientId: config.providers[provider].clientId,
      redirectUri: redirectUriFor(provider),
      state,
    })
    // Double-submit CSRF cookie; the provider name is baked in so a callback
    // for provider A cannot complete a flow started for provider B.
    redirect(res, authorizeUrl, { 'Set-Cookie': stateCookie(`${provider}:${state}`, STATE_TTL_S) })
  }

  async function authCallback(req, res, provider, url) {
    const clearState = stateCookie('', 0)
    const failRedirect = () => redirect(res, '/?auth_error=1', { 'Set-Cookie': clearState })
    try {
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const expected = parseCookies(req)[STATE_COOKIE]
      if (!code || !state || !expected || expected !== `${provider}:${state}`) return failRedirect()

      const accessToken = await exchangeCode(provider, {
        ...config.providers[provider],
        redirectUri: redirectUriFor(provider),
        code,
      })
      const profile = await fetchProfile(provider, accessToken)
      const user = db.upsertUser({ provider, ...profile })

      const token = randomBytes(32).toString('base64url')
      db.createSession(hashToken(token), user.id, Date.now() + SESSION_TTL_S * 1000)
      redirect(res, '/', { 'Set-Cookie': [clearState, sessionCookie(token, SESSION_TTL_S)] })
    } catch (err) {
      console.error(`[vimersion-server] ${provider} oauth callback failed:`, err?.message ?? err)
      if (!res.headersSent) failRedirect()
    }
  }

  function me(req, res) {
    const user = currentUser(req)
    // Signed-out is the NORMAL state here (probed on every page load) —
    // 200 {user:null} keeps anonymous consoles clean of red 401s. Real auth
    // failures (e.g. PUT /api/progress) still return 401.
    if (!user) return sendJson(res, 200, { user: null, progress: null, updatedAt: null })
    const row = db.getProgress(user.id)
    sendJson(res, 200, {
      user: {
        name: user.name,
        avatarUrl: user.avatar_url,
        provider: user.provider,
        publicId: user.public_id,
      },
      progress: row ? JSON.parse(row.snapshot) : null,
      updatedAt: row ? row.updated_at : null,
    })
  }

  function logout(req, res) {
    const token = parseCookies(req)[SESSION_COOKIE]
    if (token) db.deleteSession(hashToken(token))
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) })
  }

  async function putProgress(req, res) {
    const user = currentUser(req)
    if (!user) return sendJson(res, 401, { error: 'not signed in' })

    const last = lastAcceptedPut.get(user.id)
    if (last !== undefined && Date.now() - last < PUT_MIN_INTERVAL_MS) {
      return sendJson(res, 429, { error: 'too many saves, retry in a moment' }, { 'Retry-After': '2' })
    }

    let body
    try {
      body = await readBody(req, MAX_SNAPSHOT_BYTES)
    } catch (err) {
      if (err?.statusCode === 413) {
        return sendJson(res, 413, { error: 'snapshot too large (max 256 KB)' }, { Connection: 'close' })
      }
      throw err
    }

    let parsed
    try {
      parsed = JSON.parse(body.toString('utf8'))
    } catch {
      return sendJson(res, 400, { error: 'body is not valid JSON' })
    }

    let snapshot
    try {
      snapshot = validateSnapshot(parsed)
    } catch (err) {
      if (err instanceof ValidationError) return sendJson(res, 400, { error: err.message })
      throw err
    }

    const derived = deriveScore(snapshot)
    const updatedAt = db.saveProgress(user.id, JSON.stringify(snapshot), derived)
    lastAcceptedPut.set(user.id, updatedAt)
    sendJson(res, 200, {
      ok: true,
      publicId: user.public_id,
      score: { name: user.name, avatarUrl: user.avatar_url, ...derived, updatedAt },
    })
  }

  function getScore(res, publicId) {
    const row = db.getScoreByPublicId(publicId)
    if (!row) return sendJson(res, 404, { error: 'score not found' })
    let streak = 0
    try {
      streak = JSON.parse(row.snapshot).streak?.count ?? 0
    } catch {
      /* stored snapshots are always valid JSON; keep streak at 0 if not */
    }
    sendJson(res, 200, {
      name: row.name,
      avatarUrl: row.avatar_url,
      level: levelFromXp(row.xp),
      xp: row.xp,
      solved: row.solved,
      mastered: row.mastered,
      coins: row.coins,
      arcadeBest: row.arcade_best,
      streak,
      updatedAt: row.updated_at,
    })
  }

  // ---- Routing -------------------------------------------------------------

  async function handle(req, res) {
    const url = new URL(req.url, config.publicOrigin)
    const { pathname } = url
    const method = req.method

    if (method === 'GET' && pathname === '/api/health') return sendJson(res, 200, { ok: true })

    if (method === 'GET' && pathname === '/api/config') {
      return sendJson(res, 200, {
        providers: PROVIDER_NAMES.filter((name) => name in config.providers),
      })
    }

    const auth = pathname.match(/^\/api\/auth\/([a-z]+)\/(start|callback)$/)
    if (method === 'GET' && auth) {
      const [, provider, step] = auth
      if (!(provider in config.providers)) {
        // A callback should land the user back in the app, not on a JSON page.
        return step === 'callback'
          ? redirect(res, '/?auth_error=1')
          : sendJson(res, 404, { error: `provider not configured: ${provider}` })
      }
      return step === 'start' ? authStart(res, provider) : authCallback(req, res, provider, url)
    }

    if (method === 'GET' && pathname === '/api/me') return me(req, res)
    if (method === 'POST' && pathname === '/api/logout') return logout(req, res)
    if (method === 'PUT' && pathname === '/api/progress') return putProgress(req, res)

    const score = pathname.match(/^\/api\/score\/([a-zA-Z0-9]{1,32})$/)
    if (method === 'GET' && score) return getScore(res, score[1])

    sendJson(res, 404, { error: 'not found' })
  }

  const server = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error('[vimersion-server] unhandled error:', err)
      if (!res.headersSent) sendJson(res, 500, { error: 'internal server error' })
      else res.end()
    })
  })

  return {
    server,
    db,
    config,
    close() {
      server.close()
      db.close()
    },
  }
}

// ---- Entry point -----------------------------------------------------------

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const config = loadConfig()
  const app = createApp(config)
  app.server.listen(config.port, () => {
    console.log(
      `[vimersion-server] listening on :${config.port}` +
        ` (db: ${config.dbPath}, origin: ${config.publicOrigin},` +
        ` providers: ${Object.keys(config.providers).join(', ') || 'none configured'})`,
    )
  })

  const shutdown = () => {
    app.server.close(() => {
      app.db.close()
      process.exit(0)
    })
    setTimeout(() => process.exit(0), 3000).unref() // don't hang on idle keep-alives
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
