// The households the signed-in person belongs to (their personal one, and shared ones), with the active one marked.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return listMyHouseholds(scope)
})
