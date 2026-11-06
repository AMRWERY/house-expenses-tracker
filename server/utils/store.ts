import type { WebAuthnCredential } from '#auth-utils'

/**
 * Persistence for users, passkeys and one-time WebAuthn challenges.
 *
 * Backed by Nitro storage (`useStorage('data')`, configured in nuxt.config.ts).
 * Dev + a single server: a JSON file under .data/kv. For several servers or serverless,
 * point `nitro.storage.data` at Redis / a database driver; nothing else here changes.
 */

export interface StoredUser {
  id: string
  userName: string
  displayName: string
  createdAt: number
}

export interface StoredCredential extends WebAuthnCredential {
  userName: string
}

const kv = () => useStorage('data')

/** Names are case-insensitive and unique. */
export const normalizeUserName = (s: string) => s.trim().toLowerCase()

export const getUser = (userName: string) => kv().getItem<StoredUser>(`users:${userName}`)
export const saveUser = (user: StoredUser) => kv().setItem(`users:${user.userName}`, user)

export const getCredential = (id: string) => kv().getItem<StoredCredential>(`credentials:${id}`)
export const saveCredential = (cred: StoredCredential) => kv().setItem(`credentials:${cred.id}`, cred)

export async function getUserCredentials(userName: string) {
  const keys = await kv().getKeys('credentials:')
  const all = await Promise.all(keys.map(k => kv().getItem<StoredCredential>(k)))
  return all.filter((c): c is StoredCredential => !!c && c.userName === userName)
}

// ---- WebAuthn challenges: single use, expire after 5 minutes --------------------------------
const CHALLENGE_TTL = 5 * 60 * 1000

export const challengeStore = {
  async storeChallenge(_event: unknown, challenge: string, attemptId: string) {
    await kv().setItem(`challenges:${attemptId}`, { challenge, exp: Date.now() + CHALLENGE_TTL })
  },
  async getChallenge(_event: unknown, attemptId: string) {
    const key = `challenges:${attemptId}`
    const item = await kv().getItem<{ challenge: string; exp: number }>(key)
    await kv().removeItem(key) // single use, even if verification then fails
    if (!item || item.exp < Date.now()) {
      throw createError({ statusCode: 400, message: 'challenge_expired' })
    }
    return item.challenge
  },
}
