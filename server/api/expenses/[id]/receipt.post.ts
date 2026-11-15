// Attach (or replace) a receipt. Body: { image: "data:image/jpeg;base64,..." }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  const id = parseId(getRouterParam(event, 'id'))
  const receipt = parseReceipt(((await readBody(event)) ?? {}).image)
  if (!(await saveReceipt(scope, id, receipt))) throw createError({ statusCode: 404, message: 'not_found' })
  return { ok: true }
})
