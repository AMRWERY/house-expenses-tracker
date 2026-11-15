export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  if (!(await removeReceipt(scope, parseId(getRouterParam(event, 'id'))))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
