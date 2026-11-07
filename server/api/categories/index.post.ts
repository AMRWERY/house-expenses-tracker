export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const input = parseCategoryInput(await readBody(event))
  return createCategory(user.id, input)
})
