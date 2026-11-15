// The signed-in user's recurring expense rules.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return listRecurring(scope)
})
