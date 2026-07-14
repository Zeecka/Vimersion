/** Small helpers on top of node:http — JSON responses, cookies, body reading. */

import { Buffer } from 'node:buffer'

export function sendJson(res, status, body, headers = {}) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  res.end(data)
}

export function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store', ...headers })
  res.end()
}

export function parseCookies(req) {
  const header = req.headers.cookie
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    const name = part.slice(0, i).trim()
    let value = part.slice(i + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    try {
      out[name] = decodeURIComponent(value)
    } catch {
      out[name] = value
    }
  }
  return out
}

/** Serialize a Set-Cookie value. Always HttpOnly, SameSite=Lax, Path=/. */
export function cookie(name, value, { maxAge, secure = false } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`)
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

class PayloadTooLargeError extends Error {
  constructor() {
    super('payload too large')
    this.statusCode = 413
  }
}

/** Buffer a request body, rejecting with statusCode 413 when it exceeds maxBytes. */
export function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? NaN)
    if (Number.isInteger(declared) && declared > maxBytes) {
      reject(new PayloadTooLargeError())
      return
    }
    const chunks = []
    let size = 0
    let settled = false
    const failOnce = (err) => {
      if (!settled) {
        settled = true
        reject(err)
      }
    }
    req.on('data', (chunk) => {
      if (settled) return
      size += chunk.length
      if (size > maxBytes) {
        failOnce(new PayloadTooLargeError())
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!settled) {
        settled = true
        resolve(Buffer.concat(chunks))
      }
    })
    req.on('error', failOnce)
  })
}
