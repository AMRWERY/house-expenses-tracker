// Sign in with a passkey. The server verifies the signed challenge against the stored public key.
export default defineWebAuthnAuthenticateEventHandler({
  ...challengeStore,

  getOptions: () => ({ userVerification: 'required' }),

  // Only used when a name was typed; otherwise the device offers its saved passkeys.
  async allowCredentials(_event, userName) {
    const creds = await getUserCredentials(normalizeUserName(userName))
    return creds.map(c => ({ id: c.id, transports: c.transports }))
  },

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

    // Keep the signature counter current (helps detect cloned authenticators).
    await saveCredential({ ...(credential as StoredCredential), counter: authenticationInfo.newCounter })

    const user = await getUser((credential as StoredCredential).userName)
    if (!user) throw createError({ statusCode: 401, message: 'unknown_user' })

    await setUserSession(event, {
      user: { id: user.id, userName: user.userName, displayName: user.displayName },
    })
  },
})
