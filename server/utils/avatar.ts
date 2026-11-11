// Profile pictures live in a private Supabase Storage bucket, one file per person (named by their user id).
// The browser never gets a storage URL: it asks /api/avatar, which checks the session and streams the file.
const BUCKET = 'avatars'
/** The app resizes to 256x256 before sending, so real uploads are a few dozen KB; this is a generous ceiling. */
const MAX_BYTES = 300 * 1024

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/

const bad = (message: string) => createError({ statusCode: 400, message })

/** Does the file really start like the image type it claims? (A data URL's label alone proves nothing.) */
function looksLike(mime: string, b: Buffer) {
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (mime === 'image/png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  return b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP'
}

/** Validate a picture sent as a data URL (png, jpeg or webp, small). Throws 400 `invalid_image` otherwise. */
export function parseAvatar(value: unknown) {
  if (typeof value !== 'string' || value.length > Math.ceil((MAX_BYTES * 4) / 3) + 64) throw bad('invalid_image')
  const match = DATA_URL_RE.exec(value)
  if (!match) throw bad('invalid_image')
  const mime = match[1] as string
  const bytes = Buffer.from(match[2] as string, 'base64')
  if (bytes.length === 0 || bytes.length > MAX_BYTES || !looksLike(mime, bytes)) throw bad('invalid_image')
  return { mime, bytes }
}

let bucketReady = false
/** Create the private bucket the first time it is needed (also created by the avatars migration). */
async function ensureBucket() {
  if (bucketReady) return
  const { error } = await useSupabase().storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_BYTES })
  if (error && !/already exists|duplicate/i.test(error.message)) {
    console.error('[avatar] bucket', error.message)
    throw createError({ statusCode: 500, message: 'avatar_failed' })
  }
  bucketReady = true
}

export async function saveAvatar(userId: string, avatar: { mime: string; bytes: Buffer }) {
  await ensureBucket()
  const { error } = await useSupabase().storage.from(BUCKET).upload(userId, avatar.bytes, {
    contentType: avatar.mime,
    upsert: true,
  })
  if (error) {
    console.error('[avatar] upload', error.message)
    throw createError({ statusCode: 500, message: 'avatar_failed' })
  }
}

/** Does this person have an uploaded picture? */
export async function hasAvatar(userId: string) {
  await ensureBucket()
  const { data, error } = await useSupabase().storage.from(BUCKET).list('', { search: userId, limit: 5 })
  if (error) {
    console.error('[avatar] list', error.message)
    throw createError({ statusCode: 500, message: 'avatar_failed' })
  }
  return (data ?? []).some((f) => f.name === userId)
}

/** Delete the person's picture so the default one is used again. Removing a missing file is fine. */
export async function removeAvatar(userId: string) {
  await ensureBucket()
  const { error } = await useSupabase().storage.from(BUCKET).remove([userId])
  if (error) {
    console.error('[avatar] remove', error.message)
    throw createError({ statusCode: 500, message: 'avatar_failed' })
  }
}

/** The person's picture, or null when they never uploaded one. */
export async function readAvatar(userId: string) {
  await ensureBucket()
  const { data, error } = await useSupabase().storage.from(BUCKET).download(userId)
  if (error || !data) return null
  return { mime: data.type || 'image/jpeg', bytes: Buffer.from(await data.arrayBuffer()) }
}
