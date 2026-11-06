// Link a phone's fingerprint / Face ID to the account that is signed in RIGHT NOW (from desktop).
//
// The passkey is saved against the session's user id, never against anything the client sends, so a
// passkey can only ever be attached to the account whose owner is signed in. That is what makes the
// phone's biometrics and the email account the same person.
export default defineWebAuthnRegisterEventHandler({
  ...challengeStore,

  getOptions: () => ({
    rpName: 'مصروفات البيت',
    // Offer "use a phone or tablet" (QR code / Bluetooth) so the PHONE creates the passkey and
    // protects it with its own fingerprint / Face ID. Discoverable, so sign-in needs no typing.
    hints: ['hybrid'],
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',
      residentKey: 'required',
      userVerification: 'required',
    },
  }),

  // The signed-in account decides who this passkey is for.
  async validateUser(_body, event) {
    const { user } = await requireUserSession(event)
    return { userName: user.email, displayName: user.email }
  },

  // Don't register the same phone twice.
  async excludeCredentials(event) {
    const { user } = await requireUserSession(event)
    const existing = await getUserCredentials(user.id)
    return existing.map(c => ({ id: c.id, transports: c.transports }))
  },

  async onSuccess(event, { credential, registrationInfo }) {
    // The library doesn't enforce this; we do: the biometric / PIN check must have happened.
    if (!registrationInfo.userVerified) {
      throw createError({ statusCode: 400, message: 'verification_required' })
    }
    const { user } = await requireUserSession(event)
    await saveCredential(user.id, credential)
  },
})
