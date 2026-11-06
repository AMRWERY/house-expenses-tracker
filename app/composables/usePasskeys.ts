export interface LinkedDevice {
  id: string
  createdAt: string
  backedUp: boolean
}

/**
 * Link a phone's fingerprint / Face ID to the signed-in account (done from desktop: the browser shows a
 * QR code, the phone scans it and confirms with its biometrics). The server saves the passkey against
 * the signed-in user's id, so the phone and the email account are the same person.
 */
export function usePasskeys() {
  const { t } = useI18n()
  const { register, isSupported } = useWebAuthn()
  const { user } = useUserSession()

  const devices = ref<LinkedDevice[]>([])
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')

  async function load() {
    if (!user.value) return
    try {
      devices.value = await $fetch<LinkedDevice[]>('/api/passkeys')
    } catch {
      devices.value = []
    }
  }

  async function link() {
    if (!user.value || busy.value) return
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      await register({ userName: user.value.email })
      notice.value = t('link_phone_done')
      await load()
    } catch (e) {
      const name = (e as { name?: string }).name
      error.value = name === 'NotAllowedError' || name === 'AbortError' ? t('auth_cancelled') : t('link_failed')
    } finally {
      busy.value = false
    }
  }

  async function unlink(id: string) {
    error.value = ''
    notice.value = ''
    try {
      await $fetch(`/api/passkeys/${encodeURIComponent(id)}`, { method: 'DELETE' })
      await load()
    } catch {
      error.value = t('link_failed')
    }
  }

  onMounted(load)

  return { isSupported, devices, busy, error, notice, link, unlink }
}
