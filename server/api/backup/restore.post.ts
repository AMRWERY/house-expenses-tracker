// Add the contents of a backup file to the signed-in user's data (merge; never deletes, repeatable).
export default defineEventHandler(async (event) => {
  const scope = await requireScope(event, 'admin')
  const file = parseBackup(await readBody(event))
  return restoreBackup(scope, file)
})
