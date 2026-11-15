export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  return createIncome(scope, parseIncomeInput(await readBody(event)))
})
