// The signed-in user's settings.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return getSettings(scope)
})
