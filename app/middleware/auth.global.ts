// Everything except /login requires a signed-in session. The session cookie is verified on the server;
// this only decides where to send the person. The /api/expenses routes enforce it again.
export default defineNuxtRouteMiddleware(async (to) => {
  if (isDemo(to.query)) return // dev-only preview frames

  const path = to.path.replace(/^\/(ar|en)(?=\/|$)/, '') || '/'
  if (import.meta.dev && path === '/preview') return // dev-only design preview page

  const { loggedIn, clear } = useUserSession()
  const localePath = useLocalePath()

  if (!loggedIn.value) return path === '/login' ? undefined : navigateTo(localePath('/login'))
  if (path === '/login') return navigateTo(localePath('/'))

  try {
    await loadExpenses()
  } catch {
    // Session no longer valid on the server (expired / reset): start over at the login screen.
    await clear()
    resetExpenses()
    return navigateTo(localePath('/login'))
  }
})
