/**
 * OAuth 2.0 authorization-code flow for Google and GitHub, using only the
 * global fetch. Each provider yields a profile of
 * `{ providerId, name, avatarUrl }` — deliberately no email.
 */

const PROVIDERS = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid profile',
    async fetchProfile(accessToken) {
      const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error(`google userinfo returned ${res.status}`)
      const u = await res.json()
      if (!u.sub) throw new Error('google userinfo response missing "sub"')
      return {
        providerId: String(u.sub),
        name: u.name || u.given_name || 'Player',
        avatarUrl: u.picture || null,
      }
    },
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user',
    async fetchProfile(accessToken) {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'vimlegends-server', // required by the GitHub API
        },
      })
      if (!res.ok) throw new Error(`github user endpoint returned ${res.status}`)
      const u = await res.json()
      if (u.id === undefined || u.id === null) throw new Error('github user response missing "id"')
      return {
        providerId: String(u.id),
        name: u.name ?? u.login ?? 'Player',
        avatarUrl: u.avatar_url ?? null,
      }
    },
  },
}

export const PROVIDER_NAMES = Object.keys(PROVIDERS)

export function buildAuthorizeUrl(provider, { clientId, redirectUri, state }) {
  const p = PROVIDERS[provider]
  const url = new URL(p.authorizeUrl)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', p.scope)
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeCode(provider, { clientId, clientSecret, redirectUri, code }) {
  const res = await fetch(PROVIDERS[provider].tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json', // GitHub returns form-encoded without this
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })
  if (!res.ok) throw new Error(`${provider} token endpoint returned ${res.status}`)
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(`${provider} token exchange failed: ${data.error ?? 'no access_token in response'}`)
  }
  return data.access_token
}

export function fetchProfile(provider, accessToken) {
  return PROVIDERS[provider].fetchProfile(accessToken)
}
