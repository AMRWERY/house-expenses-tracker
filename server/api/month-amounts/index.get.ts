// The signed-in user's main amount for every month they set one. Scoped to the session's user id.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return listMonthAmounts(user.id)
})
