import type { WebAuthnCredential } from '#auth-utils'
import type { Tables } from '../../app/types/database.types'

/**
 * Passkeys (fingerprint / Face ID) and one-time WebAuthn challenges, stored in Supabase Postgres.
 * Accounts themselves live in Supabase Auth (email + password); a passkey row's `user_id` is that
 * auth user's id, which is what ties a phone's biometrics to the person's email account.
 */

export interface StoredCredential extends WebAuthnCredential {
  userId: string
}

const toCredential = (r: Tables<'passkeys'>): StoredCredential => ({
  id: r.id,
  userId: r.user_id,
  publicKey: r.public_key,
  counter: Number(r.counter),
  backedUp: r.backed_up,
  transports: (r.transports ?? undefined) as StoredCredential['transports'],
  aaguid: r.aaguid ?? undefined,
})

// ---- Accounts (Supabase Auth) -------------------------------------------------------------------------------

/** Email of an auth user, or null if the account no longer exists. */
export async function getAuthUserEmail(userId: string) {
  const { data, error } = await useSupabase().auth.admin.getUserById(userId)
  if (error || !data.user?.email) return null
  return data.user.email
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

/** For the Settings list of linked devices. */
export async function listPasskeys(userId: string) {
  const rows =
    must(
      await useSupabase().from('passkeys').select('id, created_at, backed_up').eq('user_id', userId).order('created_at'),
    ) ?? []
  return rows.map(r => ({ id: r.id, createdAt: r.created_at, backedUp: r.backed_up }))
}

/** Returns false when the passkey doesn't exist or belongs to someone else. */
export async function deletePasskey(userId: string, id: string) {
  const row = must(
    await useSupabase().from('passkeys').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle(),
  )
  return !!row
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
