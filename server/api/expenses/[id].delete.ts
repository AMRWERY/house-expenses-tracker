export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseId(getRouterParam(event, 'id'))

  if (!(await deleteExpense(user.id, id))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
