export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseId(getRouterParam(event, 'id'))

  const list = await loadExpenses(user.id)
  if (!list.some(e => e.id === id)) throw createError({ statusCode: 404, message: 'not_found' })

  await saveExpenses(user.id, list.filter(e => e.id !== id))
  return { ok: true }
})
