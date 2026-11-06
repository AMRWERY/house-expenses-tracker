// Create an account: the person picks a name and registers a passkey (fingerprint / Face ID).
export default defineWebAuthnRegisterEventHandler({
  ...challengeStore,

  // Ask for a platform authenticator (the phone's own biometrics) with user verification,
  // and a discoverable credential so sign-in doesn't need the name typed again.
  getOptions: () => ({
    rpName: 'مصروفات البيت',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      userVerification: 'required',
    },
  }),

  // Runs on both steps. A name that already exists is rejected: otherwise anyone could
  // attach their own passkey to someone else's account and sign in as them.
  async validateUser(body) {
    const userName = normalizeUserName(String(body.userName ?? ''))
    const displayName = String(body.displayName ?? body.userName ?? '').trim().slice(0, 40)
    if (userName.length < 2 || userName.length > 40 || !/^[\p{L}\p{N}_. -]+$/u.test(userName)) {
      throw createError({ statusCode: 400, message: 'invalid_name' })
    }
    if (await getUser(userName)) {
      throw createError({ statusCode: 409, message: 'user_exists' })
    }
    return { userName, displayName: displayName || userName }
  },

  async onSuccess(event, { user, credential, registrationInfo }) {
    // The library doesn't enforce this; we do: the biometric / PIN check must have happened.
    if (!registrationInfo.userVerified) {
      throw createError({ statusCode: 400, message: 'verification_required' })
    }
    if (await getUser(user.userName)) {
      throw createError({ statusCode: 409, message: 'user_exists' }) // lost a race
    }

    const stored: StoredUser = {
      id: crypto.randomUUID(),
      userName: user.userName,
      displayName: user.displayName ?? user.userName,
      createdAt: Date.now(),
    }
    await saveUser(stored)
    await saveCredential({ ...credential, userName: stored.userName })

    await setUserSession(event, {
      user: { id: stored.id, userName: stored.userName, displayName: stored.displayName },
    })
  },
})
