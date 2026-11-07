export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseCategoryId(getRouterParam(event, 'id'))
  const input = parseCategoryInput(await readBody(event))

  const record = await updateCategory(user.id, id, input)
  if (!record) throw createError({ statusCode: 404, message: 'not_found' })
  return record
})
