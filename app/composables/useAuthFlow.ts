/**
 * Sign up / sign in with a passkey (fingerprint, Face ID, Windows Hello, ...), using nuxt-auth-utils'
 * useWebAuthn(). The server (server/api/webauthn) verifies everything and sets the session cookie.
 */
export function useAuthFlow() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { register, authenticate, isSupported } = useWebAuthn()
  const { fetch: refreshSession } = useUserSession()

  const busy = ref(false)
  const error = ref('')

  // Turn whatever went wrong into a short message for the person.
  function describe(e: unknown): string {
    const err = e as { name?: string; statusCode?: number; status?: number; data?: { message?: string } }
    const status = err.statusCode ?? err.status
    if (status === 409) return t('user_exists')
    if (status === 400 && err.data?.message === 'invalid_name') return t('invalid_name')
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') return t('auth_cancelled') // dismissed the prompt
    return t('auth_failed')
  }

  async function run(action: () => Promise<boolean | undefined>) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      if (!(await action())) throw new Error('not verified')
      await refreshSession()
      // The middleware loads this user's expenses on arrival.
      await navigateTo(localePath('/'))
    } catch (e) {
      error.value = describe(e)
    } finally {
      busy.value = false
    }
  }

  /** Sign in with an existing passkey (the device lists the saved ones; no name needed). */
  const signIn = () => run(() => authenticate())

  /** Create an account: pick a name, then register a passkey with the device's biometrics. */
  const signUp = (name: string) => run(() => register({ userName: name, displayName: name.trim() }))

  return { isSupported, busy, error, signIn, signUp }
}
