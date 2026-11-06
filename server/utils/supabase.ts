import { createClient, type SupabaseClient } from '@supabase/supabase-js'
// Type-only import (erased at build): table and column names are checked against the schema.
import type { Database } from '../../app/types/database.types'

/**
 * Server-only Supabase client using the SECRET (service role) key.
 * It bypasses Row Level Security, so every query must be scoped to the signed-in user.
 * Never import this from app/ code: the secret key must not reach the browser.
 *
 * Env (see .env): SUPABASE_URL, SUPABASE_SECRET_KEY, and SUPABASE_KEY (publishable) for email/password sign-in.
 * The browser never talks to Supabase directly; everything goes through our /api routes.
 */
let client: SupabaseClient<Database> | undefined

export function useSupabase(): SupabaseClient<Database> {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) {
    throw createError({ statusCode: 500, message: 'server_not_configured' })
  }
  client = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

/**
 * A fresh client for email + password sign-in/sign-up, using the publishable key (the normal key for
 * auth flows). Create one per request and never share it: after signing in it holds that person's
 * Supabase session in memory.
 */
export function newAuthClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_KEY
  if (!url || !key) throw createError({ statusCode: 500, message: 'server_not_configured' })
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/** Unwrap a Supabase result. Details go to the server log, never to the client. */
export function must<T>(res: { data: T | null; error: { code?: string; message: string } | null }, status = 500): T | null {
  if (res.error) {
    if (res.error.code === '23505') throw createError({ statusCode: 409, message: 'conflict' }) // unique violation
    console.error('[supabase]', res.error.code, res.error.message)
    throw createError({ statusCode: status, message: 'database_error' })
  }
  return res.data
}
