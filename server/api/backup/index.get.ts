// Download everything the signed-in user owns as one JSON file. Scoped to the session's user id.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return buildBackup(scope)
})
