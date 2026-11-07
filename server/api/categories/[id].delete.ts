// Deleting a category moves its expenses to "other" (see deleteCategory).
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseCategoryId(getRouterParam(event, 'id'))

  if (!(await deleteCategory(user.id, id))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
