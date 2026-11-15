export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'admin')
  const id = parseCategoryId(getRouterParam(event, 'id'))
  const input = parseCategoryInput(await readBody(event))

  const record = await updateCategory(scope, id, input)
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})
