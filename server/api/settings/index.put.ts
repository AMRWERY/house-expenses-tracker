// Update settings: body { rolloverEnabled, y, m }.
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'admin')
  return saveSettings(scope, parseSettingsInput(await readBody(event)))
})
