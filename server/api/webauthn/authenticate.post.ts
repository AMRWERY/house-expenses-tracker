// Sign in on the phone with fingerprint / Face ID. The device offers the passkey that was linked to the
// person's account; the server verifies the signed challenge, then loads THAT account (same email,
// same expenses as on desktop).
export default defineWebAuthnAuthenticateEventHandler({
  ...challengeStore,

  getOptions: () => ({ userVerification: 'required' }),

  async getCredential(_event, credentialId) {
    const cred = await getCredential(credentialId)
    if (!cred) throw createError({ statusCode: 401, message: 'unknown_credential' })
    return cred
  },

  async onSuccess(event, { credential, authenticationInfo }) {
    // The library doesn't enforce this; we do.
    if (!authenticationInfo.userVerified) {
      throw createError({ statusCode: 401, message: 'verification_required' })
    }

    const { id, userId } = credential as StoredCredential
    const email = await getAuthUserEmail(userId)
    if (!email) throw createError({ statusCode: 401, message: 'unknown_user' }) // account was deleted

    // Keep the signature counter current (helps detect cloned authenticators).
    await updateCredentialCounter(id, authenticationInfo.newCounter)

    await setUserSession(event, { user: { id: userId, email } })
  },
})
