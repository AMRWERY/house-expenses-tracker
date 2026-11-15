// Deleting a category moves its expenses to another category (see deleteCategory); `movedTo` says which.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'admin')
  const id = parseCategoryId(getRouterParam(event, 'id'))

  const result = await deleteCategory(scope, id)
  if (!result) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true, movedTo: result.movedTo }
})
