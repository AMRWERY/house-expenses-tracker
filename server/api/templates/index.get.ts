// The signed-in user's expense templates.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return listTemplates(scope)
})
