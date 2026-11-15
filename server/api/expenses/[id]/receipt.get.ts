// The receipt photo of one of the signed-in user's expenses.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  const receipt = await readReceipt(scope, parseId(getRouterParam(event, 'id')))
  if (!receipt) throw createError({ statusCode: 404, message: 'not_found' })

  setHeader(event, 'Content-Type', receipt.mime)
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return receipt.bytes
})
