import type { WebAuthnCredential } from '#auth-utils'
import type { Tables } from '../../app/types/database.types'

/**
 * Users, passkeys and one-time WebAuthn challenges, stored in Supabase Postgres
 * (tables created by supabase/migrations/20261106000000_init.sql).
 */

export interface StoredUser {
  id: string
  userName: string
  displayName: string
}

export interface StoredCredential extends WebAuthnCredential {
  userId: string
}

/** Names are case-insensitive and unique. */
export const normalizeUserName = (s: string) => s.trim().toLowerCase()

const toUser = (r: Tables<'app_users'>): StoredUser => ({
  id: r.id,
  userName: r.user_name,
  displayName: r.display_name,
})

const toCredential = (r: Tables<'passkeys'>): StoredCredential => ({
  id: r.id,
  userId: r.user_id,
  publicKey: r.public_key,
  counter: Number(r.counter),
  backedUp: r.backed_up,
  transports: (r.transports ?? undefined) as StoredCredential['transports'],
  aaguid: r.aaguid ?? undefined,
})

// ---- Users --------------------------------------------------------------------------------------------------

export async function getUser(userName: string) {
  const row = must(await useSupabase().from('app_users').select('*').eq('user_name', userName).maybeSingle())
  return row ? toUser(row) : null
}

export async function getUserById(id: string) {
  const row = must(await useSupabase().from('app_users').select('*').eq('id', id).maybeSingle())
  return row ? toUser(row) : null
}

/** Throws 409 when the name is taken (enforced by a unique constraint, so races can't create duplicates). */
export async function createUser(input: { userName: string; displayName: string }) {
  const row = must(
    await useSupabase()
      .from('app_users')
      .insert({ user_name: input.userName, display_name: input.displayName })
      .select()
      .single(),
  )
  return toUser(row!)
}

export async function deleteUser(id: string) {
  await useSupabase().from('app_users').delete().eq('id', id)
}

// ---- Passkeys -----------------------------------------------------------------------------------------------

export async function saveCredential(userId: string, c: WebAuthnCredential) {
  must(
    await useSupabase().from('passkeys').insert({
      id: c.id,
      user_id: userId,
      public_key: c.publicKey,
      counter: c.counter,
      backed_up: c.backedUp,
      transports: c.transports ?? null,
      aaguid: c.aaguid ?? null,
    }),
  )
}

export async function getCredential(id: string) {
  const row = must(await useSupabase().from('passkeys').select('*').eq('id', id).maybeSingle())
  return row ? toCredential(row) : null
}

export async function getUserCredentials(userId: string) {
  const rows = must(await useSupabase().from('passkeys').select('*').eq('user_id', userId)) ?? []
  return rows.map(toCredential)
}

export async function updateCredentialCounter(id: string, counter: number) {
  must(await useSupabase().from('passkeys').update({ counter }).eq('id', id))
}

// ---- WebAuthn challenges: single use, expire after 5 minutes ------------------------------------------

const CHALLENGE_TTL_MS = 5 * 60 * 1000

export const challengeStore = {
  async storeChallenge(_event: unknown, challenge: string, attemptId: string) {
    const db = useSupabase()
    await db.from('webauthn_challenges').delete().lt('expires_at', new Date().toISOString()) // tidy up old ones
    must(
      await db.from('webauthn_challenges').insert({
        attempt_id: attemptId,
        challenge,
        expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      }),
    )
  },

  /** Delete-and-return in one statement, so a challenge can never be used twice. */
  async getChallenge(_event: unknown, attemptId: string) {
    const row = must<Tables<'webauthn_challenges'>>(
      await useSupabase().from('webauthn_challenges').delete().eq('attempt_id', attemptId).select().maybeSingle(),
    )
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      throw createError({ statusCode: 400, message: 'challenge_expired' })
    }
    return row.challenge
  },
}
