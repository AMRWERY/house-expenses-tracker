export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseId(getRouterParam(event, 'id'))
  const input = parseExpenseInput(await readBody(event))

  const list = await loadExpenses(user.id)
  if (!list.some(e => e.id === id)) throw createError({ statusCode: 404, message: 'not_found' })

  const record: ExpenseRecord = { id, ...input }
  await saveExpenses(user.id, list.map(e => (e.id === id ? record : e)))
  return record
})
