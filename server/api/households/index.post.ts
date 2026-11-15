// Create a shared household; the creator is its owner. Body: { name }.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  await ensurePersonalHousehold(user.id)
  return createHousehold(user.id, parseHouseholdName(await readBody(event)))
})
