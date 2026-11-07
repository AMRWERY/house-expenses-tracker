// Deleting a category moves its expenses to another category (see deleteCategory); `movedTo` says which.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = parseCategoryId(getRouterParam(event, 'id'))

  const result = await deleteCategory(user.id, id)
  if (!result) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true, movedTo: result.movedTo }
})
