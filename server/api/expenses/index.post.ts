export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const input = parseExpenseInput(await readBody(event))

  const list = await loadExpenses(user.id)
  const record: ExpenseRecord = { id: Math.max(0, ...list.map(e => e.id)) + 1, ...input }
  await saveExpenses(user.id, [...list, record])
  return record
})
