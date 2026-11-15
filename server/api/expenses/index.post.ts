export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const input = parseExpenseInput(await readBody(event))
  return createExpense(scope, input)
})
