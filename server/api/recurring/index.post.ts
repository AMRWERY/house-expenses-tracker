export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  return createRecurring(scope, parseRecurringInput(await readBody(event)))
})
