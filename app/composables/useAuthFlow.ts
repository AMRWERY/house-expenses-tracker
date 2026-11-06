/**
 * Sign-in flows.
 *  - Desktop: email + password (Supabase Auth, via /api/auth/*).
 *  - Phone:   fingerprint / Face ID with the passkey that was linked to the account from desktop
 *             (nuxt-auth-utils' useWebAuthn, via /api/webauthn/*).
 * Both end the same way: the server sets a session cookie for the same Supabase user.
 */
import { startAuthentication } from '@simplewebauthn/browser'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ // e.g. test@house.com

/**
 * Passkey sign-in (same two-step exchange nuxt-auth-utils' authenticate() does), written out here so we
 * can see WHICH passkey the person picked. If the server doesn't know it (e.g. an old passkey left on the
 * phone from before accounts moved to email), we tell the phone to forget it with the WebAuthn Signal API
 * (Chrome 132+), so it stops being offered. Browsers without the API just ignore this.
 */
async function authenticateWithPasskey(): Promise<boolean> {
  const { requestOptions, attemptId } = await $fetch<{
    requestOptions: Parameters<typeof startAuthentication>[0]['optionsJSON']
    attemptId: string
  }>('/api/webauthn/authenticate', { method: 'POST', body: { verify: false } })

  const response = await startAuthentication({ optionsJSON: requestOptions })

  try {
    const result = await $fetch<{ verified?: boolean }>('/api/webauthn/authenticate', {
      method: 'POST',
      body: { attemptId, response, verify: true },
    })
    return !!result?.verified
  } catch (e) {
    const err = e as { data?: { message?: string } }
    if (err.data?.message === 'unknown_credential') {
      const pkc = (window as unknown as { PublicKeyCredential?: { signalUnknownCredential?: (o: object) => Promise<void> } })
        .PublicKeyCredential
      try {
        await pkc?.signalUnknownCredential?.({ rpId: location.hostname, credentialId: response.id })
      } catch {
        /* best effort */
      }
    }
    throw e
  }
}

export function useAuthFlow() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { isSupported } = useWebAuthn()
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
    if (msg === 'unknown_credential') return t('no_passkey')
    if (status === 429) return t('rate_limited')
    if (status === 401 && msg === 'invalid_credentials') return t('invalid_credentials')
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') return t('auth_cancelled') // dismissed the prompt
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

  /** Phone: the device offers the passkey linked to the account; the server verifies it. */
  const signInWithPasskey = () => run(() => authenticateWithPasskey())

  return { isSupported, busy, error, notice, signInWithPassword, signUpWithPassword, signInWithPasskey }
}
