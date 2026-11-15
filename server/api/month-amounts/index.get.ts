// The signed-in user's main amount for every month they set one. Scoped to the session's user id.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return listMonthAmounts(scope)
})
