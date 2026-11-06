/**
 * Fingerprint / Face ID app lock, mobile only.
 *
 * VueUse has no WebAuthn composable, so this wraps the browser's native WebAuthn API
 * (navigator.credentials) with a *platform* authenticator and `userVerification: "required"`,
 * which is what triggers the device's fingerprint / Face ID prompt.
 * VueUse is used for the pieces it does cover: useMediaQuery, useLocalStorage, useSessionStorage.
 *
 * Note: there is no server in this app, so this is a device-local lock. The assertion is not
 * verified by a backend; it proves the person at the device passed biometric verification.
 */

const toB64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n))

export function useBiometric() {
  const route = useRoute()
  const { t } = useI18n()

  const previewAvailable = route.query.bio === '1' // preview page: pretend this device supports it
  const forcedLock = route.query.lock === '1' // preview page: show the lock screen

  const credentialId = useLocalStorage('biometric-credential', '')
  const unlocked = useSessionStorage('unlocked', false) // clears when the tab / app session ends
  const touchDevice = useMediaQuery('(pointer: coarse) and (hover: none)') // phones & tablets

  // Is a fingerprint / Face ID sensor actually usable here?
  const platformReady = ref(false)
  onMounted(async () => {
    try {
      platformReady.value =
        !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    } catch {
      platformReady.value = false
    }
  })

  const available = computed(() => previewAvailable || (touchDevice.value && platformReady.value))
  const enabled = computed(() => !!credentialId.value)
  const locked = computed(() => forcedLock || (enabled.value && touchDevice.value && !unlocked.value))

  const busy = ref(false)
  const error = ref('')

  /** Ask for the fingerprint / Face ID. Resolves true when the person passed verification. */
  async function verify(): Promise<boolean> {
    if (!credentialId.value) return false
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: random(32),
        allowCredentials: [{ type: 'public-key', id: fromB64(credentialId.value), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    return !!result
  }

  async function run(action: () => Promise<boolean>, failKey: string, silent = false) {
    if (busy.value) return false
    busy.value = true
    error.value = ''
    try {
      return await action()
    } catch {
      if (!silent) error.value = t(failKey) // cancelled, not allowed, or no secure context
      return false
    } finally {
      busy.value = false
    }
  }

  /** Unlock the app. `silent` is for the automatic attempt when the lock screen opens. */
  const unlock = (silent = false) =>
    run(async () => {
      const ok = await verify()
      if (ok) unlocked.value = true
      return ok
    }, 'unlock_failed', silent)

  /** Turn the lock on: registers a credential on this device (prompts for fingerprint / Face ID). */
  const enable = () =>
    run(async () => {
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: random(32),
          rp: { name: t('app_title'), id: location.hostname },
          user: { id: random(16), name: 'home-expenses', displayName: t('app_title') },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
          timeout: 60_000,
        },
      })) as PublicKeyCredential | null
      if (!cred) return false
      credentialId.value = toB64(cred.rawId)
      unlocked.value = true // the person just verified
      return true
    }, 'biometric_enable_failed')

  /** Turn the lock off, after confirming with fingerprint / Face ID. */
  const disable = () =>
    run(async () => {
      if (!(await verify())) return false
      credentialId.value = ''
      return true
    }, 'unlock_failed')

  return { available, enabled, locked, busy, error, unlock, enable, disable }
}
