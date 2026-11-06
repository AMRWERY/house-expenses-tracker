import { createClient, type SupabaseClient } from '@supabase/supabase-js'
// Type-only import (erased at build): table and column names are checked against the schema.
import type { Database } from '../../app/types/database.types'

/**
 * Server-only Supabase client using the SECRET (service role) key.
 * It bypasses Row Level Security, so every query must be scoped to the signed-in user.
 * Never import this from app/ code: the secret key must not reach the browser.
 *
 * Env (see .env): SUPABASE_URL, SUPABASE_SECRET_KEY.
 * (SUPABASE_KEY, the publishable key, isn't needed: the browser never talks to Supabase directly.)
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

/** Unwrap a Supabase result. Details go to the server log, never to the client. */
export function must<T>(res: { data: T | null; error: { code?: string; message: string } | null }, status = 500): T | null {
  if (res.error) {
    if (res.error.code === '23505') throw createError({ statusCode: 409, message: 'conflict' }) // unique violation
    console.error('[supabase]', res.error.code, res.error.message)
    throw createError({ statusCode: status, message: 'database_error' })
  }
  return res.data
}
