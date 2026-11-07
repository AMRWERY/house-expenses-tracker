/**
 * Sign-in flow: email + password (Supabase Auth, via /api/auth/*).
 * The server sets a session cookie for the Supabase user.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ // e.g. test@house.com

export function useAuthFlow() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { fetch: refreshSession } = useUserSession()

  const busy = ref(false)
  const error = ref('')
  const notice = ref('')

  // Turn whatever went wrong into a short message for the person.
  function describe(e: unknown): string {
    const err = e as { name?: string; statusCode?: number; status?: number; data?: { message?: string } }
    const status = err.statusCode ?? err.status
    const msg = err.data?.message
    if (msg === 'invalid_email') return t('invalid_email')
    if (msg === 'weak_password') return t('weak_password')
    if (msg === 'email_not_confirmed') return t('email_not_confirmed')
    if (msg === 'email_exists') return t('email_exists')
    if (status === 429) return t('rate_limited')
    if (status === 401 && msg === 'invalid_credentials') return t('invalid_credentials')
    return t('auth_failed')
  }

  /** `action` resolves 'done' (signed in), 'notice' (show the message, stay here) or false (failed). */
  async function run(action: () => Promise<'done' | 'notice' | boolean | undefined>) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await action()
      if (result === 'notice') return
      if (!result) throw new Error('not verified')
      await refreshSession()
      // The middleware loads this user's expenses on arrival.
      await navigateTo(localePath('/'))
    } catch (e) {
      error.value = describe(e)
    } finally {
      busy.value = false
    }
  }

  const signInWithPassword = (email: string, password: string) =>
    run(async () => {
      await $fetch('/api/auth/login', { method: 'POST', body: { email, password } })
      return 'done'
    })

  const signUpWithPassword = (email: string, password: string) =>
    run(async () => {
      const res = await $fetch<{ needsConfirmation: boolean }>('/api/auth/register', {
        method: 'POST',
        body: { email, password },
      })
      if (res.needsConfirmation) {
        notice.value = t('check_email') // confirm the address first, then sign in
        return 'notice'
      }
      return 'done'
    })

  return { busy, error, notice, signInWithPassword, signUpWithPassword }
}
