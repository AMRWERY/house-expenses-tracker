export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseId(getRouterParam(event, 'id'))
  const input = parseExpenseInput(await readBody(event))

  const record = await updateExpense(user.id, id, input)
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})
