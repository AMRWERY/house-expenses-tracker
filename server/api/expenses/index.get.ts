// The signed-in user's expenses. Every expense route is scoped to the session's user id.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return listExpenses(user.id)
})
