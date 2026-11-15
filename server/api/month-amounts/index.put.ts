// Set (or change) the main amount for one month: body { y, m, amount }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'admin')
  const input = parseMonthAmountInput(await readBody(event))
  return setMonthAmount(scope, input)
})
