// Everything except /login requires a signed-in session. The session cookie is verified on the server;
// this only decides where to send the person. The /api/expenses routes enforce it again.
const statusOf = (e: unknown) => {
  const err = e as { statusCode?: number; status?: number; response?: { status?: number } }
  return err?.statusCode ?? err?.status ?? err?.response?.status
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (isDemo(to.query)) return // dev-only preview frames

  const path = to.path.replace(/^\/(ar|en)(?=\/|$)/, '') || '/'
  if (import.meta.dev && path === '/preview') return // dev-only design preview page

  const { loggedIn, clear } = useUserSession()
  const localePath = useLocalePath()

  if (!loggedIn.value) return path === '/login' ? undefined : navigateTo(localePath('/login'))
  if (path === '/login') return navigateTo(localePath('/'))

  // Only a 401 means the session is really gone. Anything else (a cold serverless function, a slow
  // database call) is temporary: retry once, and if it still fails let the page open, since the
  // expenses load again on the next navigation. Signing the person out for a hiccup is what made a
  // first sign-in look like it failed.
  const signOut = async () => {
    await clear()
    resetExpenses()
    return navigateTo(localePath('/login'))
  }

  try {
    await loadExpenses()
  } catch (first) {
    if (statusOf(first) === 401) return signOut()
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      await loadExpenses()
    } catch (second) {
      if (statusOf(second) === 401) return signOut()
    }
  }
})
