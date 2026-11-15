// The signed-in user's income records.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'viewer')
  return listIncomes(scope)
})
