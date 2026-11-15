// Which budget thresholds were already announced. Scoped to the session's user id.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return listBudgetAlerts(scope)
})
