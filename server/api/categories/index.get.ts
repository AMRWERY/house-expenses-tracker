// The signed-in user's custom categories (the built-in ones live in the app).
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return listCategories(user.id)
})
