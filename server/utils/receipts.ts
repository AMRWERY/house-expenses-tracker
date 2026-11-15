// Receipt photos live in a private Supabase Storage bucket, one file per expense, named "<user id>/<expense id>".
// The browser never gets a storage URL: it asks /api/expenses/<id>/receipt, which checks the session AND that the
// expense belongs to that user before streaming the file. Deleting the expense (or the receipt) deletes the file.
// Receipts are not part of a JSON backup (they are files, not data rows).
const BUCKET = 'receipts'
/** The app resizes to at most 1600px before sending, so real uploads are a few hundred KB; this is a generous ceiling. */
const MAX_BYTES = 1536 * 1024

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/

const bad = (message: string) => createError({ statusCode: 400, message })

function looksLike(mime: string, b: Buffer) {
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (mime === 'image/png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  return b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP'
}

/** Validate a receipt sent as a data URL (png, jpeg or webp). Throws 400 `invalid_image` otherwise. */
export function parseReceipt(value: unknown) {
  if (typeof value !== 'string' || value.length > Math.ceil((MAX_BYTES * 4) / 3) + 64) throw bad('invalid_image')
  const match = DATA_URL_RE.exec(value)
  if (!match) throw bad('invalid_image')
  const mime = match[1] as string
  const bytes = Buffer.from(match[2] as string, 'base64')
  if (bytes.length === 0 || bytes.length > MAX_BYTES || !looksLike(mime, bytes)) throw bad('invalid_image')
  return { mime, bytes }
}

let bucketReady = false
async function ensureBucket() {
  if (bucketReady) return
  const { error } = await useSupabase().storage.createBucket(BUCKET, { public: false, fileSizeLimit: 2 * 1024 * 1024 })
  if (error && !/already exists|duplicate/i.test(error.message)) {
    console.error('[receipt] bucket', error.message)
    throw createError({ statusCode: 500, message: 'receipt_failed' })
  }
  bucketReady = true
}

const pathFor = (scope: Scope, expenseId: number) => `${scope.householdId}/${expenseId}`

/** The expense row, or null when it isn't in this household. Writing a receipt needs the same right as editing the expense (own, or admin). */
async function ownedExpense(scope: Scope, expenseId: number, forWrite = false) {
  const row = must(
    await useSupabase().from('expenses').select('id, receipt_path, created_by').eq('id', expenseId).eq("household_id", scope.householdId).maybeSingle(),
  )
  if (row && forWrite && !canChangeRecord(scope, row.created_by)) throw createError({ statusCode: 403, message: 'forbidden' })
  return row
}

export async function saveReceipt(scope: Scope, expenseId: number, receipt: { mime: string; bytes: Buffer }) {
  if (!(await ownedExpense(scope, expenseId, true))) return false
  await ensureBucket()
  const path = pathFor(scope, expenseId)
  const { error } = await useSupabase().storage.from(BUCKET).upload(path, receipt.bytes, { contentType: receipt.mime, upsert: true })
  if (error) {
    console.error('[receipt] upload', error.message)
    throw createError({ statusCode: 500, message: 'receipt_failed' })
  }
  must(await useSupabase().from('expenses').update({ receipt_path: path }).eq('id', expenseId).eq("household_id", scope.householdId))
  return true
}

/** The receipt, or null when the expense isn't this user's or has none. */
export async function readReceipt(scope: Scope, expenseId: number) {
  const row = await ownedExpense(scope, expenseId)
  if (!row?.receipt_path) return null
  await ensureBucket()
  const { data, error } = await useSupabase().storage.from(BUCKET).download(row.receipt_path)
  if (error || !data) return null
  return { mime: data.type || 'image/jpeg', bytes: Buffer.from(await data.arrayBuffer()) }
}

/** Delete the receipt file and forget it. Returns false when the expense isn't this user's. */
export async function removeReceipt(scope: Scope, expenseId: number) {
  const row = await ownedExpense(scope, expenseId, true)
  if (!row) return false
  if (row.receipt_path) await deleteReceiptFile(row.receipt_path)
  must(await useSupabase().from('expenses').update({ receipt_path: null }).eq('id', expenseId).eq("household_id", scope.householdId))
  return true
}

/** Remove a stored file. Missing files are fine; other failures are logged (the expense row is already gone). */
export async function deleteReceiptFile(path: string) {
  const { error } = await useSupabase().storage.from(BUCKET).remove([path])
  if (error) console.error('[receipt] remove', error.message)
}
