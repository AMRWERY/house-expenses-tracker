// Phones linked to the signed-in account.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return listPasskeys(user.id)
})
