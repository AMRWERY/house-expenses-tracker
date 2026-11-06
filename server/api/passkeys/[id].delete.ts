// Unlink a phone (e.g. a lost one). Only the account's own passkeys can be removed.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id || id.length > 512) throw createError({ statusCode: 400, message: 'invalid_id' })

  if (!(await deletePasskey(user.id, id))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
