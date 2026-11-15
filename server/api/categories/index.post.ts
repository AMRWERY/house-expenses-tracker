export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'admin')
  const input = parseCategoryInput(await readBody(event))
  return createCategory(scope, input)
})
