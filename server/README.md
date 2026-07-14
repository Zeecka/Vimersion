# Vimersion API server

A small self-hosted backend for **optional** player accounts (Google / GitHub
sign-in) and tamper-resistant score sharing. The game is fully playable
without it — everything here is additive.

- **Zero npm dependencies.** Node built-ins only: `node:http`, `node:sqlite`,
  `node:crypto`, global `fetch`.
- **No emails stored.** Only the provider's opaque user id, display name and
  avatar URL.
- SQLite (WAL mode) in a single file; sessions are 90-day httpOnly cookies
  whose tokens are HMAC-hashed before storage.

## Requirements

- **Node >= 23.4** (where `node:sqlite` is available by default), or
- **Node 22** with the `--experimental-sqlite` flag — the npm scripts already
  pass it (it is accepted and harmless on newer Node).

The Docker image uses `node:24-alpine`, so no flag juggling there.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP listen port. |
| `DB_PATH` | `./vimersion.db` | SQLite file. Docker sets `/data/vimersion.db` (named volume). |
| `PUBLIC_ORIGIN` | `http://localhost:8971` | Origin players use in the browser. Builds the OAuth redirect URIs; an `https` origin turns on `Secure` cookies. |
| `SESSION_SECRET` | *(generated)* | HMAC key for session tokens. **Required in production** — if unset, a random one is generated at boot (with a warning) and all sessions die on restart. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Google OAuth app. Google sign-in appears only when **both** are set. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | — | GitHub OAuth app. Same rule. |

See [`.env.example`](./.env.example) for a documented template.

## Creating the OAuth apps

The redirect URIs below assume `PUBLIC_ORIGIN=https://vimersion.example.com`;
substitute your own origin (for local docker use `http://localhost:8971`).

### Google

1. Go to <https://console.cloud.google.com/> and create (or pick) a project.
2. **APIs & Services → OAuth consent screen** (a.k.a. *Google Auth Platform →
   Branding*): choose **External**, fill in the app name and your contact
   email. Only non-sensitive scopes are used (`openid`, `profile`), so no
   verification is needed; you can keep the app in *Testing* and add yourself
   as a test user, or publish it.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `https://vimersion.example.com/api/auth/google/callback`
   - (Authorized JavaScript origins are not needed — this is a server-side flow.)
4. Copy the **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`.

### GitHub

1. Go to <https://github.com/settings/developers> → **OAuth Apps** → **New
   OAuth App** (use an organization's settings page for an org-owned app).
2. Fill in:
   - Homepage URL: `https://vimersion.example.com`
   - Authorization callback URL: `https://vimersion.example.com/api/auth/github/callback`
3. Register, then **Generate a new client secret**. Copy both values into
   `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

> Note: each OAuth app accepts a single callback origin, so use separate
> OAuth apps for local development and production.

## Running locally

```sh
cd server
cp .env.example .env            # optional; plain env vars work too
SESSION_SECRET=dev-secret npm start   # = node --experimental-sqlite index.mjs
curl http://localhost:3001/api/health # {"ok":true}
```

Tests:

```sh
cd server && npm test
```

## Running with Docker

Via the repo's `docker-compose.yml` (recommended — nginx proxies `/api/` to
this service, so no host port is exposed):

```sh
SESSION_SECRET=$(openssl rand -hex 32) \
GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... \
docker compose up -d --build
```

Standalone:

```sh
docker build -t vimersion-api ./server
docker run -d --name vimersion-api \
  -v vimersion-data:/data \
  -e SESSION_SECRET=change-me \
  -e PUBLIC_ORIGIN=http://localhost:8971 \
  -p 3001:3001 vimersion-api
```

## API

All endpoints live under `/api`, return JSON, and use `{"error":"..."}` error
bodies.

| Method & path | Auth | Description |
| --- | --- | --- |
| `GET /api/health` | — | `{ok:true}` |
| `GET /api/config` | — | `{providers:[...]}` — only providers with credentials configured. |
| `GET /api/auth/:provider/start` | — | 302 to the provider's consent page (CSRF `state` in a 10-min cookie). |
| `GET /api/auth/:provider/callback` | — | Verifies state, exchanges the code, upserts the user, sets the `vim_session` cookie, 302 to `/` (or `/?auth_error=1`). |
| `GET /api/me` | cookie | `{user:{name,avatarUrl,provider,publicId}, progress, updatedAt}` — 401 when signed out. |
| `POST /api/logout` | cookie | Deletes the session, clears the cookie. |
| `PUT /api/progress` | cookie | Body = progress snapshot (max 256 KB, validated & sanitized server-side). Replies `{ok,publicId,score}`. Rate limit: one accepted save per 2 s per user (429). |
| `GET /api/score/:publicId` | — | Public share payload: `{name,avatarUrl,level,xp,solved,mastered,coins,arcadeBest,streak,updatedAt}`. |

Score share URLs use the user's `publicId` — a random 10-char slug, so links
are unguessable and no internal ids leak.

## Anti-cheat scope

Server-side storage stops URL/localStorage tampering and makes shared score
links verifiable: the numbers on a share page come from a snapshot that passed
server-side validation (type/range checks, plus an xp-vs-solves plausibility
cross-check) rather than from anything the viewer can edit. However, a
signed-in client can still submit inflated-but-plausible snapshots — the
server cannot know whether the keystrokes really happened. Full prevention
would require server-side replay verification of each solve, which is out of
scope here.
