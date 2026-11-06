export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const input = parseExpenseInput(await readBody(event))
  return createExpense(user.id, input)
})
