export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'member')
  return createTemplate(scope, parseTemplateInput(await readBody(event)))
})
