export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseUuid(getRouterParam(event, 'id'))
  if (!(await deleteTemplate(scope, id))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
