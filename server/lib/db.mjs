/**
 * SQLite storage layer (node:sqlite, WAL mode). No emails are stored — only
 * the OAuth provider's opaque user id, display name and avatar URL.
 */

import { randomBytes } from 'node:crypto'

let DatabaseSync
try {
  ;({ DatabaseSync } = await import('node:sqlite'))
} catch {
  console.error(
    '[vimersion-server] node:sqlite is unavailable.\n' +
      '  On Node 22, run with:  node --experimental-sqlite index.mjs\n' +
      '  Or use Node >= 23.4, where node:sqlite is available by default.',
  )
  process.exit(1)
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY,
  provider    TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  public_id   TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  UNIQUE(provider, provider_id)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS progress (
  user_id     INTEGER PRIMARY KEY,
  snapshot    TEXT NOT NULL,
  xp          INTEGER,
  solved      INTEGER,
  mastered    INTEGER,
  coins       INTEGER,
  arcade_best INTEGER,
  updated_at  INTEGER NOT NULL
);
`

const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz'

/** 10-char base36 slug for share URLs (~51.7 bits of entropy). */
function randomPublicId() {
  let out = ''
  for (const byte of randomBytes(10)) out += BASE36[byte % 36]
  return out
}

export function openDb(path) {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec(SCHEMA)

  const stmts = {
    getUserByProvider: db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?'),
    getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertUser: db.prepare(
      'INSERT INTO users (provider, provider_id, name, avatar_url, public_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ),
    updateUserProfile: db.prepare('UPDATE users SET name = ?, avatar_url = ? WHERE id = ?'),
    insertSession: db.prepare(
      'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    ),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    pruneSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    getUserBySession: db.prepare(
      'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?',
    ),
    upsertProgress: db.prepare(
      `INSERT INTO progress (user_id, snapshot, xp, solved, mastered, coins, arcade_best, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         snapshot = excluded.snapshot, xp = excluded.xp, solved = excluded.solved,
         mastered = excluded.mastered, coins = excluded.coins,
         arcade_best = excluded.arcade_best, updated_at = excluded.updated_at`,
    ),
    getProgress: db.prepare('SELECT * FROM progress WHERE user_id = ?'),
    getScoreByPublicId: db.prepare(
      `SELECT u.name, u.avatar_url, p.snapshot, p.xp, p.solved, p.mastered, p.coins, p.arcade_best, p.updated_at
       FROM users u JOIN progress p ON p.user_id = u.id
       WHERE u.public_id = ?`,
    ),
  }

  return {
    /** Find-or-create a user by (provider, providerId); refreshes name/avatar. */
    upsertUser({ provider, providerId, name, avatarUrl }) {
      const existing = stmts.getUserByProvider.get(provider, providerId)
      if (existing) {
        stmts.updateUserProfile.run(name, avatarUrl, existing.id)
        return { ...existing, name, avatar_url: avatarUrl }
      }
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const { lastInsertRowid } = stmts.insertUser.run(
            provider,
            providerId,
            name,
            avatarUrl,
            randomPublicId(),
            Date.now(),
          )
          return stmts.getUserById.get(lastInsertRowid)
        } catch (err) {
          // Retry only the (astronomically unlikely) public_id collision.
          if (!/UNIQUE.*public_id/i.test(String(err?.message))) throw err
        }
      }
      throw new Error('could not allocate a unique public id')
    },

    createSession(tokenHash, userId, expiresAt) {
      stmts.insertSession.run(tokenHash, userId, Date.now(), expiresAt)
    },

    /** Resolve a session to its user; expired sessions are pruned lazily here. */
    getUserBySession(tokenHash) {
      const now = Date.now()
      stmts.pruneSessions.run(now)
      return stmts.getUserBySession.get(tokenHash, now) ?? null
    },

    deleteSession(tokenHash) {
      stmts.deleteSession.run(tokenHash)
    },

    saveProgress(userId, snapshotJson, derived, now = Date.now()) {
      stmts.upsertProgress.run(
        userId,
        snapshotJson,
        derived.xp,
        derived.solved,
        derived.mastered,
        derived.coins,
        derived.arcadeBest,
        now,
      )
      return now
    },

    getProgress(userId) {
      return stmts.getProgress.get(userId) ?? null
    },

    getScoreByPublicId(publicId) {
      return stmts.getScoreByPublicId.get(publicId) ?? null
    },

    close() {
      db.close()
    },
  }
}
