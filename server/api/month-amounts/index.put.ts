// Set (or change) the main amount for one month: body { y, m, amount }.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const input = parseMonthAmountInput(await readBody(event))
  return setMonthAmount(user.id, input)
})
