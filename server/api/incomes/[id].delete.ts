export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseId(getRouterParam(event, 'id'))
  if (!(await deleteIncome(scope, id))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
