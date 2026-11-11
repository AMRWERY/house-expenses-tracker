// A random Ayah for the "opened the app" dialog. ?lang=en adds the English translation.
export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { lang } = getQuery(event)
  setHeader(event, 'Cache-Control', 'no-store') // a new random Ayah every time
  try {
    return await fetchRandomAyah(lang === 'en')
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'ayah_unavailable' })
  }
})
