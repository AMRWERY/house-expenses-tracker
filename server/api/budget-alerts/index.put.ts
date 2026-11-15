// Record an announced threshold: body { scope, y, m, level }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return raiseBudgetAlert(scope, parseBudgetAlert(await readBody(event)))
})
